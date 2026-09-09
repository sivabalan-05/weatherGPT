from typing import Any, Dict, List, Optional

from .archive_service import ArchiveService

MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

# The WMO standard reference period. Using the conventional baseline means the
# departure percentages carry their usual meteorological meaning rather than
# being relative to an arbitrary window.
NORMAL_PERIOD_START = 1991
NORMAL_PERIOD_END = 2020

# A year needs at least this many days on record to be treated as complete.
MIN_DAYS_FOR_COMPLETE_YEAR = 360

# Annual totals within this many millimetres of normal are reported as normal.
NORMAL_RAINFALL_TOLERANCE_MM = 50.0


class ClimateService:
    """Real monthly climate normals and departures from the Open-Meteo archive."""

    @staticmethod
    def _latest_complete_year(days: List[Dict[str, Any]]) -> Optional[int]:
        counts: Dict[int, int] = {}
        for day in days:
            counts[day["year"]] = counts.get(day["year"], 0) + 1
        complete = [y for y, n in counts.items() if n >= MIN_DAYS_FOR_COMPLETE_YEAR]
        return max(complete) if complete else None

    @staticmethod
    def _mean(values: List[float]) -> float:
        return sum(values) / len(values) if values else 0.0

    @staticmethod
    async def get_climate_trends(
        lat: float, lon: float, location_name: str = "Region"
    ) -> Dict[str, Any]:
        """Compare the most recent complete year against the 1991-2020 normal.

        Raises ValueError for invalid coordinates and RuntimeError when the
        archive cannot supply enough record to compute normals.
        """
        archive = await ArchiveService.get_archive(lat, lon)
        days = archive["days"]

        recorded_year = ClimateService._latest_complete_year(days)
        if recorded_year is None:
            raise RuntimeError(
                "No complete year of historical record exists for this location."
            )

        # Bucket the record once: monthly values for the reported year, and
        # per-year monthly totals across the reference period for the normal.
        recorded_tmax: Dict[int, List[float]] = {m: [] for m in range(1, 13)}
        recorded_tmin: Dict[int, List[float]] = {m: [] for m in range(1, 13)}
        recorded_precip: Dict[int, float] = {m: 0.0 for m in range(1, 13)}
        normal_precip_by_year: Dict[int, Dict[int, float]] = {m: {} for m in range(1, 13)}

        for day in days:
            month = day["month"]
            year = day["year"]

            if year == recorded_year:
                recorded_tmax[month].append(day["tmax"])
                recorded_tmin[month].append(day["tmin"])
                recorded_precip[month] += day["precip"]

            if NORMAL_PERIOD_START <= year <= NORMAL_PERIOD_END:
                bucket = normal_precip_by_year[month]
                bucket[year] = bucket.get(year, 0.0) + day["precip"]

        monthly_trends = []
        for i, label in enumerate(MONTH_LABELS):
            month = i + 1

            max_t = round(ClimateService._mean(recorded_tmax[month]), 1)
            min_t = round(ClimateService._mean(recorded_tmin[month]), 1)
            rain = round(recorded_precip[month], 1)

            yearly_totals = list(normal_precip_by_year[month].values())
            normal_rain = round(ClimateService._mean(yearly_totals), 1)

            departure = (
                round(((rain - normal_rain) / normal_rain) * 100, 1)
                if normal_rain > 0
                else 0.0
            )

            monthly_trends.append({
                "month": label,
                "avg_max_temp": max_t,
                "avg_min_temp": min_t,
                "mean_temp": round((max_t + min_t) / 2, 1),
                "recorded_rainfall_mm": rain,
                "normal_rainfall_mm": normal_rain,
                "rainfall_departure_pct": departure,
            })

        annual_rain = round(sum(m["recorded_rainfall_mm"] for m in monthly_trends), 1)
        annual_normal = round(sum(m["normal_rainfall_mm"] for m in monthly_trends), 1)
        avg_temp = round(
            ClimateService._mean([m["mean_temp"] for m in monthly_trends]), 1
        )

        difference = annual_rain - annual_normal
        if abs(difference) < NORMAL_RAINFALL_TOLERANCE_MM:
            pct = round((difference / annual_normal) * 100, 1) if annual_normal else 0.0
            status = f"Normal ({pct:+}%)"
        elif difference > 0:
            status = "Excess"
        else:
            status = "Deficit"

        return {
            "location_name": location_name,
            "coordinates": {"latitude": lat, "longitude": lon},
            "recorded_year": recorded_year,
            "normal_period": f"{NORMAL_PERIOD_START}-{NORMAL_PERIOD_END}",
            "annual_rainfall_mm": annual_rain,
            "normal_annual_rainfall_mm": annual_normal,
            "annual_mean_temp_c": avg_temp,
            "rainfall_status": status,
            "monthly_trends": monthly_trends,
            "climate_summary": (
                f"Observed records for {location_name} in {recorded_year} show "
                f"{annual_rain}mm of cumulative precipitation against a "
                f"{NORMAL_PERIOD_START}-{NORMAL_PERIOD_END} normal of {annual_normal}mm, "
                f"with a mean annual temperature of {avg_temp}°C. "
                f"Derived from {archive['day_count']} days of observed record "
                f"({archive['start_date']} to {archive['end_date']})."
            ),
        }
