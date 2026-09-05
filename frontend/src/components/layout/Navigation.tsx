import React from 'react';
import { LayoutDashboard, Sparkles, ShieldAlert, Map, Sprout, LineChart, History } from 'lucide-react';
import { translations, SupportedLanguage } from '../../i18n/translations';

export type NavTab = 'dashboard' | 'chat' | 'alerts' | 'map' | 'agriculture' | 'climate' | 'dejavu';

interface NavigationProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  lang: SupportedLanguage;
  alertCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  lang,
  alertCount = 0
}) => {
  const t = translations[lang] || translations.en;

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: t.nav_dashboard, icon: <LayoutDashboard size={16} /> },
    { id: 'chat', label: t.nav_assistant, icon: <Sparkles size={16} /> },
    { id: 'alerts', label: t.nav_alerts, icon: <ShieldAlert size={16} />, badge: alertCount },
    { id: 'map', label: t.nav_map, icon: <Map size={16} /> },
    { id: 'agriculture', label: t.nav_agriculture, icon: <Sprout size={16} /> },
    { id: 'climate', label: t.nav_climate, icon: <LineChart size={16} /> },
    { id: 'dejavu', label: t.nav_dejavu, icon: <History size={16} /> },
  ];

  return (
    <>
      {/* Desktop Top Segmented Capsule Bar */}
      <nav className="hidden md:block w-full bg-white/70 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition duration-200 relative shrink-0 ${
                    isActive
                      ? 'bg-white text-sky-700 border border-sky-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-sky-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono-data bg-amber-100 text-amber-700 border border-amber-300 font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono-data text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>ECMWF 9km High-Res Matrix</span>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Navigation Dock */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl px-2 py-1.5 shadow-lg shadow-slate-900/10">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-1 min-w-0 flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition relative ${
                  isActive ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative shrink-0">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium mt-1 w-full truncate text-center leading-tight">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
