import httpx
from typing import Dict, Any, List, Optional
from ..core.config import settings

WMO_CODE_MAP = {
    0: {"label": "Clear sky", "icon": "Sun", "category": "clear"},
    1: {"label": "Mainly clear", "icon": "SunDim", "category": "clear"},
    2: {"label": "Partly cloudy", "icon": "CloudSun", "category": "cloudy"},
    3: {"label": "Overcast", "icon": "Cloud", "category": "cloudy"},
    45: {"label": "Foggy", "icon": "CloudFog", "category": "fog"},
    48: {"label": "Depositing rime fog", "icon": "CloudFog", "category": "fog"},
    51: {"label": "Light drizzle", "icon": "CloudDrizzle", "category": "drizzle"},
    53: {"label": "Moderate drizzle", "icon": "CloudDrizzle", "category": "drizzle"},
    55: {"label": "Dense drizzle", "icon": "CloudDrizzle", "category": "drizzle"},
    61: {"label": "Slight rain", "icon": "CloudRain", "category": "rain"},
    63: {"label": "Moderate rain", "icon": "CloudRain", "category": "rain"},
    65: {"label": "Heavy rain", "icon": "CloudRain", "category": "heavy-rain"},
    71: {"label": "Slight snow", "icon": "CloudSnow", "category": "snow"},
    73: {"label": "Moderate snow", "icon": "CloudSnow", "category": "snow"},
    75: {"label": "Heavy snow", "icon": "CloudSnow", "category": "snow"},
    80: {"label": "Slight rain showers", "icon": "CloudRain", "category": "rain"},
    81: {"label": "Moderate rain showers", "icon": "CloudRain", "category": "rain"},
    82: {"label": "Violent rain showers", "icon": "CloudLightning", "category": "heavy-rain"},
    95: {"label": "Thunderstorm", "icon": "CloudLightning", "category": "thunderstorm"},
    96: {"label": "Thunderstorm with slight hail", "icon": "CloudLightning", "category": "thunderstorm"},
    99: {"label": "Thunderstorm with heavy hail", "icon": "CloudLightning", "category": "thunderstorm"},
}

def get_weather_desc(code: int) -> Dict[str, str]:
    return WMO_CODE_MAP.get(code, {"label": "Variable", "icon": "Cloud", "category": "cloudy"})

