import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { LocationInfo } from '../../types/weather';
import { WeatherAPI } from '../../api/client';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: LocationInfo) => void;
  lang: SupportedLanguage;
}

const POPULAR_INDIAN_CITIES: LocationInfo[] = [
  { name: "Chennai", latitude: 13.0827, longitude: 80.2707, country: "India", admin1: "Tamil Nadu" },
  { name: "New Delhi", latitude: 28.6139, longitude: 77.2090, country: "India", admin1: "Delhi" },
  { name: "Mumbai", latitude: 19.0760, longitude: 72.8777, country: "India", admin1: "Maharashtra" },
  { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, country: "India", admin1: "Karnataka" },
  { name: "Hyderabad", latitude: 17.3850, longitude: 78.4867, country: "India", admin1: "Telangana" },
  { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, country: "India", admin1: "West Bengal" },
  { name: "Pune", latitude: 18.5204, longitude: 73.8567, country: "India", admin1: "Maharashtra" },
  { name: "Jaipur", latitude: 26.9124, longitude: 75.7873, country: "India", admin1: "Rajasthan" },
  { name: "Kochi", latitude: 9.9312, longitude: 76.2673, country: "India", admin1: "Kerala" },
];

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  lang
}) => {
  const t = translations[lang] || translations.en;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchError(null);
    } else {
      setQuery('');
      setResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const data = await WeatherAPI.searchCities(query);
        setResults(data);
      } catch (err: any) {
        console.error(err);
        setSearchError(err?.message || "Failed to search location. Please check network connection.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        onSelectCity({
          name: "Current Location",
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          country: "GPS",
          admin1: "Local"
        });
        onClose();
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setSearchError("Location permission denied. Please allow access or select a city manually.");
        } else {
          setSearchError("Unable to retrieve device GPS coordinates. Please select a city manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="text-sky-600 shrink-0" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search_placeholder}
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          {loading && <Loader2 className="animate-spin text-slate-400" size={18} />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* GPS Current Location Button */}
        <div className="p-2 border-b border-slate-200 bg-slate-50">
          <button
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition"
          >
            {geoLoading ? (
              <>
                <Loader2 size={14} className="animate-spin text-sky-600" />
                <span>Locating your GPS coordinates...</span>
              </>
            ) : (
              <>
                <Navigation size={14} className="text-sky-600" />
                <span>Use My Exact Current Location</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert if any */}
        {searchError && (
          <div className="m-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle size={15} className="text-rose-500 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {results.length > 0 ? (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                Search Results
              </div>
              {results.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-sky-600 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600">Select</span>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 && !loading && !searchError ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No matching meteorological stations found for "{query}".
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                Major Indian Meteorological Stations
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {POPULAR_INDIAN_CITIES.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                    className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition"
                  >
                    <div className="text-xs font-semibold text-slate-900">{city.name}</div>
                    <div className="text-[10px] text-slate-500">{city.admin1}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
