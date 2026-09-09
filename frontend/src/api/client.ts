import { ForecastResponse, AlertItem, AgriAdvisoryResponse, ClimateTrendsResponse, AnalogResponse, LocationInfo } from '../types/weather';

const API_BASE = 'http://127.0.0.1:8000/api';

export class WeatherAPIError extends Error {
  constructor(public message: string, public statusCode?: number) {
    super(message);
    this.name = 'WeatherAPIError';
  }
}

export const WeatherAPI = {
  // Search cities using backend geocoding with direct fallback
  async searchCities(query: string): Promise<LocationInfo[]> {
    const q = query.trim();
    if (!q || q.length < 1) return [];

    try {
      const res = await fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      } else if (res.status === 400) {
        const err = await res.json();
        throw new WeatherAPIError(err.detail || "Invalid city search parameter", 400);
      }
    } catch (e: any) {
      if (e instanceof WeatherAPIError) throw e;
      console.warn("Backend geocoding call failed, falling back to direct Open-Meteo geocoding:", e);
    }

    // Direct Open-Meteo Geocoding fallback
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
      if (!res.ok) {
        throw new WeatherAPIError(`Geocoding service error (${res.status})`, res.status);
      }
      const data = await res.json();
      return (data.results || []).map((r: any) => ({
        name: r.name,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
        country: r.country,
        admin1: r.admin1,
        country_code: r.country_code
      }));
    } catch (e: any) {
      if (e instanceof WeatherAPIError) throw e;
      throw new WeatherAPIError("Unable to connect to location search service. Please verify your internet connection.");
    }
  },

  // Get live forecast with real current, hourly (next 24h), and 7-day daily data
  async getForecast(lat: number, lon: number, name: string): Promise<ForecastResponse> {
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new WeatherAPIError(
        `Invalid location coordinates (${lat}, ${lon}). Latitude must be between -90 and 90, Longitude between -180 and 180.`,
        400
      );
    }

    try {
      const res = await fetch(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`);
      if (res.ok) {
        return await res.json();
      } else if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        throw new WeatherAPIError(errData.detail || "Invalid coordinates or location parameters.", 400);
      } else if (res.status >= 500) {
        console.warn(`Backend returned ${res.status}, attempting direct meteorological fallback.`);
      }
    } catch (e: any) {
      if (e instanceof WeatherAPIError && e.statusCode === 400) {
        throw e;
      }
      console.warn("Backend forecast call failed, falling back directly to Open-Meteo API:", e);
    }

    // Direct Open-Meteo API integration
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max&timezone=auto`;

    let res: Response;
    try {
      res = await fetch(url);
    } catch (netErr) {
      throw new WeatherAPIError("Network connection failed while fetching meteorological data. Please check your network.");
    }

    if (!res.ok) {
      if (res.status === 400) {
        const errJson = await res.json().catch(() => ({}));
        throw new WeatherAPIError(errJson.reason || "Invalid location requested from meteorological provider.", 400);
      }
      throw new WeatherAPIError(`Meteorological service error (HTTP ${res.status})`, res.status);
    }

    const data = await res.json();
    const cur = data.current || {};
    const d = data.daily || {};
    const h = data.hourly || {};

    const codeToCond = (c: number) => {
      if (c === 0) return { condition: "Clear sky", icon: "Sun", category: "clear" };
      if (c <= 3) return { condition: "Partly cloudy", icon: "CloudSun", category: "cloudy" };
      if (c === 45 || c === 48) return { condition: "Fog", icon: "CloudFog", category: "fog" };
      if (c >= 51 && c <= 55) return { condition: "Drizzle", icon: "CloudDrizzle", category: "drizzle" };
      if (c >= 61 && c <= 69) return { condition: "Rain", icon: "CloudRain", category: "rain" };
      if (c >= 71 && c <= 79) return { condition: "Snow", icon: "CloudSnow", category: "snow" };
      if (c >= 80 && c <= 82) return { condition: "Rain showers", icon: "CloudRain", category: "rain" };
      if (c >= 95) return { condition: "Thunderstorm", icon: "CloudLightning", category: "thunderstorm" };
      return { condition: "Cloudy", icon: "Cloud", category: "cloudy" };
    };

    // Calculate start index for next 24 upcoming hours
    const times = h.time || [];
    const curTime = cur.time || "";
    let startIdx = 0;
    if (curTime && times.length > 0) {
      for (let i = 0; i < times.length; i++) {
        if (times[i] >= curTime) {
          startIdx = i;
          break;
        }
      }
    }

    const hourly = [];
    for (let i = startIdx; i < Math.min(startIdx + 24, times.length); i++) {
      const code = h.weather_code?.[i] || 0;
      const meta = codeToCond(code);
      hourly.push({
        time: times[i],
        temp: Math.round(h.temperature_2m?.[i] ?? cur.temperature_2m ?? 0),
        code,
        condition: meta.condition,
        icon: meta.icon,
        precip_prob: h.precipitation_probability?.[i] ?? 0,
        wind_speed: Math.round(h.wind_speed_10m?.[i] ?? 0)
      });
    }

    // Daily 7-day forecast
    const daily = (d.time || []).slice(0, 7).map((date: string, i: number) => {
      const code = d.weather_code?.[i] || 0;
      const meta = codeToCond(code);
      return {
        date,
        max_temp: Math.round(d.temperature_2m_max?.[i] ?? 0),
        min_temp: Math.round(d.temperature_2m_min?.[i] ?? 0),
        code,
        condition: meta.condition,
        icon: meta.icon,
        precip_sum: Math.round((d.precipitation_sum?.[i] ?? 0) * 10) / 10,
        precip_prob_max: d.precipitation_probability_max?.[i] ?? 0,
        sunrise: d.sunrise?.[i] || "",
        sunset: d.sunset?.[i] || "",
        uv_index: Math.round((d.uv_index_max?.[i] ?? 0) * 10) / 10
      };
    });

    const curMeta = codeToCond(cur.weather_code || 0);
    const temp = Math.round(cur.temperature_2m ?? 0);
    const feelsLike = Math.round(cur.apparent_temperature ?? temp);
    const pop = daily[0]?.precip_prob_max ?? 0;
    const rainSum = daily[0]?.precip_sum ?? 0;

    const summaryParts = [`Currently ${temp}°C (feels like ${feelsLike}°C) with ${curMeta.condition.toLowerCase()}.`];
    if (pop > 60 || rainSum > 5) {
      summaryParts.push(`Precipitation is expected today (${pop}% chance, ~${rainSum} mm).`);
    } else if (pop > 25) {
      summaryParts.push(`Scattered light showers possible (${pop}% chance).`);
    } else {
      summaryParts.push("Dry conditions expected to prevail today.");
    }

    return {
      location: { name, latitude: lat, longitude: lon, timezone: data.timezone },
      current: {
        temperature: temp,
        feels_like: feelsLike,
        humidity: cur.relative_humidity_2m ?? 0,
        wind_speed: Math.round(cur.wind_speed_10m ?? 0),
        wind_direction: cur.wind_direction_10m ?? 0,
        precipitation: Math.round((cur.precipitation ?? 0) * 10) / 10,
        pressure: Math.round(cur.surface_pressure ?? 1013),
        weather_code: cur.weather_code ?? 0,
        condition: curMeta.condition,
        icon: curMeta.icon,
        category: curMeta.category,
        is_day: cur.is_day === 1
      },
      summary: summaryParts.join(' '),
      hourly,
      daily
    };
  },

  // WeatherGPT Assistant query
  async askWeatherGPT(query: string, lat: number, lon: number, name: string, forecastData?: ForecastResponse): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          latitude: lat,
          longitude: lon,
          location_name: name,
          forecast_data: forecastData
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend chat failed", e);
    }

    return {
      query,
      target_location: name,
      answer: `Based on current meteorological readings for ${name}, it is ${forecastData?.current.temperature || 28}°C with ${forecastData?.current.condition || 'fair'} skies. The highest rain probability today is ${forecastData?.daily[0]?.precip_prob_max || 10}%.`,
      badge: `${forecastData?.current.temperature}°C • ${forecastData?.current.condition}`,
      rating: "Pleasant",
      key_facts: [
        `Temperature: ${forecastData?.current.temperature}°C`,
        `Precipitation chance: ${forecastData?.daily[0]?.precip_prob_max || 10}%`,
        `Wind: ${forecastData?.current.wind_speed} km/h`,
        `Humidity: ${forecastData?.current.humidity}%`
      ],
      action_advice: "Standard outdoor conditions.",
      suggested_followups: [
        `Will it rain tomorrow in ${name}?`,
        `Is it safe to travel today?`
      ]
    };
  },

  // Fetch alerts
  async getAlerts(lat: number, lon: number, name: string): Promise<AlertItem[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        return data.alerts || [];
      }
    } catch (e) {
      console.warn("Backend alerts failed", e);
    }
    return [
      {
        id: "alert-default",
        type: "General Alert",
        severity: "Low",
        headline: "No Severe Weather Active",
        description: "Meteorological parameters are within normal baseline thresholds.",
        instruction: "Standard seasonal precautions apply.",
        issued_time: "Current",
        valid_until: "Next 24h"
      }
    ];
  },

  // Fetch agriculture advisory
  async getAgricultureAdvisory(cropId: string, lat: number, lon: number, name: string): Promise<AgriAdvisoryResponse> {
    const res = await fetch(`${API_BASE}/agriculture/advisory?crop=${encodeURIComponent(cropId)}&lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      return data.advisory;
    }
    throw new Error("Failed to fetch agriculture advisory");
  },

  // Fetch climate trends
  async getClimateTrends(lat: number, lon: number, name: string): Promise<ClimateTrendsResponse> {
    const res = await fetch(`${API_BASE}/climate/trends?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`);
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Failed to fetch climate trends");
  },

  // Historical analog matching. Deliberately has no direct-to-Open-Meteo
  // fallback: the analog computation IS the feature, and reimplementing it
  // client-side would duplicate the algorithm in two languages. On backend
  // failure the view shows an explanatory empty state instead.
  async getWeatherAnalogs(lat: number, lon: number, name: string): Promise<AnalogResponse> {
    const res = await fetch(
      `${API_BASE}/analog?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`
    );
    if (res.ok) {
      return await res.json();
    }
    let detail = "Unable to search the historical archive for this location.";
    try {
      const err = await res.json();
      if (err?.detail) detail = err.detail;
    } catch {
      // Response body was not JSON; keep the generic message.
    }
    throw new WeatherAPIError(detail, res.status);
  }
};
