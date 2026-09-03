import React, { useState } from 'react';
import { Calendar, Droplets, ChevronDown, ChevronUp, Sun, Wind, CloudRain } from 'lucide-react';
import { DailyForecastItem } from '../../types/weather';
import { WeatherIcon } from '../common/WeatherIcon';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface DailyForecastProps {
  daily: DailyForecastItem[];
  lang: SupportedLanguage;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily, lang }) => {
  const t = translations[lang] || translations.en;
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const formatDay = (dateStr: string, index: number) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Normalized temperature bar calculation
  const allMin = Math.min(...daily.map(d => d.min_temp), 10);
  const allMax = Math.max(...daily.map(d => d.max_temp), 40);
  const tempRange = Math.max(1, allMax - allMin);

  return (
    <div className="w-full glass-panel rounded-3xl p-5 sm:p-6 transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-slate-300">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="font-heading text-sm sm:text-base font-bold text-white tracking-tight">
              {t.daily_forecast}
            </h3>
            <span className="text-[11px] font-mono-data text-slate-400">7-Day Synoptic Trajectory</span>
          </div>
        </div>

        <span className="text-[11px] font-mono-data text-slate-400">
          Week Range: <strong className="text-sky-300">{allMin}°C</strong> – <strong className="text-amber-300">{allMax}°C</strong>
        </span>
      </div>

      <div className="space-y-2">
        {daily.map((item, idx) => {
          const leftPct = Math.max(0, ((item.min_temp - allMin) / tempRange) * 100);
          const rightPct = Math.max(0, ((allMax - item.max_temp) / tempRange) * 100);
          const isExpanded = expandedDay === idx;

          return (
            <div
              key={idx}
              className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] transition duration-200 overflow-hidden"
            >
              <div
                onClick={() => setExpandedDay(isExpanded ? null : idx)}
                className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Day name & Condition */}
                <div className="w-32 shrink-0">
                  <div className="font-heading text-xs sm:text-sm font-bold text-white">
                    {formatDay(item.date, idx)}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate capitalize mt-0.5">
                    {item.condition}
                  </div>
                </div>

                {/* Weather icon & rain probability */}
                <div className="flex items-center gap-2 w-24 shrink-0">
                  <div className="p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <WeatherIcon name={item.icon} size={22} className="w-5 h-5" />
                  </div>
                  {item.precip_prob_max > 20 ? (
                    <span className="text-[11px] font-mono-data font-semibold text-sky-400 flex items-center gap-0.5">
                      <Droplets size={11} />
                      {item.precip_prob_max}%
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono-data text-slate-500">Dry</span>
                  )}
                </div>

                {/* Apple Weather Style Temp Spectrum Bar */}
                <div className="flex items-center gap-2.5 flex-1 max-w-sm">
                  <span className="font-mono-data text-xs font-semibold text-slate-400 w-8 text-right">
                    {item.min_temp}°
                  </span>

                  <div className="flex-1 h-2.5 bg-white/[0.08] rounded-full relative overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 shadow-sm"
                      style={{
                        left: `${leftPct}%`,
                        right: `${rightPct}%`
                      }}
                    />
                  </div>

                  <span className="font-mono-data text-xs font-bold text-white w-8 text-left">
                    {item.max_temp}°
                  </span>
                </div>

                <div className="text-slate-500 shrink-0 ml-1">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expandable Day Telemetry Drawer */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-white/[0.04] grid grid-cols-3 gap-2 text-xs font-mono-data bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Sun size={13} className="text-amber-400" />
                    <span>UV Index: <strong className="text-white">{item.uv_index || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CloudRain size={13} className="text-sky-400" />
                    <span>Rain Sum: <strong className="text-white">{item.precip_sum || 0} mm</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Droplets size={13} className="text-blue-400" />
                    <span>Peak PoP: <strong className="text-white">{item.precip_prob_max || 0}%</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
