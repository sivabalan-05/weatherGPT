# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeatherGPT is a two-part meteorological platform: a FastAPI backend that proxies/enriches Open-Meteo data (ECMWF & GFS models) and a React + Vite + Tailwind frontend. It combines a live dashboard, an embedded natural-language weather assistant, IMD-aligned severe weather alerts, an interactive Leaflet map, an agriculture advisory module for staple crops, and historical climate trend charts (Recharts). The UI is localized in English, Hindi, Telugu, and Tamil.

## Commands

### Backend (Python / FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```
Runs on `http://127.0.0.1:8000` (interactive API docs at `/docs`). `run.py` starts uvicorn with `reload=True`.

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev       # dev server on http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint        # oxlint
npm run preview     # preview a production build
```

There is no test suite in this repo (no pytest/vitest/jest config or test files) — do not assume one exists.

## Architecture

### Backend: "grounded" data flow, not free-form LLM output
The core design principle spans `backend/app/services/weather_service.py`, `alert_engine.py`, and `ai_assistant.py`: **all numeric weather facts must originate from Open-Meteo, never from an LLM.** The flow in `ai_assistant.py`'s `AIAssistant.process_query` is:
1. `QueryEntityExtractor.extract` regex-parses the user's free-text query into a target location override, a timeframe bucket (today/this_evening/tomorrow/this_week/etc. with specific hour ranges), and an intent category (rain/travel/temperature/outdoor/clothing/severe/general).
2. `WeatherService.get_forecast` fetches real current/hourly/daily data for the resolved location (geocoding via `WeatherService.search_city` if the query mentions a different place).
3. `AlertEngine.evaluate_alerts` classifies that forecast against hazard thresholds to produce active severe alerts.
4. `_extract_weather_slice` pulls out only the verified numbers relevant to the requested timeframe.
5. `_generate_grounded_explanation` either calls an LLM (Gemini first, then OpenAI, based on which `*_API_KEY` is set in `core/config.py` — note `LLM_PROVIDER` is defined in settings but not actually consulted) with a strict "explain these exact numbers, never invent values" system prompt, or, if no LLM key is configured, falls back to `_grounded_deterministic_synthesis`, which template-generates the same style of answer per intent using only the verified numbers. Both paths return the same JSON shape (`answer`, `badge`, `rating`, `key_facts`, `action_advice`, `suggested_followups`).

When touching the assistant, keep new intents/timeframes flowing through this same "fetch real data → extract slice → explain slice" pipeline rather than letting an LLM (or new code) fabricate weather numbers.

### Backend module layout
- `app/main.py` — FastAPI app, wide-open CORS, mounts one router per domain.
- `app/core/config.py` — `Settings` (pydantic `BaseModel`, not `BaseSettings`) read via `os.getenv` for `GEMINI_API_KEY`/`GOOGLE_API_KEY`/`OPENAI_API_KEY`/`LLM_PROVIDER`/`DEBUG`, plus the fixed Open-Meteo base URLs.
- `app/routers/{weather,chat,alerts,agriculture,climate}.py` — thin FastAPI routers (prefix `/api/<domain>`) that validate query params and delegate to the matching service, translating `ValueError`/`RuntimeError`/generic exceptions into 400/502/500 `HTTPException`s.
- `app/services/weather_service.py` — Open-Meteo integration; owns the WMO weather-code → label/icon/category mapping (`WMO_CODE_MAP`).
- `app/services/alert_engine.py` — IMD-aligned hazard threshold classification (heavy rain, cyclone, thunderstorm/lightning, heatwave, flood, high wind) → severity badges (Low/Moderate/High/Extreme).
- `app/services/agri_engine.py` — per-crop irrigation/spraying/harvest advisory computed from precipitation forecasts.
- `app/services/climate_service.py` — historical climate-normal generation for the climate trends charts.

### Frontend: resilient direct-to-provider fallback
`frontend/src/api/client.ts` (`WeatherAPI`) is the single point of contact with the backend, hardcoded to `http://127.0.0.1:8000/api`. For every call it first tries the FastAPI backend; on network failure, a non-400 error, or 5xx it falls back to calling Open-Meteo (geocoding/forecast) or a static default response (chat/alerts) *directly from the browser*. This means `getForecast`/`searchCities` duplicate weather-code-to-condition mapping and summary logic client-side independent of `weather_service.py` — if you change the WMO code mapping or forecast shape on the backend, mirror the change in `client.ts`'s fallback path too.

### Frontend module layout
- `src/components/layout/` — Header, navigation (desktop nav + mobile dock).
- `src/components/dashboard/` — `WeatherHero`, `MetricsGrid`, `HourlyStrip`, `DailyForecast`, `CitySearchModal` (Ctrl+K), `DashboardAlertsBanner`.
- `src/components/chat/WeatherGPTAssistant.tsx` — renders the assistant's advisory-card responses from `WeatherAPI.askWeatherGPT`.
- `src/components/alerts/AlertsView.tsx`, `src/components/map/WeatherMap.tsx` (Leaflet), `src/components/agriculture/AgriAdvisory.tsx`, `src/components/climate/ClimateView.tsx` (Recharts).
- `src/components/common/` — shared `WeatherIcon`, `VoiceInputModal` (Web Speech API).
- `src/i18n/translations.ts` — token dictionaries for English/Hindi/Telugu/Tamil; keep new UI strings routed through this rather than inlined.
- `src/types/weather.ts` — shared TypeScript interfaces mirrored against the backend's JSON response shapes.

### Config / secrets
Both `.mcp.json` and `.cursor/mcp.json` configure a `21st` MCP server via `${API_KEY_21ST}` — no literal keys are committed. Backend LLM keys (`GEMINI_API_KEY`/`OPENAI_API_KEY`) are optional; without either, the assistant runs entirely on the deterministic synthesizer path described above.
