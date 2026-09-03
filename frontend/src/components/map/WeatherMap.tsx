import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Info, Loader2 } from 'lucide-react';
import { LocationInfo, ForecastResponse } from '../../types/weather';
import { WeatherAPI } from '../../api/client';
import L from 'leaflet';

interface WeatherMapProps {
  currentLocation: LocationInfo;
  currentForecast: ForecastResponse;
  onSelectNewLocation: (loc: LocationInfo) => void;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({
  currentLocation,
  currentForecast,
  onSelectNewLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [clickedWeather, setClickedWeather] = useState<{
    name: string;
    lat: number;
    lon: number;
    temp: number;
    cond: string;
  } | null>(null);
  const [loadingPoint, setLoadingPoint] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Fix default leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.latitude, currentLocation.longitude],
        zoom: 7,
        zoomControl: true,
      });

      // CartoDB Dark Matter layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Add main marker
      const marker = L.marker([currentLocation.latitude, currentLocation.longitude])
        .addTo(map)
        .bindPopup(`<strong>${currentLocation.name}</strong><br/>${currentForecast.current.temperature}°C, ${currentForecast.current.condition}`)
        .openPopup();

      markerRef.current = marker;

      // Handle map click
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setLoadingPoint(true);
        try {
          const forecast = await WeatherAPI.getForecast(lat, lng, `Point (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            markerRef.current.bindPopup(`<strong>Selected Station</strong><br/>${forecast.current.temperature}°C, ${forecast.current.condition}`).openPopup();
          }

          setClickedWeather({
            name: `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
            lat,
            lon: lng,
            temp: forecast.current.temperature,
            cond: forecast.current.condition
          });
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingPoint(false);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive or handle unmount if needed
    };
  }, []);

  // Update map center when location prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLocation.latitude, currentLocation.longitude], 7);
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLocation.latitude, currentLocation.longitude]);
        markerRef.current.bindPopup(`<strong>${currentLocation.name}</strong><br/>${currentForecast.current.temperature}°C, ${currentForecast.current.condition}`).openPopup();
      }
    }
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.name, currentForecast]);

  const applyClickedLocation = () => {
    if (!clickedWeather) return;
    onSelectNewLocation({
      name: clickedWeather.name,
      latitude: clickedWeather.lat,
      longitude: clickedWeather.lon
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Map Bar */}
      <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="text-sky-400" size={18} />
          <span>Active Station: <strong className="text-white">{currentLocation.name}</strong> ({currentLocation.latitude.toFixed(2)}°, {currentLocation.longitude.toFixed(2)}°)</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info size={14} className="text-sky-400" />
          <span>Click anywhere on the map to inspect weather coordinates</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Loading Indicator */}
        {loadingPoint && (
          <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-sky-400 shadow-lg backdrop-blur-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>Fetching station readings...</span>
          </div>
        )}

        {/* Clicked Coordinate Card Overlay */}
        {clickedWeather && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[1000] bg-[#141e33]/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Inspected Coordinates</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{clickedWeather.name}</h4>
              </div>
              <span className="text-xl font-extrabold text-white">{clickedWeather.temp}°C</span>
            </div>
            <div className="text-xs text-slate-300 mt-1 capitalize">
              {clickedWeather.cond}
            </div>

            <button
              onClick={applyClickedLocation}
              className="mt-3 w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition shadow"
            >
              Set as Active Dashboard Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
