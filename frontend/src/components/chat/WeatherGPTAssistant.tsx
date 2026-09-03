import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Mic,
  RotateCcw,
  CloudRain,
  Car,
  Compass,
  Database,
  Target,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  ShieldAlert,
  Cpu,
  Radio
} from 'lucide-react';
import { ForecastResponse, ChatMessage } from '../../types/weather';
import { WeatherAPI } from '../../api/client';
import { translations, SupportedLanguage } from '../../i18n/translations';

interface WeatherGPTAssistantProps {
  currentLocationName: string;
  latitude: number;
  longitude: number;
  forecast: ForecastResponse;
  initialQuery?: string;
  lang: SupportedLanguage;
  onOpenVoice: () => void;
}

const PRESET_PROMPTS = [
  { text: "Will it rain tomorrow?", icon: <CloudRain size={13} className="text-sky-500" /> },
  { text: "Is it safe to travel today?", icon: <Car size={13} className="text-amber-500" /> },
  { text: "What's the weather this evening?", icon: <Clock size={13} className="text-indigo-500" /> },
  { text: "Will there be heavy rain this week?", icon: <CloudRain size={13} className="text-blue-500" /> },
  { text: "What should I wear today?", icon: <Compass size={13} className="text-emerald-500" /> },
];

export const WeatherGPTAssistant: React.FC<WeatherGPTAssistantProps> = ({
  currentLocationName,
  latitude,
  longitude,
  forecast,
  initialQuery,
  lang,
  onOpenVoice
}) => {
  const t = translations[lang] || translations.en;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          text: `Welcome to the WeatherGPT Synoptic Intelligence Station. Ask any natural weather question for ${currentLocationName} or any global city. I will extract location, date/time, and meteorological intent, retrieve verified numerical data, and explain the findings with zero invented values.`,
          badge: `${forecast.current.temperature}°C • ${forecast.current.condition}`,
          rating: "Active Station",
          extracted_entities: {
            location: currentLocationName,
            timeframe: "Real-time Telemetry",
            intent: "Station Overview"
          },
          verified_data: {
            temperature_c: forecast.current.temperature,
            feels_like_c: forecast.current.feels_like,
            rain_probability_pct: forecast.daily[0]?.precip_prob_max || 0,
            condition: forecast.current.condition,
            wind_speed_kmh: forecast.current.wind_speed
          },
          key_facts: [
            `Active Station: ${currentLocationName} (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`,
            `Observed Temperature: ${forecast.current.temperature}°C (Feels like ${forecast.current.feels_like}°C)`,
            `Precipitation Probability: ${forecast.daily[0]?.precip_prob_max || 0}%`,
            `Surface Wind Speed: ${forecast.current.wind_speed} km/h`
          ],
          action_advice: "Select any inquiry prompt below or type specific questions on rain timing, travel hazard windows, or thermal trends.",
          suggested_followups: [
            "Will it rain tomorrow?",
            "Is it safe to travel today?",
            "What's the weather this evening?"
          ],
          grounded_source: "Live ECMWF/GFS Numerical Weather Prediction Models (Strict Grounding)"
        }
      ]);
    }
  }, [currentLocationName]);

  // If an initial query was passed from dashboard
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await WeatherAPI.askWeatherGPT(q, latitude, longitude, currentLocationName, forecast);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        text: resp.answer || "Meteorological assessment processed.",
        badge: resp.badge,
        rating: resp.rating,
        key_facts: resp.key_facts,
        action_advice: resp.action_advice,
        suggested_followups: resp.suggested_followups,
        location_tagged: resp.target_location,
        extracted_entities: resp.extracted_entities,
        verified_data: resp.verified_data,
        active_alerts: resp.active_alerts,
        grounded_source: resp.grounded_source || "ECMWF/GFS Verified Observations (Strict Grounding)"
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          text: `Meteorological provider communication interrupted. Current telemetry at ${currentLocationName} reads ${forecast.current.temperature}°C with ${forecast.current.condition}.`,
          badge: "Provider Offline"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-5xl mx-auto glass-panel rounded-3xl overflow-hidden transition">
      {/* Top Station HUD Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                WeatherGPT Synoptic Intelligence
              </h2>
              <span className="text-[10px] font-mono-data font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={11} />
                Strict Data Grounding
              </span>
            </div>
            <p className="text-[11px] font-mono-data text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin size={11} className="text-sky-600" />
              <span>Base Station: <strong className="text-slate-700">{currentLocationName}</strong> ({latitude.toFixed(2)}°, {longitude.toFixed(2)}°)</span>
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          title="Reset telemetry conversation"
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition text-xs font-semibold flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset Station</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
        {/* Preset Prompt Suggestions */}
        {messages.length <= 2 && (
          <div className="mb-3 p-4 rounded-2xl bg-white border border-slate-200">
            <div className="text-[11px] font-mono-data font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Radio size={12} className="text-sky-500 animate-pulse" />
              <span>Recommended Meteorological Inquiries:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.text)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs text-slate-700 hover:text-sky-700 transition duration-150"
                >
                  {p.icon}
                  <span>"{p.text}"</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {isUser ? (
                <div className="max-w-md bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className="block text-[10px] font-mono-data text-sky-100/90 text-right mt-1.5">
                    {msg.timestamp}
                  </span>
                </div>
              ) : (
                <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-700 shadow-sm space-y-3.5">
                  {/* Top Header: Badge, Rating & Grounding source */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Sparkles size={12} />
                      </div>
                      <span className="font-heading text-xs font-bold text-slate-900">WeatherGPT Advisory Bulletin</span>
                    </div>

                    {msg.badge && (
                      <span className="text-[11px] font-mono-data font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {msg.badge}
                      </span>
                    )}
                  </div>

                  {/* Extracted Entity Tags */}
                  {msg.extracted_entities && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono-data text-slate-600">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                        <MapPin size={10} className="text-sky-600" />
                        <strong>Loc:</strong> {msg.extracted_entities.location}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                        <Clock size={10} className="text-indigo-600" />
                        <strong>Time:</strong> {msg.extracted_entities.timeframe}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 capitalize">
                        <Target size={10} className="text-amber-600" />
                        <strong>Intent:</strong> {msg.extracted_entities.intent}
                      </span>
                    </div>
                  )}

                  {/* Active Severe Warning Alert Box if any */}
                  {msg.active_alerts && msg.active_alerts.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={16} className="text-red-600 shrink-0" />
                          <span className="font-heading text-xs font-bold text-red-800">
                            Active Meteorological Warning ({msg.active_alerts[0].severity})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-data font-semibold text-red-700 px-2 py-0.5 rounded-full bg-red-100 border border-red-200">
                          {msg.active_alerts[0].type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {msg.active_alerts[0].headline} — {msg.active_alerts[0].description}
                      </p>
                      <div className="text-[11px] text-amber-700 flex items-start gap-1.5 pt-1.5 border-t border-red-200">
                        <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Protective Directive:</strong> {msg.active_alerts[0].instruction}</span>
                      </div>
                    </div>
                  )}

                  {/* Verified Meteorological Data Chips (Ground Truth HUD) */}
                  {msg.verified_data && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[10px] font-mono-data font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Database size={11} className="text-sky-600" />
                        <span>Verified Telemetry Observations (Ground Truth)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-mono-data">
                        {msg.verified_data.condition && (
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                            Sky: <strong className="text-slate-900 capitalize">{msg.verified_data.condition}</strong>
                          </span>
                        )}
                        {(msg.verified_data.temperature_c !== undefined || msg.verified_data.current_temperature_c !== undefined) && (
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                            <Thermometer size={12} className="text-rose-500" />
                            <span>Temp: <strong className="text-slate-900">{msg.verified_data.temperature_c ?? msg.verified_data.current_temperature_c}°C</strong></span>
                          </span>
                        )}
                        {msg.verified_data.max_temp_c !== undefined && msg.verified_data.min_temp_c !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                            Range: <strong className="text-slate-900">{msg.verified_data.min_temp_c}° - {msg.verified_data.max_temp_c}°C</strong>
                          </span>
                        )}
                        {(msg.verified_data.rain_probability_pct !== undefined || msg.verified_data.today_rain_probability_pct !== undefined) && (
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                            <Droplets size={12} className="text-sky-600" />
                            <span>PoP: <strong className="text-sky-700">{msg.verified_data.rain_probability_pct ?? msg.verified_data.today_rain_probability_pct}%</strong></span>
                          </span>
                        )}
                        {(msg.verified_data.precipitation_sum_mm !== undefined || msg.verified_data['7_day_total_rain_mm'] !== undefined) && (
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                            Precip: <strong className="text-slate-900">{msg.verified_data.precipitation_sum_mm ?? msg.verified_data['7_day_total_rain_mm']} mm</strong>
                          </span>
                        )}
                        {msg.verified_data.wind_speed_kmh !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                            <Wind size={12} className="text-teal-600" />
                            <span>Wind: <strong className="text-slate-900">{msg.verified_data.wind_speed_kmh} km/h</strong></span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Grounded Natural Language Explanation */}
                  <p className="text-sm sm:text-[14px] leading-relaxed text-slate-800 font-normal">
                    {msg.text}
                  </p>

                  {/* Structured Meteorological Key Facts */}
                  {msg.key_facts && msg.key_facts.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                      <div className="text-[10px] font-mono-data font-semibold text-slate-500 uppercase tracking-wider">
                        Synoptic Fact Checklist
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        {msg.key_facts.map((fact, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-sky-600 shrink-0 mt-0.5" />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Advice */}
                  {msg.action_advice && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
                      <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-700 font-semibold">Advisory Directive: </strong>
                        <span>{msg.action_advice}</span>
                      </div>
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-mono-data text-slate-500 uppercase tracking-wider">Follow-up:</span>
                      {msg.suggested_followups.map((fQuery, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(fQuery)}
                          className="text-[11px] bg-slate-50 hover:bg-sky-50 text-sky-600 hover:text-sky-700 border border-slate-200 hover:border-sky-300 px-2.5 py-1 rounded-xl transition"
                        >
                          "{fQuery}"
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grounded Source Footer */}
                  <div className="text-[10px] font-mono-data text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span>{msg.grounded_source || "Verified Observations (Strict Grounding)"}</span>
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-slate-600 flex items-center gap-3 text-xs shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
              <span>Querying atmospheric numerical prediction models and extracting ground truth telemetry...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Command Bar */}
      <div className="p-3.5 sm:p-5 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={onOpenVoice}
            title="Ask by voice"
            className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-500 hover:text-sky-600 transition"
          >
            <Mic size={18} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chat_placeholder}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-normal"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 text-white transition shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
