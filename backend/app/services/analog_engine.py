import datetime
import math
from typing import Any, Dict, List, Optional

import httpx

from ..core.config import settings
from .archive_service import DAILY_VARS, FIELD_MAP, ArchiveService
from .weather_service import get_weather_desc

# Candidates must fall within this many days of today's day-of-year. The gate
# is load-bearing: without it a warm January day could match an August monsoon
# day on temperature and humidity alone, and the resulting "what came next"
# would describe dynamics that cannot occur in January.
SEASONAL_WINDOW_DAYS = 10

TOP_K = 8
OUTCOME_DAYS = 7
MIN_ANALOGS = 3

# Selected analogs must be at least this far apart. Set to OUTCOME_DAYS so no
# two analogs share a single day of outcome. Without this the top matches
# cluster inside one historical weather episode -- three days from the same
# week score similarly and would each contribute their near-identical
# aftermath, letting one event dominate every aggregate.
MIN_ANALOG_SEPARATION_DAYS = OUTCOME_DAYS

# Ordered by consequence to someone making a decision from the forecast.
FEATURE_WEIGHTS = {
    "precip": 2.0,
    "tmax": 1.5,
    "tmin": 1.5,
    "humidity": 1.0,
    "pressure": 1.0,
    "wind": 0.5,
}

# A day counts as wet at or above this many millimetres.
WET_DAY_MM = 1.0


def _doy_distance(a: int, b: int) -> int:
    """Circular day-of-year distance, so 31 Dec and 2 Jan are 2 days apart."""
    raw = abs(a - b)
    return min(raw, 365 - raw)


def _feature_vector(day: Dict[str, Any]) -> Dict[str, float]:
    """Six-dimensional fingerprint of a single day.

    Precipitation is log1p-transformed because it is zero-inflated and
    long-tailed; raw values would let one extreme day dominate the metric.
    """
    return {
        "precip": math.log1p(max(0.0, day["precip"])),
        "tmax": day["tmax"],
        "tmin": day["tmin"],
        "humidity": day["humidity"],
        "pressure": day["pressure"],
        "wind": day["wind"],
    }


