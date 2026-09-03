import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Thermometer, CloudRain, Calendar, Info, Loader2 } from 'lucide-react';
import { LocationInfo, ClimateTrendsResponse } from '../../types/weather';
import { WeatherAPI } from '../../api/client';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface ClimateViewProps {
  location: LocationInfo;
  lang: SupportedLanguage;
}

export const ClimateView: React.FC<ClimateViewProps> = ({ location, lang }) => {
  const t = translations[lang] || translations.en;
  const [data, setData] = useState<ClimateTrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClimate();
  }, [location]);

  const fetchClimate = async () => {
    setLoading(true);
    try {
      const res = await WeatherAPI.getClimateTrends(
        location.latitude,
        location.longitude,
        location.name
      );
      setData(res);
    } catch (err) {
      console.error("Failed to load climate trends", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <Calendar size={16} />
              <span>Climatological Normal & Historical Trends</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Historical Weather Patterns for {location.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Long-term seasonal benchmarks, temperature extremes, and precipitation departures.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                Annual Rainfall: {data.annual_rainfall_mm} mm
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                Mean Temp: {data.annual_mean_temp_c}°C
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="text-xs">Compiling historical climate profiles...</span>
        </div>
      ) : data ? (
        <>
          {/* Chart 1: Monthly Temperature Trends */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Thermometer size={18} className="text-rose-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Monthly Temperature Profiles (°C)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Max vs Min Historical Curves</span>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="°" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 16px -4px rgba(15,23,42,0.12)' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="avg_max_temp" name="Average Max Temp (°C)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorMax)" strokeWidth={2} />
                  <Area type="monotone" dataKey="avg_min_temp" name="Average Min Temp (°C)" stroke="#0284c7" fillOpacity={1} fill="url(#colorMin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Monthly Precipitation vs Normal */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CloudRain size={18} className="text-sky-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Precipitation Distribution (mm)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Recorded vs Climatological Normal</span>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 16px -4px rgba(15,23,42,0.12)' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="recorded_rainfall_mm" name="Recorded Rainfall (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="normal_rainfall_mm" name="Long-Term Normal (mm)" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Climate Narrative Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-sm">
            <Info size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Climatological Baseline Analysis
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {data.climate_summary}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                Precipitation Trend: <strong className="text-sky-700">{data.rainfall_status}</strong> relative to 30-year meteorological average.
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
