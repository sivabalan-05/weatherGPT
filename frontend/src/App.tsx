import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Navigation, NavTab } from './components/layout/Navigation';
import { WeatherHero } from './components/dashboard/WeatherHero';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { HourlyStrip } from './components/dashboard/HourlyStrip';
import { DailyForecast } from './components/dashboard/DailyForecast';
import { DashboardAlertsBanner } from './components/dashboard/DashboardAlertsBanner';
import { CitySearchModal } from './components/dashboard/CitySearchModal';
import { WeatherGPTAssistant } from './components/chat/WeatherGPTAssistant';
import { AlertsView } from './components/alerts/AlertsView';
import { WeatherMap } from './components/map/WeatherMap';
import { AgriAdvisory } from './components/agriculture/AgriAdvisory';
import { ClimateView } from './components/climate/ClimateView';
import { AnalogView } from './components/analog/AnalogView';
import { VoiceInputModal } from './components/common/VoiceInputModal';
import { LocationInfo, ForecastResponse, AlertItem } from './types/weather';
import { WeatherAPI, WeatherAPIError } from './api/client';
import { SupportedLanguage } from './i18n/translations';
import { Loader2, AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

const DEFAULT_LOCATION: LocationInfo = {
  name: "Chennai",
  latitude: 13.0827,
  longitude: 80.2707,
  country: "India",
  admin1: "Tamil Nadu",
  timezone: "Asia/Kolkata"
};

export function App() {
  const [activeLocation, setActiveLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard shortcut Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch forecast and alerts whenever active location changes
  useEffect(() => {
    loadWeatherData();
  }, [activeLocation]);

  const loadWeatherData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Validate location parameters before fetching
      if (!activeLocation || isNaN(activeLocation.latitude) || isNaN(activeLocation.longitude)) {
        throw new WeatherAPIError("Invalid station coordinates provided.");
      }

      const [forecastData, alertsData] = await Promise.all([
        WeatherAPI.getForecast(activeLocation.latitude, activeLocation.longitude, activeLocation.name),
        WeatherAPI.getAlerts(activeLocation.latitude, activeLocation.longitude, activeLocation.name)
      ]);
      setForecast(forecastData);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error("Error loading weather data:", err);
      const msg = err?.message || "Unable to retrieve meteorological data for this location.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
  };

  const handleResetToDefault = () => {
    setActiveLocation(DEFAULT_LOCATION);
  };

  const handleAskQuery = (queryText: string) => {
    setChatInitialQuery(queryText);
    setActiveTab('chat');
  };

  const handleSpeechResult = (text: string) => {
    setChatInitialQuery(text);
    setActiveTab('chat');
  };

  const handleSelectNewCity = (city: LocationInfo) => {
    setActiveLocation(city);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16 md:pb-6">
      {/* Main Header */}
      <Header
        currentLocationName={activeLocation.name}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Navigation Subheader / Mobile Dock */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        lang={selectedLanguage}
        alertCount={alerts.filter(a => a.severity !== 'Low').length}
      />

      {/* Synchronizing indicator pill */}
      {loading && forecast && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-2 flex items-center justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] text-sky-600">
            <Loader2 size={12} className="animate-spin" />
            <span>Updating real-time observation feeds...</span>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Error Notification Card if any */}
        {errorMessage && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Weather Data Retrieval Notice</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
                <p className="text-[11px] text-slate-500 mt-1">Active Station: {activeLocation.name} ({activeLocation.latitude}°, {activeLocation.longitude}°)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition shadow-sm"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                <span>Retry</span>
              </button>
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow transition"
              >
                <MapPin size={13} />
                <span>Reset Station</span>
              </button>
            </div>
          </div>
        )}

        {/* Initial loading state when no forecast is cached yet */}
        {loading && !forecast && !errorMessage ? (
          <div className="py-36 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="text-sky-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium">
              Connecting to numerical weather prediction API...
            </span>
          </div>
        ) : forecast ? (
          <>
            {/* View Switcher */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Hero Section with Live Current Weather & Summary */}
                <WeatherHero
                  forecast={forecast}
                  alerts={alerts}
                  lang={selectedLanguage}
                  onAskQuery={handleAskQuery}
                  onViewAlerts={() => setActiveTab('alerts')}
                />

                {/* Prominent Weather Alert Section */}
                <DashboardAlertsBanner
                  alerts={alerts}
                  locationName={activeLocation.name}
                  onViewAllAlerts={() => setActiveTab('alerts')}
                  lang={selectedLanguage}
                />

                {/* Key Metrics Grid */}
                <MetricsGrid forecast={forecast} lang={selectedLanguage} />

                {/* Hourly Forecast Strip (Aligned to Current Hour Forward) */}
                <HourlyStrip hourly={forecast.hourly} lang={selectedLanguage} />

                {/* 7-Day Outlook */}
                <DailyForecast daily={forecast.daily} lang={selectedLanguage} />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="animate-in fade-in duration-200">
                <WeatherGPTAssistant
                  currentLocationName={activeLocation.name}
                  latitude={activeLocation.latitude}
                  longitude={activeLocation.longitude}
                  forecast={forecast}
                  initialQuery={chatInitialQuery}
                  lang={selectedLanguage}
                  onOpenVoice={() => setIsVoiceOpen(true)}
                />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="animate-in fade-in duration-200">
                <AlertsView
                  alerts={alerts}
                  locationName={activeLocation.name}
                  lang={selectedLanguage}
                />
              </div>
            )}

            {activeTab === 'map' && (
              <div className="animate-in fade-in duration-200">
                <WeatherMap
                  currentLocation={activeLocation}
                  currentForecast={forecast}
                  onSelectNewLocation={handleSelectNewCity}
                />
              </div>
            )}

            {activeTab === 'agriculture' && (
              <div className="animate-in fade-in duration-200">
                <AgriAdvisory
                  location={activeLocation}
                  lang={selectedLanguage}
                />
              </div>
            )}

            {activeTab === 'climate' && (
              <div className="animate-in fade-in duration-200">
                <ClimateView
                  location={activeLocation}
                  lang={selectedLanguage}
                />
              </div>
            )}

            {activeTab === 'dejavu' && (
              <div className="animate-in fade-in duration-200">
                <AnalogView
                  location={activeLocation}
                  lang={selectedLanguage}
                />
              </div>
            )}
          </>
        ) : !loading && !forecast && (
          <div className="py-24 text-center glass-panel rounded-3xl p-8 max-w-md mx-auto">
            <AlertTriangle className="text-amber-500 mx-auto mb-3" size={36} />
            <h3 className="font-heading text-base font-bold text-slate-900 mb-1">Weather Station Offline</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {errorMessage || "Unable to load meteorological data for this station. Please check your connection."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-sm"
              >
                Try Again
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 rounded-xl text-white text-xs font-semibold shadow-sm transition"
              >
                Reset to Chennai
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-5 px-4 sm:px-6 bg-white/70 backdrop-blur-md text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-700">WeatherGPT</span>
            <span className="text-slate-300">•</span>
            <span>Synoptic Intelligence &copy; 2026. Real-time ECMWF / GFS Numerical Prediction.</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono-data text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>NWP 0.1° Grid</span>
            </span>
            <span>Strict Zero AI Hallucinations</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCity={handleSelectNewCity}
        lang={selectedLanguage}
      />

      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSpeechResult={handleSpeechResult}
      />
    </div>
  );
}

export default App;
