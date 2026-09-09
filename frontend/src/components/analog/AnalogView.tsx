import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Loader2,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CalendarClock,
  Info,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { LocationInfo, AnalogResponse, AnalogDay } from '../../types/weather';
import { WeatherAPI } from '../../api/client';
import { WeatherIcon } from '../common/WeatherIcon';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface AnalogViewProps {
  location: LocationInfo;
  lang: SupportedLanguage;
}

const formatDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const shortDay = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Precipitation shading follows the alert engine's intensity bands so a
// "heavy" day reads the same colour here as it does elsewhere in the app.
const precipTone = (mm: number): string => {
  if (mm >= 64.5) return 'bg-violet-500';
  if (mm >= 15.6) return 'bg-blue-500';
  if (mm >= 2.5) return 'bg-sky-400';
  if (mm >= 0.1) return 'bg-sky-200';
  return 'bg-slate-200';
};

const OutcomeStrip: React.FC<{ analog: AnalogDay; label: string; totalLabel: string }> = ({
  analog,
  label,
  totalLabel
}) => {
  const peak = Math.max(...analog.outcome.map((o) => o.precip), 1);

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className="text-[10px] font-mono-data text-slate-500">
          {analog.outcome_total_precip_mm}mm {totalLabel}
        </span>
      </div>

      <div className="flex items-end gap-1">
        {analog.outcome.map((day) => {
          const heightPct = Math.max(4, (day.precip / peak) * 100);
          return (
            <div key={day.offset} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full h-14 flex items-end">
                <div
                  className={`w-full rounded-t ${precipTone(day.precip)} transition-all`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[9px] font-mono-data text-slate-400">+{day.offset}</span>

              {/* Hover detail */}
              <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg">
                <div className="font-semibold">{shortDay(day.date)}</div>
                <div className="font-mono-data">{day.precip}mm · {day.tmax}°/{day.tmin}°</div>
                <div className="text-slate-300">{day.condition}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AnalogView: React.FC<AnalogViewProps> = ({ location, lang }) => {
  const t = translations[lang] || translations.en;
  const [data, setData] = useState<AnalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await WeatherAPI.getWeatherAnalogs(
        location.latitude,
        location.longitude,
        location.name
      );
      setData(res);
    } catch (err: any) {
      setData(null);
      setError(err?.message || null);
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, location.name]);

  useEffect(() => {
    fetchAnalogs();
  }, [fetchAnalogs]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider">
              <History size={16} />
              <span>{t.dejavu_title}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {location.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
              {t.dejavu_subtitle}
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 font-mono-data">
                {data.archive.years_covered}y record
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 font-mono-data">
                {data.archive.candidates_considered} candidates
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 size={32} className="animate-spin text-violet-500" />
          <span className="text-xs">{t.dejavu_searching}</span>
        </div>
      ) : error ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <AlertTriangle className="text-amber-500 mx-auto mb-3" size={32} />
          <h3 className="text-base font-bold text-slate-900 mb-1">{t.dejavu_unavailable}</h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
            {error || t.dejavu_unavailable}
          </p>
          <button
            onClick={fetchAnalogs}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition"
          >
            <RefreshCw size={14} />
            {t.dejavu_retry}
          </button>
        </div>
      ) : data ? (
        <>
          {/* Today's fingerprint */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock size={18} className="text-violet-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {t.dejavu_today_fingerprint}
              </h3>
              <span className="text-xs text-slate-400 font-mono-data ml-auto">
                {formatDate(data.today.date)}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                <WeatherIcon name={data.today.icon} size={36} />
                <div>
                  <div className="text-2xl font-bold text-slate-900 font-mono-data leading-none">
                    {data.today.tmax}°
                    <span className="text-base text-slate-400">/{data.today.tmin}°</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{data.today.condition}</div>
                </div>
              </div>

              {[
                { icon: <CloudRain size={14} />, label: 'Rain', value: `${data.today.precip}mm` },
                { icon: <Droplets size={14} />, label: 'Humidity', value: `${data.today.humidity}%` },
                { icon: <Wind size={14} />, label: 'Wind', value: `${data.today.wind}km/h` },
                { icon: <Gauge size={14} />, label: 'Pressure', value: `${data.today.pressure}hPa` }
              ].map((m) => (
                <div key={m.label} className="min-w-[76px]">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                    {m.icon}
                    <span>{m.label}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 font-mono-data mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict + aggregate statistics */}
          <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <History size={18} className="text-violet-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {t.dejavu_what_followed}
              </h3>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-4">{data.verdict}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {t.dejavu_rain_72h}
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono-data mt-1">
                  {data.summary.rain_within_72h_count}
                  <span className="text-slate-400 text-sm"> / {data.summary.analog_count}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${data.summary.rain_within_72h_pct}%` }}
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {t.dejavu_avg_week}
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono-data mt-1">
                  {data.summary.mean_7day_precip_mm}
                  <span className="text-slate-400 text-sm">mm</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono-data mt-2">
                  range {data.summary.min_7day_precip_mm}–{data.summary.max_7day_precip_mm}mm
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {t.dejavu_temp_day3}
                </div>
                <div
                  className={`text-xl font-bold font-mono-data mt-1 ${
                    data.summary.mean_tmax_delta_day3_c < 0 ? 'text-sky-600' : 'text-rose-600'
                  }`}
                >
                  {data.summary.mean_tmax_delta_day3_c > 0 ? '+' : ''}
                  {data.summary.mean_tmax_delta_day3_c}°C
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Thermometer size={11} />
                  <span>vs analog day</span>
                </div>
              </div>
            </div>
          </div>

          {/* The analogs themselves */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarClock size={18} className="text-violet-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {t.dejavu_closest_matches}
                </h3>
              </div>
              <span className="text-xs text-slate-500">{t.dejavu_next_7_days}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.analogs.map((analog, index) => (
                <div
                  key={analog.date}
                  className={`rounded-xl border p-3 transition ${
                    index === 0
                      ? 'border-violet-200 bg-violet-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <WeatherIcon name={analog.icon} size={26} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 font-mono-data">
                          {formatDate(analog.date)}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{analog.condition}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-violet-700 font-mono-data">
                        {analog.similarity}%
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                        {t.dejavu_match}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${analog.similarity}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-2.5 text-[10px] font-mono-data text-slate-500">
                    <span>{analog.tmax}°/{analog.tmin}°</span>
                    <span>{analog.precip}mm</span>
                    <span>RH {analog.humidity}%</span>
                    <span>{analog.wind}km/h</span>
                  </div>

                  <OutcomeStrip
                    analog={analog}
                    label={t.dejavu_next_7_days}
                    totalLabel={t.dejavu_that_week_total}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Provenance and the honesty note about what the % means */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
              <p>{t.dejavu_similarity_caveat}</p>
              <p className="font-mono-data">
                {t.dejavu_archive_note}: {data.archive.day_count.toLocaleString()} days,{' '}
                {data.archive.start_date} → {data.archive.end_date}. Candidates restricted to ±
                {data.archive.seasonal_window_days} days of today's date across all years, with a
                minimum {data.archive.min_separation_days}-day separation so each match is a
                distinct weather episode.
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