class AnalogEngine:
    """Finds historical days resembling today and reports what followed them."""

    @staticmethod
    async def _fetch_today(lat: float, lon: float) -> Dict[str, Any]:
        """Read today's daily aggregates from the forecast API.

        The archive lags several days, so today's fingerprint comes from the
        forecast endpoint. The same six variables are requested from both
        sources to keep the vectors commensurable.
        """
        url = f"{settings.OPEN_METEO_URL}/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": ",".join(DAILY_VARS),
            "forecast_days": 1,
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url, params=params)
        except Exception as exc:
            raise RuntimeError(f"Could not read today's conditions: {exc}") from exc

        if resp.status_code != 200:
            raise RuntimeError(
                f"Forecast provider returned HTTP {resp.status_code} for today's conditions."
            )

        daily = (resp.json().get("daily") or {})
        times = daily.get("time") or []
        if not times:
            raise RuntimeError("Forecast provider returned no data for today.")

        record: Dict[str, Any] = {}
        for our_name, api_name in FIELD_MAP.items():
            column = daily.get(api_name) or []
            value = column[0] if column else None
            if value is None:
                raise RuntimeError(
                    f"Today's {our_name} is unavailable, so no fingerprint can be built."
                )
            record[our_name] = float(value)

        parsed = datetime.date.fromisoformat(times[0])
        record["date"] = times[0]
        record["doy"] = parsed.timetuple().tm_yday
        record["year"] = parsed.year
        return record

    @staticmethod
    def _collect_candidates(
        days: List[Dict[str, Any]], today_doy: int, today_year: int
    ) -> List[Dict[str, Any]]:
        """Seasonally comparable historical days that have a full outcome window.

        Analogs too close to the end of the archive are discarded here rather
        than truncated: a partial window would bias the aggregates downward.
        Outcome days must be calendar-consecutive, so gaps left by dropped
        null rows disqualify a candidate instead of silently shifting it.
        """
        candidates: List[Dict[str, Any]] = []

        for i, day in enumerate(days):
            if day["year"] == today_year:
                continue  # Do not match the current season against itself.
            if _doy_distance(day["doy"], today_doy) > SEASONAL_WINDOW_DAYS:
                continue
            if i + OUTCOME_DAYS >= len(days):
                continue

            base = datetime.date.fromisoformat(day["date"])
            window = days[i + 1 : i + 1 + OUTCOME_DAYS]
            if len(window) < OUTCOME_DAYS:
                continue

            contiguous = all(
                datetime.date.fromisoformat(w["date"]) == base + datetime.timedelta(days=n + 1)
                for n, w in enumerate(window)
            )
            if not contiguous:
                continue

            candidates.append({"day": day, "window": window})

        return candidates

    @staticmethod
    def _score(
        candidates: List[Dict[str, Any]], today: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Z-score features across the candidate pool, then weighted Euclidean.

        Standardising against the candidate pool rather than the whole archive
        means the scale is set by seasonally comparable days.
        """
        vectors = [_feature_vector(c["day"]) for c in candidates]
        today_vec = _feature_vector(today)

        stats: Dict[str, Dict[str, float]] = {}
        for feature in FEATURE_WEIGHTS:
            values = [v[feature] for v in vectors]
            mean = sum(values) / len(values)
            variance = sum((x - mean) ** 2 for x in values) / len(values)
            std = math.sqrt(variance)
            # A flat feature carries no information; neutralise it rather than
            # dividing by zero.
            stats[feature] = {"mean": mean, "std": std if std > 1e-9 else 1.0}

        scored: List[Dict[str, Any]] = []
        for candidate, vector in zip(candidates, vectors):
            total = 0.0
            for feature, weight in FEATURE_WEIGHTS.items():
                s = stats[feature]
                zc = (vector[feature] - s["mean"]) / s["std"]
                zt = (today_vec[feature] - s["mean"]) / s["std"]
                total += weight * (zc - zt) ** 2
            scored.append({**candidate, "distance": math.sqrt(total)})

        scored.sort(key=lambda c: c["distance"])
        return scored

    @staticmethod
    def _select_diverse(scored: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
        """Take the closest matches that represent distinct weather episodes.

        Walks candidates best-first and skips any falling within
        MIN_ANALOG_SEPARATION_DAYS of one already chosen, so the resulting set
        describes independent historical events rather than one event sampled
        repeatedly.
        """
        chosen: List[Dict[str, Any]] = []
        chosen_dates: List[datetime.date] = []

        for candidate in scored:
            date = datetime.date.fromisoformat(candidate["day"]["date"])
            if any(
                abs((date - picked).days) < MIN_ANALOG_SEPARATION_DAYS
                for picked in chosen_dates
            ):
                continue
            chosen.append(candidate)
            chosen_dates.append(date)
            if len(chosen) == limit:
                break

        return chosen

    @staticmethod
    def _similarity(distance: float, reference: float) -> float:
        """Similarity relative to a typical day at this location and season.

        This is a closeness measure, not a probability, and the UI labels it
        as such.
        """
        if reference <= 1e-9:
            return 100.0
        return round(100.0 * math.exp(-distance / reference), 1)

    @staticmethod
    def _summarise(analogs: List[Dict[str, Any]]) -> Dict[str, Any]:
        wet_within_72h = 0
        seven_day_totals: List[float] = []
        day3_deltas: List[float] = []

        for analog in analogs:
            window = analog["window"]
            if any(w["precip"] >= WET_DAY_MM for w in window[:3]):
                wet_within_72h += 1
            seven_day_totals.append(sum(w["precip"] for w in window))
            day3_deltas.append(window[2]["tmax"] - analog["day"]["tmax"])

        count = len(analogs)
        return {
            "analog_count": count,
            "rain_within_72h_count": wet_within_72h,
            "rain_within_72h_pct": round(100.0 * wet_within_72h / count, 1),
            "mean_7day_precip_mm": round(sum(seven_day_totals) / count, 1),
            "max_7day_precip_mm": round(max(seven_day_totals), 1),
            "min_7day_precip_mm": round(min(seven_day_totals), 1),
            "mean_tmax_delta_day3_c": round(sum(day3_deltas) / count, 1),
        }

    @staticmethod
    def _verdict(summary: Dict[str, Any]) -> str:
        """Template-generated from computed values only. No LLM involved."""
        pct = summary["rain_within_72h_pct"]
        count = summary["rain_within_72h_count"]
        total = summary["analog_count"]
        mean_mm = summary["mean_7day_precip_mm"]
        delta = summary["mean_tmax_delta_day3_c"]

        if pct >= 75:
            lead = f"History leans decisively wet: {count} of the {total} closest matches were raining within 72 hours."
        elif pct >= 50:
            lead = f"History leans wet: {count} of the {total} closest matches were raining within 72 hours."
        elif pct >= 25:
            lead = f"History is mixed: {count} of the {total} closest matches turned wet within 72 hours."
        else:
            lead = f"History leans dry: only {count} of the {total} closest matches saw rain within 72 hours."

        if delta <= -2.0:
            trend = f" Those days typically cooled {abs(delta)}°C by day three."
        elif delta >= 2.0:
            trend = f" Those days typically warmed {delta}°C by day three."
        else:
            trend = " Temperatures held roughly steady through day three."

        return f"{lead} Across them the following week averaged {mean_mm}mm.{trend}"

    @staticmethod
    async def find_analogs(
        lat: float, lon: float, location_name: str = "This location"
    ) -> Dict[str, Any]:
        """Match today against the location's own 40-year record."""
        archive = await ArchiveService.get_archive(lat, lon)
        today = await AnalogEngine._fetch_today(lat, lon)

        candidates = AnalogEngine._collect_candidates(
            archive["days"], today["doy"], today["year"]
        )
        if len(candidates) < MIN_ANALOGS:
            raise RuntimeError(
                "Not enough comparable historical days exist for this location "
                "to build a reliable analog."
            )

        scored = AnalogEngine._score(candidates, today)
        top = AnalogEngine._select_diverse(scored, TOP_K)
        if len(top) < MIN_ANALOGS:
            raise RuntimeError(
                "Not enough distinct historical episodes exist for this location "
                "to build a reliable analog."
            )

        # Anchor the similarity scale to a typical candidate, so the percentage
        # means "close relative to an ordinary day here at this time of year".
        distances = sorted(c["distance"] for c in scored)
        reference = distances[len(distances) // 2] or 1.0

        analogs = []
        for entry in top:
            day = entry["day"]
            desc = get_weather_desc(int(day["code"]))
            analogs.append(
                {
                    "date": day["date"],
                    "year": day["year"],
                    "similarity": AnalogEngine._similarity(entry["distance"], reference),
                    "tmax": day["tmax"],
                    "tmin": day["tmin"],
                    "precip": day["precip"],
                    "humidity": day["humidity"],
                    "wind": day["wind"],
                    "pressure": day["pressure"],
                    "condition": desc["label"],
                    "icon": desc["icon"],
                    "category": desc["category"],
                    "window": entry["window"],
                    "outcome": [
                        {
                            "offset": n + 1,
                            "date": w["date"],
                            "tmax": w["tmax"],
                            "tmin": w["tmin"],
                            "precip": w["precip"],
                            "condition": get_weather_desc(int(w["code"]))["label"],
                            "icon": get_weather_desc(int(w["code"]))["icon"],
                            "category": get_weather_desc(int(w["code"]))["category"],
                        }
                        for n, w in enumerate(entry["window"])
                    ],
                    "outcome_total_precip_mm": round(
                        sum(w["precip"] for w in entry["window"]), 1
                    ),
                }
            )

        summary = AnalogEngine._summarise(top)
        today_desc = get_weather_desc(int(today["code"]))

        return {
            "location_name": location_name,
            "coordinates": {"latitude": lat, "longitude": lon},
            "today": {
                "date": today["date"],
                "tmax": today["tmax"],
                "tmin": today["tmin"],
                "precip": today["precip"],
                "humidity": today["humidity"],
                "pressure": today["pressure"],
                "wind": today["wind"],
                "condition": today_desc["label"],
                "icon": today_desc["icon"],
                "category": today_desc["category"],
            },
            "archive": {
                "start_date": archive["start_date"],
                "end_date": archive["end_date"],
                "day_count": archive["day_count"],
                "years_covered": archive["day_count"] // 365,
                "candidates_considered": len(candidates),
                "seasonal_window_days": SEASONAL_WINDOW_DAYS,
                "min_separation_days": MIN_ANALOG_SEPARATION_DAYS,
            },
            "analogs": analogs,
            "summary": summary,
            "verdict": AnalogEngine._verdict(summary),
            "similarity_note": (
                "Similarity is a relative closeness measure against a typical day "
                "at this location and time of year, not a probability."
            ),
        }
