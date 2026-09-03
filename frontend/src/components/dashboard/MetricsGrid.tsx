import React from 'react';
import { Droplets, Wind, CloudRain, Gauge, Sun, Sunset, Compass, ArrowUpRight } from 'lucide-react';
import { ForecastResponse } from '../../types/weather';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface MetricsGridProps {
  forecast: ForecastResponse;
  lang: SupportedLanguage;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ forecast, lang }) => {
  const t = translations[lang] || translations.en;
  const { current, daily } = forecast;
  const today = daily[0] || {};

  const getWindDirectionName = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  const getUvRisk = (uv: number) => {
    if (uv <= 2) return { text: "Low", color: "text-emerald-600", bg: "bg-emerald-500", percent: Math.min((uv / 12) * 100, 100) };
    if (uv <= 5) return { text: "Moderate", color: "text-amber-600", bg: "bg-amber-500", percent: Math.min((uv / 12) * 100, 100) };
    if (uv <= 7) return { text: "High", color: "text-orange-600", bg: "bg-orange-500", percent: Math.min((uv / 12) * 100, 100) };
    if (uv <= 10) return { text: "Very High", color: "text-rose-600", bg: "bg-rose-500", percent: Math.min((uv / 12) * 100, 100) };
    return { text: "Extreme", color: "text-purple-600", bg: "bg-purple-500", percent: 100 };
  };

  const uvInfo = getUvRisk(today.uv_index || 0);

  const formatSunTime = (isoString: string) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoString.split('T')[1]?.slice(0, 5) || isoString;
    }
  };

  // Humidity circular ring calculation
  const humidityRadius = 22;
  const humidityCircumference = 2 * Math.PI * humidityRadius;
  const humidityOffset = humidityCircumference - (current.humidity / 100) * humidityCircumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 w-full">
      {/* 1. Wind & Vector Compass */}
      <div className="glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">{t.wind_speed}</span>
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
            <Wind size={15} />
          </div>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <div className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              {current.wind_speed} <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-xs font-mono-data text-teal-700 mt-0.5">
              Vector: {getWindDirectionName(current.wind_direction)} ({current.wind_direction}°)
            </div>
          </div>

          {/* SVG Compass Rose */}
          <div className="relative w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
            <div
              className="w-8 h-8 flex items-center justify-center transition-transform duration-500"
              style={{ transform: `rotate(${current.wind_direction}deg)` }}
            >
              <div className="w-1.5 h-6 bg-gradient-to-t from-teal-500 to-sky-500 rounded-full" />
            </div>
            <span className="absolute -top-1 text-[8px] font-mono text-slate-400">N</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          {current.wind_speed > 35 ? "Elevated surface gale" : "Gentle laminar breeze"}
        </div>
      </div>

      {/* 2. Humidity & Moisture with Ring Gauge */}
      <div className="glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">{t.humidity}</span>
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
            <Droplets size={15} />
          </div>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <div className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              {current.humidity}%
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {current.humidity > 70 ? "Tropical moisture" : current.humidity < 35 ? "Dry air" : "Comfortable"}
            </div>
          </div>

          {/* SVG Circular Ring Gauge */}
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={humidityRadius}
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r={humidityRadius}
                stroke="currentColor"
                strokeWidth="4"
                className="text-sky-500 transition-all duration-1000"
                fill="transparent"
                strokeDasharray={humidityCircumference}
                strokeDashoffset={humidityOffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="text-[11px] font-mono-data text-slate-500 border-t border-slate-100 pt-2">
          Dew Point: {Math.round(current.temperature - ((100 - current.humidity) / 5))}°C
        </div>
      </div>

      {/* 3. UV Index Spectrum Bar */}
      <div className="glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">{t.uv_index}</span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <Sun size={15} />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-slate-900 tracking-tight">{today.uv_index || 0}</span>
            <span className={`text-xs font-semibold uppercase ${uvInfo.color}`}>
              {uvInfo.text}
            </span>
          </div>

          {/* Color Spectrum Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden relative">
            <div
              className={`h-full ${uvInfo.bg} rounded-full transition-all duration-500`}
              style={{ width: `${uvInfo.percent}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          {today.uv_index && today.uv_index > 5 ? "SPF 30+ recommended" : "Low sun hazard"}
        </div>
      </div>

      {/* 4. Atmospheric Surface Pressure */}
      <div className="glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">{t.pressure}</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Gauge size={15} />
          </div>
        </div>

        <div className="my-2">
          <div className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
            {current.pressure} <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-xs text-indigo-700 mt-0.5">
            {current.pressure < 1008 ? "Low Pressure Front" : current.pressure > 1020 ? "High Pressure Ridge" : "Normal Equilibrium"}
          </div>
        </div>

        <div className="text-[11px] font-mono-data text-slate-500 border-t border-slate-100 pt-2">
          Standard MSL: 1013.2 hPa
        </div>
      </div>

      {/* 5. Precipitation Gauge */}
      <div className="glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">{t.rainfall}</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <CloudRain size={15} />
          </div>
        </div>

        <div className="my-2">
          <div className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
            {current.precipitation} <span className="text-xs font-normal text-slate-400">mm/h</span>
          </div>
          <div className="text-xs text-blue-700 mt-0.5">
            PoP: {today.precip_prob_max || 0}% Probability
          </div>
        </div>

        <div className="text-[11px] font-mono-data text-slate-500 border-t border-slate-100 pt-2">
          Today's Total: ~{today.precip_sum || 0} mm
        </div>
      </div>

      {/* 6. Ephemeris (Sunrise & Sunset) */}
      <div className="glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">Solar Cycle</span>
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
            <Sunset size={15} />
          </div>
        </div>

        <div className="my-2 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono-data">
            <span className="text-slate-500">Dawn:</span>
            <strong className="text-amber-600">{formatSunTime(today.sunrise)}</strong>
          </div>
          <div className="flex items-center justify-between text-xs font-mono-data">
            <span className="text-slate-500">Dusk:</span>
            <strong className="text-orange-600">{formatSunTime(today.sunset)}</strong>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          Natural Daylight Window
        </div>
      </div>
    </div>
  );
};
