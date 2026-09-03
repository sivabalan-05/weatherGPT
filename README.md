# WeatherGPT 🌦️

**WeatherGPT** is an intelligent, production-grade meteorological platform and weather assistant. Unlike generic AI chatbots or simple weather widgets, WeatherGPT blends high-precision real-time meteorological models (ECMWF & GFS via Open-Meteo) with context-aware natural language reasoning, severe weather alerts, interactive mapping, agricultural advisories, and historical climate trends.

---

## 🌟 Key Features

### 1. Clean Home / Dashboard
- **Current Conditions**: Temperature, "Feels like" thermal comfort, relative humidity, wind speed & directional compass, precipitation accumulation, atmospheric pressure, and UV index.
- **Narrative Meteorological Summary**: Human-readable synthesis of current and projected conditions.
- **24-Hour Hourly Forecast**: Scrollable horizontal timeline with temperature trends and precipitation probability pills.
- **7-Day Meteorological Outlook**: Daily high/low temperature bar preview, precipitation probability, and weather condition badges.
- **City Search (Ctrl+K)**: Instant search and geocoding across Indian metropolitan areas and global weather stations.

### 2. Embedded WeatherGPT Assistant
- Specialized weather assistant designed into the application workflow (not a generic ChatGPT clone).
- Answers natural inquiries such as:
  - *"Will it rain tomorrow?"*
  - *"Is it safe to travel today?"*
  - *"What's the weather this evening?"*
  - *"Will there be heavy rain this week?"*
- Understands location, time horizon (today, evening, tomorrow, 7 days), and query intent.
- Formulates answers as **Meteorological Advisory Cards** with verdict badges, key atmospheric facts, and actionable protective guidance.

### 3. Severe Weather Alerts (IMD-Aligned)
- Evaluates real-time data against meteorological hazard thresholds:
  - Heavy Rainfall, Cyclone Warnings, Thunderstorms & Lightning, Heatwaves, Flood Risk, and High Winds.
  - Severity Badges: **Low** (Emerald), **Moderate** (Yellow), **High** (Orange), and **Extreme** (Red).
  - Safety instructions, validity horizons, and official helpline references.

### 4. Interactive Weather Map
- Leaflet dark-mode map centered on the active weather station.
- Allows users to click any geographic coordinate to inspect its real-time weather readings or set it as the active location.

### 5. Agriculture Advisory Module
- Tailored for Indian and global staple crops (**Paddy/Rice, Wheat, Cotton, Sugarcane, Maize, Groundnut, Tomato/Vegetables**).
- Computes:
  - 3-day and 7-day expected precipitation.
  - Irrigation suggestions (e.g. "Suspend irrigation: 28 mm rain predicted").
  - Suitable time windows for spraying pesticides/fertilizers and harvesting.
  - Crop disease and weather risk assessments.
  - Clear, prominent advisory disclaimer.

### 6. Climate & Historical Trends
- Recharts visualizations of multi-month seasonal benchmarks:
  - Monthly Average Max/Min and Mean temperature curves.
  - Monthly precipitation accumulations compared against climatological baselines.

### 7. Voice & Multilingual Architecture
- Voice query support via Web Speech API.
- Fully localized token dictionary supporting **English**, **Hindi (हिंदी)**, **Telugu (తెలుగు)**, and **Tamil (தமிழ்)**.

---

## 🏗️ Architecture

```
weatherGPT/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & CORS middleware
│   │   ├── core/config.py       # Configuration & settings
│   │   ├── services/
│   │   │   ├── weather_service.py # Open-Meteo live API integration
│   │   │   ├── ai_assistant.py  # Query interpretation & meteorological reasoning
│   │   │   ├── alert_engine.py  # IMD-aligned hazard classification
│   │   │   ├── agri_engine.py   # Crop water requirement & advisory generator
│   │   │   └── climate_service.py # Historical climate normal generator
│   │   └── routers/             # weather, chat, alerts, agriculture, climate
│   ├── requirements.txt
│   └── run.py                   # Uvicorn runner
└── frontend/
    ├── src/
    │   ├── api/client.ts        # API client with resilient fallbacks
    │   ├── components/
    │   │   ├── layout/          # Header, Desktop Navigation, Mobile Dock
    │   │   ├── dashboard/       # WeatherHero, MetricsGrid, HourlyStrip, DailyForecast
    │   │   ├── chat/            # WeatherGPTAssistant
    │   │   ├── alerts/          # AlertsView
    │   │   ├── map/             # WeatherMap (Leaflet)
    │   │   ├── agriculture/     # AgriAdvisory
    │   │   ├── climate/         # ClimateView (Recharts)
    │   │   └── common/          # WeatherIcon, VoiceInputModal
    │   ├── i18n/                # English, Hindi, Telugu, Tamil dictionaries
    │   ├── types/               # TypeScript interfaces
    │   ├── App.tsx
    │   └── index.css            # Tailwind CSS & Leaflet styling
    └── vite.config.ts
```

---

## 🚀 How to Run

### Backend (Python FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

### Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*
