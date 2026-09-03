import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  CloudRain,
  Wind,
  Flame,
  Waves,
  Zap,
  Clock
} from 'lucide-react';
import { AlertItem } from '../../types/weather';
import { SupportedLanguage } from '../../i18n/translations';

interface DashboardAlertsBannerProps {
  alerts: AlertItem[];
  locationName: string;
  onViewAllAlerts: () => void;
  lang: SupportedLanguage;
}

export const DashboardAlertsBanner: React.FC<DashboardAlertsBannerProps> = ({
  alerts,
  locationName,
  onViewAllAlerts,
  lang
}) => {
  const severeAlerts = alerts.filter(a => a.severity !== 'Low');
  const topAlert = severeAlerts[0];

  const getAlertIcon = (type: string) => {
    const l = type.toLowerCase();
    if (l.includes('cyclone')) return <Wind size={20} className="text-purple-600" />;
    if (l.includes('rain')) return <CloudRain size={20} className="text-sky-600" />;
    if (l.includes('thunder') || l.includes('lightning')) return <Zap size={20} className="text-yellow-600" />;
    if (l.includes('heat')) return <Flame size={20} className="text-orange-600" />;
    if (l.includes('flood')) return <Waves size={20} className="text-cyan-600" />;
    return <AlertTriangle size={20} className="text-amber-600" />;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Moderate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getContainerStyle = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return 'bg-gradient-to-r from-red-50 via-white to-white border-red-200 shadow-sm';
      case 'High':
        return 'bg-gradient-to-r from-orange-50 via-white to-white border-orange-200 shadow-sm';
      case 'Moderate':
        return 'bg-gradient-to-r from-yellow-50 via-white to-white border-yellow-200 shadow-sm';
      default:
        return 'bg-white border-slate-200';
    }
  };

  if (!topAlert) {
    return (
      <div className="w-full bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-xs text-slate-600 shadow-sm transition">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong className="text-emerald-600 font-semibold">Normal Baseline Vigilance:</strong> No severe meteorological warnings active for <span className="text-slate-900 font-medium">{locationName}</span>.
          </span>
        </div>
        <button
          onClick={onViewAllAlerts}
          className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 shrink-0 group transition"
        >
          <span>Alerts Hub</span>
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full border rounded-3xl p-5 sm:p-6 transition duration-200 ${getContainerStyle(topAlert.severity)}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
            {getAlertIcon(topAlert.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-data font-bold border uppercase tracking-wider ${getSeverityBadge(topAlert.severity)}`}>
                {topAlert.severity} Hazard
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {topAlert.type}
              </span>
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {topAlert.headline}
            </h3>
          </div>
        </div>

        <button
          onClick={onViewAllAlerts}
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm"
        >
          <span>View All ({severeAlerts.length})</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-0 sm:pl-12">
        {topAlert.description}
      </p>

      {/* Safety Directive Pill */}
      <div className="mt-3.5 sm:ml-12 p-3 rounded-2xl bg-white border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700 shadow-sm">
        <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-700 font-semibold">Authoritative Directive: </strong>
          <span>{topAlert.instruction}</span>
        </div>
      </div>

      <div className="mt-3 sm:ml-12 flex items-center justify-between text-[11px] font-mono-data text-slate-500 pt-2.5 border-t border-slate-200">
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-400" />
          <span>Valid Through: <strong className="text-slate-600">{topAlert.valid_until}</strong></span>
        </span>
        <span>Issued: {topAlert.issued_time}</span>
      </div>
    </div>
  );
};
