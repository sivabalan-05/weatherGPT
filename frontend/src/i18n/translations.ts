export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta';

export interface TranslationDict {
  app_name: string;
  tagline: string;
  nav_dashboard: string;
  nav_assistant: string;
  nav_alerts: string;
  nav_map: string;
  nav_agriculture: string;
  nav_climate: string;
  search_placeholder: string;
  current_location: string;
  feels_like: string;
  humidity: string;
  wind_speed: string;
  rainfall: string;
  pressure: string;
  uv_index: string;
  hourly_forecast: string;
  daily_forecast: string;
  status_summary: string;
  alerts_title: string;
  chat_placeholder: string;
  crop_select: string;
  irrigation_advisory: string;
  farming_activities: string;
  climate_trends: string;
  disclaimer: string;
}

export const translations: Record<SupportedLanguage, TranslationDict> = {
  en: {
    app_name: "WeatherGPT",
    tagline: "Intelligent Meteorological Intelligence & Advisory",
    nav_dashboard: "Dashboard",
    nav_assistant: "WeatherGPT AI",
    nav_alerts: "Alerts",
    nav_map: "Weather Map",
    nav_agriculture: "Agriculture",
    nav_climate: "Climate",
    search_placeholder: "Search city (e.g. Chennai, Delhi, Mumbai)...",
    current_location: "Current Location",
    feels_like: "Feels like",
    humidity: "Humidity",
    wind_speed: "Wind Speed",
    rainfall: "Precipitation",
    pressure: "Atmospheric Pressure",
    uv_index: "UV Index",
    hourly_forecast: "24-Hour Hourly Forecast",
    daily_forecast: "7-Day Meteorological Outlook",
    status_summary: "Weather Summary",
    alerts_title: "Severe Weather Vigilance",
    chat_placeholder: "Ask about rain, travel safety, or weekend forecast...",
    crop_select: "Select Agricultural Crop",
    irrigation_advisory: "Irrigation Advisory",
    farming_activities: "Field Operation Windows",
    climate_trends: "Historical Climate Records",
    disclaimer: "Advisory based on numerical meteorological predictions."
  },
  hi: {
    app_name: "वेदर जीपीटी (WeatherGPT)",
    tagline: "सटीक मौसम पूर्वानुमान और कृषि परामर्श",
    nav_dashboard: "डैशबोर्ड",
    nav_assistant: "वेदर एआई",
    nav_alerts: "मौसम चेतावनी",
    nav_map: "मौसम मानचित्र",
    nav_agriculture: "कृषि परामर्श",
    nav_climate: "जलवायु रुझान",
    search_placeholder: "शहर खोजें (जैसे दिल्ली, मुंबई, पटना)...",
    current_location: "वर्तमान स्थान",
    feels_like: "महसूस तापमान",
    humidity: "आर्द्रता",
    wind_speed: "हवा की गति",
    rainfall: "बारिश",
    pressure: "वायुमंडलीय दबाव",
    uv_index: "यूवी सूचकांक",
    hourly_forecast: "24 घंटे का पूर्वानुमान",
    daily_forecast: "7-दिवसीय मौसम दृष्टिकोण",
    status_summary: "मौसम सारांश",
    alerts_title: "मौसम चेतावनी बुलेटिन",
    chat_placeholder: "बारिश, यात्रा सुरक्षा या मौसम के बारे में पूछें...",
    crop_select: "फसल चुनें",
    irrigation_advisory: "सिंचाई सलाह",
    farming_activities: "कृषि कार्य का उचित समय",
    climate_trends: "ऐतिहासिक जलवायु आंकड़े",
    disclaimer: "यह सलाह मौसम विज्ञान मॉडलों पर आधारित है।"
  },
  te: {
    app_name: "వెదర్ జీపీటీ (WeatherGPT)",
    tagline: "ఖచ్చితమైన వాతావరణ సమాచారం & వ్యవసాయ సలహాలు",
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_assistant: "వాతావరణ అసిస్టెంట్",
    nav_alerts: "హెచ్చరికలు",
    nav_map: "వాతావరణ పటం",
    nav_agriculture: "వ్యవసాయం",
    nav_climate: "వాతావరణ ధోరణులు",
    search_placeholder: "నగరాన్ని శోధించండి (ఉదా. హైదరాబాద్, విశాఖపట్నం)...",
    current_location: "ప్రస్తుత స్థానం",
    feels_like: "అనిపించే ఉష్ణోగ్రత",
    humidity: "తేమ శాతం",
    wind_speed: "గాలి వేగం",
    rainfall: "వర్షపాతం",
    pressure: "వాయుపీడనం",
    uv_index: "యూవీ సూచిక",
    hourly_forecast: "24 గంటల సూచన",
    daily_forecast: "7 రోజుల వాతావరణ అంచనా",
    status_summary: "వాతావరణ సారాంశం",
    alerts_title: "తీవ్ర వాతావరణ హెచ్చరికలు",
    chat_placeholder: "వర్షం, ప్రయాణ భద్రత గురించి అడగండి...",
    crop_select: "పంటను ఎంచుకోండి",
    irrigation_advisory: "నీటిపారుదల సలహా",
    farming_activities: "పొలం పనుల అనుకూల సమయం",
    climate_trends: "చారిత్రక వాతావరణ రికార్డులు",
    disclaimer: "ఈ సలహా వాతావరణ సూచన నమూనాలపై ఆధారపడి ఉంటుంది."
  },
  ta: {
    app_name: "வெதர் ஜிபிடி (WeatherGPT)",
    tagline: "துல்லியமான வானிலை நுண்ணறிவு & வேளாண் ஆலோசனை",
    nav_dashboard: "முகப்பு பலகை",
    nav_assistant: "வானிலை உதவியாளர்",
    nav_alerts: "எச்சரிக்கைகள்",
    nav_map: "வானிலை வரைபடம்",
    nav_agriculture: "வேளாண்மை",
    nav_climate: "காலநிலை போக்குகள்",
    search_placeholder: "நகரத்தை தேடுங்கள் (எ.கா. சென்னை, மதுரை, கோவை)...",
    current_location: "தற்போதைய இடம்",
    feels_like: "உணரப்படும் வெப்பநிலை",
    humidity: "ஈரப்பதம்",
    wind_speed: "காற்றின் வேகம்",
    rainfall: "மழைப்பொழிவு",
    pressure: "வளிமண்டல அழுத்தம்",
    uv_index: "புற ஊதா குறியீடு",
    hourly_forecast: "24 மணி நேர முன்னறிவிப்பு",
    daily_forecast: "7 நாள் வானிலை பார்வை",
    status_summary: "வானிலை சுருக்கம்",
    alerts_title: "வானிலை எச்சரிக்கை அறிவிப்புகள்",
    chat_placeholder: "மழை, பயண பாதுகாப்பு குறித்து கேளுங்கள்...",
    crop_select: "பயிரை தேர்ந்தெடுக்கவும்",
    irrigation_advisory: "பாசன ஆலோசனை",
    farming_activities: "விவசாய பணிகள் நேரம்",
    climate_trends: "வரலாற்று காலநிலை பதிவுகள்",
    disclaimer: "இந்த ஆலோசனை வானிலை மாதிரிகளை அடிப்படையாகக் கொண்டது."
  }
};
