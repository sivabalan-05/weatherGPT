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

  // Condition reactive ambient gradient
  const getAmbientGradient = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) {
      return 'from-purple-950/50 via-indigo-950/30 to-[#080e1e]/90 border-purple-500/30 shadow-purple-950/30';
    }
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return 'from-sky-950/50 via-blue-950/30 to-[#080e1e]/90 border-sky-500/30 shadow-sky-950/30';
    }
    if (c.includes('clear') || c.includes('sun')) {
      return 'from-amber-950/40 via-sky-950/25 to-[#080e1e]/90 border-amber-500/30 shadow-amber-950/20';
    }
    return 'from-slate-900/60 via-slate-950/40 to-[#080e1e]/90 border-white/[0.1] shadow-black/40';
  };

  return (
    <div className={`w-full relative overflow-hidden rounded-3xl bg-gradient-to-br ${getAmbientGradient(current.condition)} border backdrop-blur-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300`}>
      {/* Subtle atmospheric ambient glow ball */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Station Header Pill */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] shadow-inner text-sky-400">
            <Compass size={18} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                {location.name}
              </h1>
              <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.1]">
                {location.country || 'Region'}
              </span>
            </div>
            <p className="text-[11px] font-mono-data text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Station Coords:</span>
              <span className="text-slate-300">{location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E</span>
              <span className="text-slate-600">•</span>
              <span>{location.timezone}</span>
            </p>
          </div>
        </div>

        {activeWarning ? (
          <button
            onClick={onViewAlerts}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/50 rounded-full text-xs font-semibold transition shadow-lg shadow-rose-950/40 animate-pulse"
          >
            <AlertTriangle size={15} className="text-rose-400" />
            <span>{activeWarning.severity} Alert: {activeWarning.type}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-data text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Atmospheric Vigilance: Active</span>
          </div>
        )}
      </div>

      {/* Main Meteorological Hero Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left: Giant Temperature & Icon */}
        <div className="lg:col-span-6 flex items-center gap-6 sm:gap-8">
          <div className="relative p-5 rounded-3xl bg-white/[0.04] border border-white/[0.1] shadow-2xl shadow-black/40 backdrop-blur-xl group shrink-0">
            <div className="absolute inset-0 rounded-3xl bg-sky-400/10 blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
            <WeatherIcon name={current.icon} size={72} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md relative z-10" />
          </div>

          <div>
            <div className="flex items-start">
              <span className="font-heading text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-white drop-shadow-lg">
                {current.temperature}
              </span>
              <span className="font-heading text-2xl sm:text-3xl font-light text-sky-400 mt-2 ml-1">
                °C
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-base sm:text-lg font-semibold text-white capitalize tracking-tight">
                {current.condition}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs sm:text-sm font-medium text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                {t.feels_like} <strong className="text-white">{current.feels_like}°C</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs font-mono-data text-slate-300">
              <span className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg text-rose-300">
                <ArrowUp size={13} />
                <span>High: <strong>{today.max_temp}°C</strong></span>
              </span>
              <span className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg text-sky-300">
                <ArrowDown size={13} />
                <span>Low: <strong>{today.min_temp}°C</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Narrative Status & WeatherGPT Launchpad */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#091224]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Sparkles size={15} />
              <span>{t.status_summary}</span>
            </div>
            <span className="text-[10px] font-mono-data text-slate-400">Real-time GFS/ECMWF Synthesis</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
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
                className="text-[11px] bg-white/[0.04] hover:bg-sky-500/15 text-slate-300 hover:text-sky-300 border border-white/[0.08] hover:border-sky-500/30 px-3 py-1.5 rounded-xl transition duration-150"
              >
                "Will it rain tomorrow?"
              </button>
              <button
                onClick={() => onAskQuery("Is it safe to travel today?")}
                className="text-[11px] bg-white/[0.04] hover:bg-sky-500/15 text-slate-300 hover:text-sky-300 border border-white/[0.08] hover:border-sky-500/30 px-3 py-1.5 rounded-xl transition duration-150"
              >
                "Is it safe to travel today?"
              </button>
              <button
                onClick={() => onAskQuery("What's the weather this evening?")}
                className="text-[11px] bg-white/[0.04] hover:bg-sky-500/15 text-slate-300 hover:text-sky-300 border border-white/[0.08] hover:border-sky-500/30 px-3 py-1.5 rounded-xl transition duration-150"
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
