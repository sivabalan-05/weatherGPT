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
      <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Calendar size={16} />
              <span>Climatological Normal & Historical Trends</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Historical Weather Patterns for {location.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Long-term seasonal benchmarks, temperature extremes, and precipitation departures.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Annual Rainfall: {data.annual_rainfall_mm} mm
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Mean Temp: {data.annual_mean_temp_c}°C
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <span className="text-xs">Compiling historical climate profiles...</span>
        </div>
      ) : data ? (
        <>
          {/* Chart 1: Monthly Temperature Trends */}
          <div className="bg-[#131d2f] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-200">
                <Thermometer size={18} className="text-rose-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Monthly Temperature Profiles (°C)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Max vs Min Historical Curves</span>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="°" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="avg_max_temp" name="Average Max Temp (°C)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorMax)" strokeWidth={2} />
                  <Area type="monotone" dataKey="avg_min_temp" name="Average Min Temp (°C)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorMin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Monthly Precipitation vs Normal */}
          <div className="bg-[#131d2f] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CloudRain size={18} className="text-sky-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Precipitation Distribution (mm)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Recorded vs Climatological Normal</span>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="recorded_rainfall_mm" name="Recorded Rainfall (mm)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="normal_rainfall_mm" name="Long-Term Normal (mm)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Climate Narrative Summary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Info size={20} className="text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Climatological Baseline Analysis
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {data.climate_summary}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Precipitation Trend: <strong className="text-sky-300">{data.rainfall_status}</strong> relative to 30-year meteorological average.
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