class WeatherService:
    @staticmethod
    async def search_city(query: str) -> List[Dict[str, Any]]:
        """Search cities using Open-Meteo Geocoding API with validation."""
        if not query or len(query.strip()) < 2:
            return []
        url = f"{settings.GEOCODING_URL}/search"
        params = {
            "name": query.strip(),
            "count": 8,
            "language": "en",
            "format": "json"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    results.append({
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "latitude": float(item.get("latitude")),
                        "longitude": float(item.get("longitude")),
                        "country": item.get("country", ""),
                        "admin1": item.get("admin1", ""), # State / province
                        "country_code": item.get("country_code", "")
                    })
                return results
        except Exception as e:
            print(f"Error searching city '{query}': {e}")
            return []

    @staticmethod
    async def get_forecast(lat: float, lon: float, location_name: str = "Local") -> Dict[str, Any]:
        """Fetch comprehensive live meteorological forecast for lat/lon with error handling."""
        # 1. Validate geographical coordinates
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Invalid latitude: {lat}. Must be between -90.0 and 90.0 degrees.")
        if not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Invalid longitude: {lon}. Must be between -180.0 and 180.0 degrees.")

        url = f"{settings.OPEN_METEO_URL}/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "is_day"
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation_probability",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "uv_index"
            ],
            "daily": [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "sunrise",
                "sunset",
                "uv_index_max"
            ],
            "timezone": "auto"
        }
        
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 400:
                    err_info = resp.json().get("reason", "Invalid location parameters")
                    raise ValueError(f"Meteorological API rejected coordinates: {err_info}")
                resp.raise_for_status()
                data = resp.json()
        except httpx.TimeoutException:
            raise RuntimeError("Meteorological data service request timed out. Please try again.")
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"Meteorological data service returned error code {exc.response.status_code}")
        except Exception as exc:
            if isinstance(exc, (ValueError, RuntimeError)):
                raise
            raise RuntimeError(f"Failed to communicate with weather service: {str(exc)}")

        current_raw = data.get("current", {})
        hourly_raw = data.get("hourly", {})
        daily_raw = data.get("daily", {})

        current_code = current_raw.get("weather_code", 0)
        current_meta = get_weather_desc(current_code)
        current_time = current_raw.get("time", "")

        # Current weather metrics
        temp = current_raw.get("temperature_2m", 0.0)
        feels_like = current_raw.get("apparent_temperature", 0.0)
        humidity = current_raw.get("relative_humidity_2m", 0)
        wind_speed = current_raw.get("wind_speed_10m", 0.0)
        precip = current_raw.get("precipitation", 0.0)
        pressure = current_raw.get("surface_pressure", 1013.2)
        is_day = current_raw.get("is_day", 1) == 1

        # Real Hourly Forecast: Align strictly from the current hour forward for 24 hours
        times = hourly_raw.get("time", [])
        h_temps = hourly_raw.get("temperature_2m", [])
        h_codes = hourly_raw.get("weather_code", [])
        h_pop = hourly_raw.get("precipitation_probability", [])
        h_winds = hourly_raw.get("wind_speed_10m", [])

        start_idx = 0
        if current_time and times:
            # Find the index of the current or next upcoming hour
            for idx, t_str in enumerate(times):
                if t_str >= current_time:
                    start_idx = idx
                    break

        hourly_items = []
        for i in range(start_idx, min(start_idx + 24, len(times))):
            h_code = h_codes[i] if i < len(h_codes) else 0
            h_meta = get_weather_desc(h_code)
            hourly_items.append({
                "time": times[i],
                "temp": round(h_temps[i], 1) if i < len(h_temps) else round(temp, 1),
                "code": h_code,
                "condition": h_meta["label"],
                "icon": h_meta["icon"],
                "precip_prob": h_pop[i] if i < len(h_pop) else 0,
                "wind_speed": round(h_winds[i], 1) if i < len(h_winds) else 0.0
            })

        # Fallback if fewer than 24 upcoming hours remain in dataset
        if len(hourly_items) < 24 and times:
            for i in range(len(hourly_items), 24):
                if i < len(times):
                    h_code = h_codes[i] if i < len(h_codes) else 0
                    h_meta = get_weather_desc(h_code)
                    hourly_items.append({
                        "time": times[i],
                        "temp": round(h_temps[i], 1) if i < len(h_temps) else round(temp, 1),
                        "code": h_code,
                        "condition": h_meta["label"],
                        "icon": h_meta["icon"],
                        "precip_prob": h_pop[i] if i < len(h_pop) else 0,
                        "wind_speed": round(h_winds[i], 1) if i < len(h_winds) else 0.0
                    })

        # 7-day daily forecast
        daily_items = []
        d_times = daily_raw.get("time", [])
        d_codes = daily_raw.get("weather_code", [])
        d_max = daily_raw.get("temperature_2m_max", [])
        d_min = daily_raw.get("temperature_2m_min", [])
        d_precip = daily_raw.get("precipitation_sum", [])
        d_pop = daily_raw.get("precipitation_probability_max", [])
        d_sunrises = daily_raw.get("sunrise", [])
        d_sunsets = daily_raw.get("sunset", [])
        d_uv = daily_raw.get("uv_index_max", [])

        for i in range(min(7, len(d_times))):
            d_code = d_codes[i] if i < len(d_codes) else 0
            d_meta = get_weather_desc(d_code)
            daily_items.append({
                "date": d_times[i],
                "max_temp": round(d_max[i], 1) if i < len(d_max) else 0.0,
                "min_temp": round(d_min[i], 1) if i < len(d_min) else 0.0,
                "code": d_code,
                "condition": d_meta["label"],
                "icon": d_meta["icon"],
                "precip_sum": round(d_precip[i], 1) if i < len(d_precip) else 0.0,
                "precip_prob_max": d_pop[i] if i < len(d_pop) else 0,
                "sunrise": d_sunrises[i] if i < len(d_sunrises) else "",
                "sunset": d_sunsets[i] if i < len(d_sunsets) else "",
                "uv_index": round(d_uv[i], 1) if i < len(d_uv) else 0.0
            })

        # Generate intelligent meteorological status summary
        today_rain = d_precip[0] if len(d_precip) > 0 else 0.0
        today_pop = d_pop[0] if len(d_pop) > 0 else 0
        status_summary = WeatherService._generate_summary(temp, feels_like, current_meta["label"], today_rain, today_pop, wind_speed)

        return {
            "location": {
                "name": location_name,
                "latitude": lat,
                "longitude": lon,
                "timezone": data.get("timezone", "UTC")
            },
            "current": {
                "temperature": round(temp, 1),
                "feels_like": round(feels_like, 1),
                "humidity": humidity,
                "wind_speed": round(wind_speed, 1),
                "wind_direction": current_raw.get("wind_direction_10m", 0),
                "precipitation": round(precip, 1),
                "pressure": round(pressure, 1),
                "weather_code": current_code,
                "condition": current_meta["label"],
                "icon": current_meta["icon"],
                "category": current_meta["category"],
                "is_day": is_day
            },
            "summary": status_summary,
            "hourly": hourly_items,
            "daily": daily_items
        }

    @staticmethod
    def _generate_summary(temp: float, feels_like: float, condition: str, rain_sum: float, rain_prob: int, wind: float) -> str:
        parts = [f"Currently {temp}°C (feels like {feels_like}°C) with {condition.lower()}."]
        if rain_prob > 60 or rain_sum > 5.0:
            parts.append(f"Significant precipitation expected today ({rain_prob}% chance, ~{rain_sum} mm). Keep rain gear ready.")
        elif rain_prob > 25:
            parts.append(f"Occasional light showers possible ({rain_prob}% chance).")
        else:
            parts.append("Dry conditions expected to prevail throughout the day.")
        
        if wind > 30:
            parts.append(f"Noticeably gusty with winds around {wind} km/h.")
        elif temp > 36:
            parts.append("Elevated heat index; stay well hydrated and limit direct midday sun.")
        return " ".join(parts)
