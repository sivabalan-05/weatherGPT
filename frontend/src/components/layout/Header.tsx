import React, { useState, useEffect } from 'react';
import { CloudLightning, Search, Mic, MapPin, Globe, Sparkles, Radio } from 'lucide-react';
import { SupportedLanguage } from '../../i18n/translations';

interface HeaderProps {
  currentLocationName: string;
  onOpenSearch: () => void;
  onOpenVoice: () => void;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocationName,
  onOpenSearch,
  onOpenVoice,
  selectedLanguage,
  onLanguageChange
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3.5 bg-[#060a14]/85 backdrop-blur-xl border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand with Radar Animation */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-sky-500/20 border border-white/20">
            <div className="w-full h-full rounded-[14px] bg-[#070e1e] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent animate-pulse" />
              <CloudLightning className="text-sky-400 relative z-10" size={20} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-white flex items-center">
                Weather<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-300">GPT</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                NWP LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal hidden sm:flex items-center gap-1.5 mt-0.5">
              <span>Synoptic Intelligence Station</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono-data text-slate-400">{timeStr}</span>
            </p>
          </div>
        </div>

        {/* Center Search Pill */}
        <div className="flex-1 max-w-lg mx-1 sm:mx-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-sky-500/40 rounded-2xl text-left transition duration-200 group shadow-inner"
          >
            <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-slate-200 text-xs sm:text-sm truncate">
              <Search size={16} className="text-sky-400 shrink-0 group-hover:scale-110 transition" />
              <span className="truncate">
                {currentLocationName ? (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-sky-400 shrink-0" />
                    <strong className="text-white font-medium">{currentLocationName}</strong>
                    <span className="text-slate-500 hidden sm:inline">— Change Station</span>
                  </span>
                ) : (
                  'Search station, city or coordinates...'
                )}
              </span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 rounded-lg shadow-sm">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Voice Input Trigger */}
          <button
            onClick={onOpenVoice}
            title="Ask WeatherGPT by voice"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/[0.08] hover:border-sky-500/30 text-slate-300 hover:text-sky-300 transition duration-150 shadow-sm"
          >
            <Mic size={17} />
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-2.5 py-1.5 transition">
            <Globe size={14} className="text-sky-400 mr-1.5 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="en" className="bg-[#0b1325] text-white">English (EN)</option>
              <option value="hi" className="bg-[#0b1325] text-white">हिंदी (HI)</option>
              <option value="te" className="bg-[#0b1325] text-white">తెలుగు (TE)</option>
              <option value="ta" className="bg-[#0b1325] text-white">தமிழ் (TA)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
