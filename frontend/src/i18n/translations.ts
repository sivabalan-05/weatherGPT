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
  nav_dejavu: string;
  dejavu_title: string;
  dejavu_subtitle: string;
  dejavu_today_fingerprint: string;
  dejavu_closest_matches: string;
  dejavu_what_followed: string;
  dejavu_rain_72h: string;
  dejavu_avg_week: string;
  dejavu_temp_day3: string;
  dejavu_match: string;
  dejavu_searching: string;
  dejavu_unavailable: string;
  dejavu_retry: string;
  dejavu_archive_note: string;
  dejavu_similarity_caveat: string;
  dejavu_next_7_days: string;
  dejavu_that_week_total: string;
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
    disclaimer: "Advisory based on numerical meteorological predictions.",
    nav_dejavu: "Déjà Vu",
    dejavu_title: "Weather Déjà Vu",
    dejavu_subtitle: "When this place last looked like today, here is what came next.",
    dejavu_today_fingerprint: "Today's fingerprint",
    dejavu_closest_matches: "Closest days in the record",
    dejavu_what_followed: "What history did next",
    dejavu_rain_72h: "Rain within 72 hours",
    dejavu_avg_week: "Average week that followed",
    dejavu_temp_day3: "Temperature by day 3",
    dejavu_match: "match",
    dejavu_searching: "Searching four decades of observed record…",
    dejavu_unavailable: "No historical match available",
    dejavu_retry: "Try again",
    dejavu_archive_note: "Matched against observed daily records",
    dejavu_similarity_caveat: "Match strength compares how alike two days were. It is not a probability.",
    dejavu_next_7_days: "The 7 days that followed",
    dejavu_that_week_total: "total that week"
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
    disclaimer: "यह सलाह मौसम विज्ञान मॉडलों पर आधारित है।",
    nav_dejavu: "डेजा वू",
    dejavu_title: "मौसम डेजा वू",
    dejavu_subtitle: "जब यह जगह पिछली बार आज जैसी दिखी थी, उसके बाद यह हुआ था।",
    dejavu_today_fingerprint: "आज की पहचान",
    dejavu_closest_matches: "रिकॉर्ड में सबसे मिलते-जुलते दिन",
    dejavu_what_followed: "इतिहास में आगे क्या हुआ",
    dejavu_rain_72h: "72 घंटों में वर्षा",
    dejavu_avg_week: "उसके बाद का औसत सप्ताह",
    dejavu_temp_day3: "तीसरे दिन तक तापमान",
    dejavu_match: "मेल",
    dejavu_searching: "चार दशकों के दर्ज रिकॉर्ड खोजे जा रहे हैं…",
    dejavu_unavailable: "कोई ऐतिहासिक मेल उपलब्ध नहीं",
    dejavu_retry: "फिर कोशिश करें",
    dejavu_archive_note: "दर्ज दैनिक रिकॉर्ड से मिलान किया गया",
    dejavu_similarity_caveat: "मेल की ताकत बताती है कि दो दिन कितने समान थे। यह संभावना नहीं है।",
    dejavu_next_7_days: "उसके बाद के 7 दिन",
    dejavu_that_week_total: "उस सप्ताह कुल"
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
    disclaimer: "ఈ సలహా వాతావరణ సూచన నమూనాలపై ఆధారపడి ఉంటుంది.",
    nav_dejavu: "డేజా వు",
    dejavu_title: "వాతావరణ డేజా వు",
    dejavu_subtitle: "ఈ ప్రాంతం చివరిసారి ఇలా ఉన్నప్పుడు, ఆ తర్వాత ఏమి జరిగిందో ఇదిగో.",
    dejavu_today_fingerprint: "నేటి ముద్ర",
    dejavu_closest_matches: "రికార్డులో అత్యంత దగ్గరి రోజులు",
    dejavu_what_followed: "చరిత్రలో ఆ తర్వాత ఏమైంది",
    dejavu_rain_72h: "72 గంటల్లో వర్షం",
    dejavu_avg_week: "ఆ తర్వాతి సగటు వారం",
    dejavu_temp_day3: "మూడో రోజు నాటికి ఉష్ణోగ్రత",
    dejavu_match: "సరిపోలిక",
    dejavu_searching: "నాలుగు దశాబ్దాల నమోదిత రికార్డును వెతుకుతోంది…",
    dejavu_unavailable: "చారిత్రక సరిపోలిక అందుబాటులో లేదు",
    dejavu_retry: "మళ్ళీ ప్రయత్నించండి",
    dejavu_archive_note: "నమోదైన రోజువారీ రికార్డులతో సరిపోల్చబడింది",
    dejavu_similarity_caveat: "సరిపోలిక బలం రెండు రోజులు ఎంత సారూప్యంగా ఉన్నాయో చూపుతుంది. ఇది సంభావ్యత కాదు.",
    dejavu_next_7_days: "ఆ తర్వాతి 7 రోజులు",
    dejavu_that_week_total: "ఆ వారం మొత్తం"
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
    disclaimer: "இந்த ஆலோசனை வானிலை மாதிரிகளை அடிப்படையாகக் கொண்டது.",
    nav_dejavu: "டெஜா வூ",
    dejavu_title: "வானிலை டெஜா வூ",
    dejavu_subtitle: "இந்த இடம் கடைசியாக இன்று போல் இருந்தபோது, அதன் பிறகு நடந்தது இதுதான்.",
    dejavu_today_fingerprint: "இன்றைய அடையாளம்",
    dejavu_closest_matches: "பதிவில் மிக நெருக்கமான நாட்கள்",
    dejavu_what_followed: "வரலாற்றில் அடுத்து நடந்தது",
    dejavu_rain_72h: "72 மணி நேரத்தில் மழை",
    dejavu_avg_week: "அதைத் தொடர்ந்த சராசரி வாரம்",
    dejavu_temp_day3: "மூன்றாம் நாள் வெப்பநிலை",
    dejavu_match: "பொருத்தம்",
    dejavu_searching: "நான்கு தசாப்தப் பதிவுகள் தேடப்படுகின்றன…",
    dejavu_unavailable: "வரலாற்றுப் பொருத்தம் கிடைக்கவில்லை",
    dejavu_retry: "மீண்டும் முயற்சிக்கவும்",
    dejavu_archive_note: "பதிவான தினசரி ஆவணங்களுடன் ஒப்பிடப்பட்டது",
    dejavu_similarity_caveat: "பொருத்த வலிமை இரு நாட்கள் எவ்வளவு ஒத்தவை என்பதைக் காட்டுகிறது. இது நிகழ்தகவு அல்ல.",
    dejavu_next_7_days: "அதைத் தொடர்ந்த 7 நாட்கள்",
    dejavu_that_week_total: "அந்த வாரம் மொத்தம்"
  }
};
