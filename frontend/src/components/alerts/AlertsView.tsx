import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  CloudRain, 
  Wind, 
  Flame, 
  Waves, 
  Zap, 
  Clock, 
  PhoneCall 
} from 'lucide-react';
import { AlertItem } from '../../types/weather';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface AlertsViewProps {
  alerts: AlertItem[];
  locationName: string;
  lang: SupportedLanguage;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, locationName, lang }) => {
  const t = translations[lang] || translations.en;
  const [filter, setFilter] = useState<'ALL' | 'Extreme' | 'High' | 'Moderate' | 'Low'>('ALL');

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return {
          badge: 'bg-red-500/20 text-red-300 border-red-500/50',
          border: 'border-red-500/40 bg-red-950/15',
          icon: <AlertTriangle className="text-red-400 shrink-0" size={20} />
        };
      case 'High':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
          border: 'border-orange-500/40 bg-orange-950/15',
          icon: <AlertTriangle className="text-orange-400 shrink-0" size={20} />
        };
      case 'Moderate':
        return {
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          border: 'border-yellow-500/40 bg-yellow-950/10',
          icon: <AlertCircle className="text-yellow-400 shrink-0" size={20} />
        };
      default:
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          border: 'border-emerald-500/30 bg-emerald-950/10',
          icon: <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
        };
    }
  };

  const getAlertIcon = (type: string) => {
    const l = type.toLowerCase();
    if (l.includes('cyclone')) return <Wind size={18} className="text-purple-400" />;
    if (l.includes('rain')) return <CloudRain size={18} className="text-blue-400" />;
    if (l.includes('thunder') || l.includes('lightning')) return <Zap size={18} className="text-yellow-400" />;
    if (l.includes('heat')) return <Flame size={18} className="text-orange-400" />;
    if (l.includes('flood')) return <Waves size={18} className="text-cyan-400" />;
    return <ShieldAlert size={18} className="text-sky-400" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Overview Banner */}
      <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm tracking-wide uppercase">
              <ShieldAlert size={18} />
              <span>{t.alerts_title}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Active Warnings for {locationName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrated against meteorological early-warning standards.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'Extreme', 'High', 'Moderate', 'Low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === sev
                    ? 'bg-sky-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const style = getSeverityStyle(alert.severity);

          return (
            <div
              key={alert.id}
              className={`rounded-2xl border p-5 transition shadow-sm ${style.border}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      {alert.type}
                    </span>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {alert.headline}
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${style.badge}`}>
                  {alert.severity}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                {alert.description}
              </p>

              {/* Actionable Instruction Box */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <div className="font-semibold text-sky-400 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Protective Action / Safety Guidance</span>
                </div>
                <p className="text-slate-200">{alert.instruction}</p>
              </div>

              {/* Validity footer */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-500" />
                  <span>Valid: {alert.valid_until}</span>
                </span>
                <span>Issue: {alert.issued_time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency helpline note */}
      <div className="bg-[#121c2e] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <PhoneCall size={16} className="text-amber-400 shrink-0" />
          <span>National Emergency Helpline (India): <strong className="text-white">112</strong> | Disaster Management (NDMA): <strong className="text-white">1078</strong></span>
        </div>
        <span className="text-[11px] text-slate-500">Official Meteorological Protocol</span>
      </div>
    </div>
  );
};
