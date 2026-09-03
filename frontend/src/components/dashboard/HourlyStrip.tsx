import React from 'react';
import { Clock, Droplets, Wind } from 'lucide-react';
import { HourlyForecastItem } from '../../types/weather';
import { WeatherIcon } from '../common/WeatherIcon';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface HourlyStripProps {
  hourly: HourlyForecastItem[];
  lang: SupportedLanguage;
}

export const HourlyStrip: React.FC<HourlyStripProps> = ({ hourly, lang }) => {
  const t = translations[lang] || translations.en;

  const formatHour = (iso: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    } catch {
      return iso.split('T')[1]?.slice(0, 5) || iso;
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-5 sm:p-6 transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {t.hourly_forecast}
            </h3>
            <span className="text-[11px] font-mono-data text-slate-500">24-Hour Synoptic Timeline</span>
          </div>
        </div>

        <span className="text-[11px] font-mono-data px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
          Hourly Step Projection
        </span>
      </div>

      {/* Horizontal Scrollable Capsule Row */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth">
        {hourly.map((item, idx) => {
          const isNow = idx === 0;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[92px] shrink-0 border transition-all duration-200 group ${
                isNow
                  ? 'bg-gradient-to-b from-sky-50 to-blue-50 border-sky-300 shadow-sm'
                  : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-sky-300'
              }`}
            >
              <span className={`text-xs font-mono-data ${isNow ? 'text-sky-700 font-bold' : 'text-slate-500'}`}>
                {isNow ? 'Current' : formatHour(item.time)}
              </span>

              <div className="my-3 transition-transform group-hover:scale-110 duration-200">
                <WeatherIcon name={item.icon} size={30} className="w-7 h-7" />
              </div>

              <span className="font-heading text-lg font-bold text-slate-900 tracking-tight">
                {item.temp}°
              </span>

              {/* Precipitation Indicator Pill */}
              <div className="w-full mt-2 pt-2 border-t border-slate-200 flex items-center justify-center gap-1">
                <Droplets size={10} className={item.precip_prob > 35 ? 'text-sky-600' : 'text-slate-400'} />
                <span className={`text-[10px] font-mono-data ${item.precip_prob > 35 ? 'text-sky-700 font-semibold' : 'text-slate-400'}`}>
                  {item.precip_prob}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
