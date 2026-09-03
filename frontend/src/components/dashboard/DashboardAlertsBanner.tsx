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
    if (l.includes('cyclone')) return <Wind size={20} className="text-purple-300" />;
    if (l.includes('rain')) return <CloudRain size={20} className="text-sky-300" />;
    if (l.includes('thunder') || l.includes('lightning')) return <Zap size={20} className="text-yellow-300" />;
    if (l.includes('heat')) return <Flame size={20} className="text-orange-300" />;
    if (l.includes('flood')) return <Waves size={20} className="text-cyan-300" />;
    return <AlertTriangle size={20} className="text-amber-300" />;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return 'bg-red-500/20 text-red-200 border-red-500/50 shadow-red-950/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-200 border-orange-500/50 shadow-orange-950/30';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/50 shadow-yellow-950/30';
      default:
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
    }
  };

  const getContainerStyle = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-[#0b1220]/80 border-red-500/40 shadow-xl shadow-red-950/20';
      case 'High':
        return 'bg-gradient-to-r from-orange-950/35 via-orange-900/20 to-[#0b1220]/80 border-orange-500/40 shadow-xl shadow-orange-950/20';
      case 'Moderate':
        return 'bg-gradient-to-r from-yellow-950/30 via-yellow-900/15 to-[#0b1220]/80 border-yellow-500/40 shadow-xl shadow-yellow-950/20';
      default:
        return 'bg-white/[0.03] border-white/[0.08]';
    }
  };

  if (!topAlert) {
    return (
      <div className="w-full bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-xs text-slate-300 shadow-sm transition">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>
            <strong className="text-emerald-400 font-semibold">Normal Baseline Vigilance:</strong> No severe meteorological warnings active for <span className="text-white font-medium">{locationName}</span>.
          </span>
        </div>
        <button
          onClick={onViewAllAlerts}
          className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 shrink-0 group transition"
        >
          <span>Alerts Hub</span>
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full border rounded-3xl p-5 sm:p-6 backdrop-blur-xl transition duration-200 ${getContainerStyle(topAlert.severity)}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.1] shadow-inner shrink-0">
            {getAlertIcon(topAlert.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-data font-bold border uppercase tracking-wider ${getSeverityBadge(topAlert.severity)}`}>
                {topAlert.severity} Hazard
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {topAlert.type}
              </span>
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-white mt-1 leading-snug">
              {topAlert.headline}
            </h3>
          </div>
        </div>

        <button
          onClick={onViewAllAlerts}
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.15] text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm"
        >
          <span>View All ({severeAlerts.length})</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-0 sm:pl-12">
        {topAlert.description}
      </p>

      {/* Safety Directive Pill */}
      <div className="mt-3.5 sm:ml-12 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5 text-xs text-slate-200 shadow-sm">
        <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold">Authoritative Directive: </strong>
          <span>{topAlert.instruction}</span>
        </div>
      </div>

      <div className="mt-3 sm:ml-12 flex items-center justify-between text-[11px] font-mono-data text-slate-400 pt-2.5 border-t border-white/[0.06]">
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-500" />
          <span>Valid Through: <strong className="text-slate-300">{topAlert.valid_until}</strong></span>
        </span>
        <span>Issued: {topAlert.issued_time}</span>
      </div>
    </div>
  );
};
