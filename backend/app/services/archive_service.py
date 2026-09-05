import datetime
import time
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..core.config import settings

# Open-Meteo's archive reaches further back, but 1985 gives 40 years of record
# while keeping a single fetch under ~500KB.
ARCHIVE_START = "1985-01-01"

# The archive is published with a lag of a few days; asking for days inside the
# lag window returns nulls that we would only discard again.
PUBLICATION_LAG_DAYS = 5

DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "precipitation_sum",
    "wind_speed_10m_max",
    "relative_humidity_2m_mean",
    "surface_pressure_mean",
    "weather_code",
]

# Field name in our day record -> field name in the Open-Meteo response.
FIELD_MAP = {
    "tmax": "temperature_2m_max",
    "tmin": "temperature_2m_min",
    "tmean": "temperature_2m_mean",
    "precip": "precipitation_sum",
    "wind": "wind_speed_10m_max",
    "humidity": "relative_humidity_2m_mean",
    "pressure": "surface_pressure_mean",
    "code": "weather_code",
}

CACHE_TTL_SECONDS = 86400  # Archive gains at most one row per day.
CACHE_MAX_ENTRIES = 32

# 0.1 degrees is ~11km, which approximates Open-Meteo's own grid resolution.
# Finer keys would spend cache slots on identical upstream data.
COORD_PRECISION = 1

_cache: "OrderedDict[Tuple[float, float], Tuple[float, Dict[str, Any]]]" = OrderedDict()


class ArchiveService:
    """Fetches and caches the long-term daily record for a location."""

    @staticmethod
    def _cache_key(lat: float, lon: float) -> Tuple[float, float]:
        return (round(lat, COORD_PRECISION), round(lon, COORD_PRECISION))

    @staticmethod
    def _end_date() -> str:
        end = datetime.date.today() - datetime.timedelta(days=PUBLICATION_LAG_DAYS)
        return end.isoformat()

    @staticmethod
    def _build_days(daily: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
        """Turn Open-Meteo's column-oriented payload into clean day records.

        Days missing any required field are dropped here so that every
        consumer downstream may assume complete rows.
        """
        times = daily.get("time", []) or []
        days: List[Dict[str, Any]] = []

        for i, date_str in enumerate(times):
            record: Dict[str, Any] = {}
            complete = True

            for our_name, api_name in FIELD_MAP.items():
                column = daily.get(api_name) or []
                value = column[i] if i < len(column) else None
                if value is None:
                    complete = False
                    break
                record[our_name] = float(value)

            if not complete:
                continue

            try:
                parsed = datetime.date.fromisoformat(date_str)
            except (TypeError, ValueError):
                continue

            record["date"] = date_str
            record["year"] = parsed.year
            record["month"] = parsed.month
            record["doy"] = parsed.timetuple().tm_yday
            days.append(record)

        return days

    @staticmethod
    async def get_archive(lat: float, lon: float) -> Dict[str, Any]:
        """Return the cached daily archive for a location, fetching if needed.

        Raises ValueError for invalid coordinates and RuntimeError when the
        upstream archive is unreachable or returns nothing usable.
        """
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Invalid latitude: {lat}. Must be between -90.0 and 90.0 degrees.")
        if not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Invalid longitude: {lon}. Must be between -180.0 and 180.0 degrees.")

        key = ArchiveService._cache_key(lat, lon)
        now = time.time()

        cached = _cache.get(key)
        if cached is not None:
            stored_at, payload = cached
            if now - stored_at < CACHE_TTL_SECONDS:
                _cache.move_to_end(key)
                return payload
            del _cache[key]

        url = f"{settings.ARCHIVE_URL}/archive"
        params = {
            "latitude": key[0],
            "longitude": key[1],
            "start_date": ARCHIVE_START,
            "end_date": ArchiveService._end_date(),
            "daily": ",".join(DAILY_VARS),
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.get(url, params=params)
        except httpx.TimeoutException as exc:
            # Remote and high-latitude coordinates are the slow ones; the
            # request often succeeds on a retry, so say so.
            raise RuntimeError(
                "The historical archive took too long to respond for this "
                "location. Please try again."
            ) from exc
        except Exception as exc:
            # str(exc) is empty for several httpx errors, so name the type too.
            detail = str(exc) or type(exc).__name__
            raise RuntimeError(f"Historical archive is unreachable: {detail}") from exc

        if resp.status_code == 429:
            # Open-Meteo's free tier is rate limited. Cached locations are
            # unaffected; only a cold location fails this way.
            raise RuntimeError(
                "The historical archive is rate limited right now. "
                "Please try again in a minute."
            )

        if resp.status_code != 200:
            raise RuntimeError(
                f"Historical archive returned HTTP {resp.status_code} for this location."
            )

        data = resp.json()
        days = ArchiveService._build_days(data.get("daily", {}) or {})

        if not days:
            raise RuntimeError(
                "No historical records are available for this location. "
                "The reanalysis covers open ocean, so this usually means the "
                "coordinates fall outside the dataset entirely."
            )

        payload = {
            "latitude": data.get("latitude", lat),
            "longitude": data.get("longitude", lon),
            "timezone": data.get("timezone", "UTC"),
            "elevation": data.get("elevation"),
            "start_date": days[0]["date"],
            "end_date": days[-1]["date"],
            "day_count": len(days),
            "days": days,
        }

        _cache[key] = (now, payload)
        _cache.move_to_end(key)
        while len(_cache) > CACHE_MAX_ENTRIES:
            _cache.popitem(last=False)

        return payload

    @staticmethod
    def cache_info() -> Dict[str, Any]:
        """Introspection helper used to verify caching behaviour."""
        return {
            "entries": len(_cache),
            "keys": [f"{k[0]},{k[1]}" for k in _cache.keys()],
        }
