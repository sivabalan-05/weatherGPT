import React from 'react';
import { MapPin, ArrowUp, ArrowDown, Sparkles, AlertTriangle, Radio, Navigation, Compass } from 'lucide-react';
import { ForecastResponse, AlertItem } from '../../types/weather';
import { WeatherIcon } from '../common/WeatherIcon';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface WeatherHeroProps {
  forecast: ForecastResponse;
  alerts: AlertItem[];
  lang: SupportedLanguage;
  onAskQuery: (query: string) => void;
  onViewAlerts: () => void;
}

export const WeatherHero: React.FC<WeatherHeroProps> = ({
  forecast,
  alerts,
  lang,
  onAskQuery,
  onViewAlerts
}) => {
  const t = translations[lang] || translations.en;
  const { current, daily, location, summary } = forecast;
  const today = daily[0] || {};
  const activeWarning = alerts.find(a => a.severity === 'High' || a.severity === 'Extreme');

  // Condition reactive ambient tint
  const getAmbientGradient = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) {
      return 'from-indigo-50 via-white to-white border-indigo-100';
    }
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return 'from-sky-50 via-white to-white border-sky-100';
    }
    if (c.includes('clear') || c.includes('sun')) {
      return 'from-amber-50 via-white to-white border-amber-100';
    }
    return 'from-slate-50 via-white to-white border-slate-200';
  };

  return (
    <div className={`w-full relative overflow-hidden rounded-3xl bg-gradient-to-br ${getAmbientGradient(current.condition)} border p-6 sm:p-8 shadow-sm transition-all duration-300`}>
      {/* Station Header Pill */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sky-600">
            <Compass size={18} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {location.name}
              </h1>
              <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                {location.country || 'Region'}
              </span>
            </div>
            <p className="text-[11px] font-mono-data text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Station Coords:</span>
              <span className="text-slate-600">{location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E</span>
              <span className="text-slate-300">•</span>
              <span>{location.timezone}</span>
            </p>
          </div>
        </div>

        {activeWarning ? (
          <button
            onClick={onViewAlerts}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold transition shadow-sm animate-pulse"
          >
            <AlertTriangle size={15} className="text-rose-600" />
            <span>{activeWarning.severity} Alert: {activeWarning.type}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-data text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Atmospheric Vigilance: Active</span>
          </div>
        )}
      </div>

      {/* Main Meteorological Hero Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left: Giant Temperature & Icon */}
        <div className="lg:col-span-6 flex items-center gap-6 sm:gap-8">
          <div className="relative p-5 rounded-3xl bg-white border border-slate-200 shadow-sm group shrink-0">
            <WeatherIcon name={current.icon} size={72} className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" />
          </div>

          <div>
            <div className="flex items-start">
              <span className="font-heading text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-slate-900">
                {current.temperature}
              </span>
              <span className="font-heading text-2xl sm:text-3xl font-light text-sky-600 mt-2 ml-1">
                °C
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-base sm:text-lg font-semibold text-slate-900 capitalize tracking-tight">
                {current.condition}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                {t.feels_like} <strong className="text-slate-900">{current.feels_like}°C</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs font-mono-data text-slate-600">
              <span className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg text-rose-700">
                <ArrowUp size={13} />
                <span>High: <strong>{today.max_temp}°C</strong></span>
              </span>
              <span className="flex items-center gap-1 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg text-sky-700">
                <ArrowDown size={13} />
                <span>Low: <strong>{today.min_temp}°C</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Narrative Status & WeatherGPT Launchpad */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600">
              <Sparkles size={15} />
              <span>{t.status_summary}</span>
            </div>
            <span className="text-[10px] font-mono-data text-slate-400">Real-time GFS/ECMWF Synthesis</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {summary}
          </p>

          {/* Quick AI Weather Inquiries */}
          <div className="pt-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>Ask WeatherGPT One-Click:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAskQuery("Will it rain tomorrow?")}
                className="text-[11px] bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-xl transition duration-150"
              >
                "Will it rain tomorrow?"
              </button>
              <button
                onClick={() => onAskQuery("Is it safe to travel today?")}
                className="text-[11px] bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-xl transition duration-150"
              >
                "Is it safe to travel today?"
              </button>
              <button
                onClick={() => onAskQuery("What's the weather this evening?")}
                className="text-[11px] bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-xl transition duration-150"
              >
                "Weather this evening?"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
