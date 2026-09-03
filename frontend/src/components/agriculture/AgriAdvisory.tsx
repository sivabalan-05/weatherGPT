import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Droplets, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Loader2, 
  MapPin, 
  ShieldCheck 
} from 'lucide-react';
import { LocationInfo, AgriAdvisoryResponse } from '../../types/weather';
import { WeatherAPI } from '../../api/client';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface AgriAdvisoryProps {
  location: LocationInfo;
  lang: SupportedLanguage;
}

const SUPPORTED_CROPS = [
  { id: "rice", name: "Paddy / Rice (धान / நெல்)", season: "Kharif staple" },
  { id: "wheat", name: "Wheat (गेहूं / கோதுமை)", season: "Rabi cereal" },
  { id: "cotton", name: "Cotton (कपास / பருத்தி)", season: "Cash crop" },
  { id: "sugarcane", name: "Sugarcane (गन्ना / கரும்பு)", season: "Perennial" },
  { id: "maize", name: "Maize (मक्का / மக்காச்சோளம்)", season: "Kharif/Rabi" },
  { id: "groundnut", name: "Groundnut (मूंगफली / வேர்க்கடலை)", season: "Oilseed" },
  { id: "tomato", name: "Tomato & Vegetables (टमाटर / தக்காளி)", season: "Horticulture" },
];

export const AgriAdvisory: React.FC<AgriAdvisoryProps> = ({ location, lang }) => {
  const t = translations[lang] || translations.en;
  const [selectedCrop, setSelectedCrop] = useState("rice");
  const [advisory, setAdvisory] = useState<AgriAdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdvisory();
  }, [selectedCrop, location]);

  const fetchAdvisory = async () => {
    setLoading(true);
    try {
      const data = await WeatherAPI.getAgricultureAdvisory(
        selectedCrop,
        location.latitude,
        location.longitude,
        location.name
      );
      setAdvisory(data);
    } catch (err) {
      console.error("Failed to load agriculture advisory", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Top Advisory Banner */}
      <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Sprout size={16} />
              <span>Agrometeorological Advisory Services</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Field & Crop Guidance for {location.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on medium-range numerical weather predictions and regional crop water demands.
            </p>
          </div>

          {/* Crop Selector */}
          <div className="w-full sm:w-auto">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t.crop_select}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full sm:w-64 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
            >
              {SUPPORTED_CROPS.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-400" />
          <span className="text-xs">Computing soil moisture and irrigation requirements...</span>
        </div>
      ) : advisory ? (
        <>
          {/* Key Parameters Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rain Expected */}
            <div className="bg-[#131d2f] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precipitation Expected</span>
                <Droplets className="text-sky-400" size={18} />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-white">
                  {advisory.rainfall_forecast.next_3_days_mm} mm
                  <span className="text-xs font-normal text-slate-400 ml-2">in next 72 hrs</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  7-Day Projected Accumulation: <strong className="text-slate-200">{advisory.rainfall_forecast.next_7_days_mm} mm</strong> ({advisory.rainfall_forecast.trend})
                </div>
              </div>
              <div className="text-[11px] text-sky-300/80 bg-sky-950/40 border border-sky-800/40 rounded-lg p-2 mt-2">
                Water requirement for {advisory.crop.name.split('(')[0]}: <strong>{advisory.crop.water_need}</strong>
              </div>
            </div>

            {/* Irrigation Suggestion */}
            <div className="bg-[#131d2f] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.irrigation_advisory}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  advisory.irrigation.badge_color === 'amber' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {advisory.irrigation.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed my-2">
                {advisory.irrigation.guidance}
              </p>
              <div className="text-[11px] text-slate-400">
                Sensitivity note: {advisory.crop.sensitive_to}
              </div>
            </div>
          </div>

          {/* Suitable time for farming activities */}
          <div className="bg-[#131d2f] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-300">
              <Clock size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {t.farming_activities} (Spraying, Weeding, Harvesting)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {advisory.activities.map((act, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                    act.favorable
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                      : 'bg-rose-950/20 border-rose-800/40 text-slate-200'
                  }`}
                >
                  {act.favorable ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white">{act.activity}</h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      {act.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Risks for Crops */}
          <div className="bg-[#131d2f] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-300">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Agro-Meteorological Risks
              </h3>
            </div>

            <div className="space-y-2">
              {advisory.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>{risk.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {risk.detail}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase tracking-wider border ${
                    risk.level.includes('High') 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                      : risk.level.includes('Medium')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {risk.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Clear Advisory Disclaimer */}
          <div className="bg-amber-950/15 border border-amber-800/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200/90">
            <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 uppercase tracking-wide">Notice: </span>
              {advisory.disclaimer}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
