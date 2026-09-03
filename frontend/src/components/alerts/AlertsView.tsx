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
          badge: 'bg-red-50 text-red-700 border-red-200',
          border: 'border-red-200 bg-red-50/60',
          icon: <AlertTriangle className="text-red-600 shrink-0" size={20} />
        };
      case 'High':
        return {
          badge: 'bg-orange-50 text-orange-700 border-orange-200',
          border: 'border-orange-200 bg-orange-50/60',
          icon: <AlertTriangle className="text-orange-600 shrink-0" size={20} />
        };
      case 'Moderate':
        return {
          badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          border: 'border-yellow-200 bg-yellow-50/40',
          icon: <AlertCircle className="text-yellow-600 shrink-0" size={20} />
        };
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          border: 'border-emerald-200 bg-emerald-50/40',
          icon: <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
        };
    }
  };

  const getAlertIcon = (type: string) => {
    const l = type.toLowerCase();
    if (l.includes('cyclone')) return <Wind size={18} className="text-purple-600" />;
    if (l.includes('rain')) return <CloudRain size={18} className="text-blue-600" />;
    if (l.includes('thunder') || l.includes('lightning')) return <Zap size={18} className="text-yellow-600" />;
    if (l.includes('heat')) return <Flame size={18} className="text-orange-600" />;
    if (l.includes('flood')) return <Waves size={18} className="text-cyan-600" />;
    return <ShieldAlert size={18} className="text-sky-600" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-bold text-sm tracking-wide uppercase">
              <ShieldAlert size={18} />
              <span>{t.alerts_title}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Active Warnings for {locationName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200'
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
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {alert.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {alert.headline}
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${style.badge}`}>
                  {alert.severity}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {alert.description}
              </p>

              {/* Actionable Instruction Box */}
              <div className="mt-3.5 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                <div className="font-semibold text-sky-600 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Protective Action / Safety Guidance</span>
                </div>
                <p className="text-slate-700">{alert.instruction}</p>
              </div>

              {/* Validity footer */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>Valid: {alert.valid_until}</span>
                </span>
                <span>Issue: {alert.issued_time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency helpline note */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-500 shadow-sm">
        <div className="flex items-center gap-2">
          <PhoneCall size={16} className="text-amber-600 shrink-0" />
          <span>National Emergency Helpline (India): <strong className="text-slate-900">112</strong> | Disaster Management (NDMA): <strong className="text-slate-900">1078</strong></span>
        </div>
        <span className="text-[11px] text-slate-400">Official Meteorological Protocol</span>
      </div>
    </div>
  );
};
