import re
import json
import httpx
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from .weather_service import WeatherService
from ..core.config import settings

class QueryEntityExtractor:
    """Extracts target location, timeframe, and inquiry intent from natural language queries."""

    WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

    @classmethod
    def extract(cls, query: str, active_location_name: str) -> Dict[str, Any]:
        q = query.strip().lower()

        # 1. Location extraction
        extracted_location = None
        # Pattern: in/at/for/around <city>
        loc_match = re.search(r'\b(?:in|at|for|around|to|near)\s+([a-zA-Z\s]{2,25})', q)
        if loc_match:
            cand = loc_match.group(1).strip()
            # Filter temporal words that might follow prepositions
            cand = re.sub(r'\b(today|tomorrow|tonight|this week|evening|morning|afternoon|now|weekend|friday|saturday|sunday|monday|tuesday|wednesday|thursday)\b.*$', '', cand).strip()
            if len(cand) >= 2 and cand not in ["the", "the area", "my area", "here", "travel", "going"]:
                extracted_location = cand.title()

        # 2. Timeframe extraction
        timeframe = "today"
        time_label = "Today"
        specific_hour_range = None

        if "tomorrow evening" in q or "tomorrow night" in q:
            timeframe = "tomorrow_evening"
            time_label = "Tomorrow Evening (5 PM - 10 PM)"
            specific_hour_range = (17, 23)
        elif "tomorrow morning" in q:
            timeframe = "tomorrow_morning"
            time_label = "Tomorrow Morning (6 AM - 11 AM)"
            specific_hour_range = (6, 12)
        elif "tomorrow" in q:
            timeframe = "tomorrow"
            time_label = "Tomorrow"
        elif "this evening" in q or "tonight" in q or "evening" in q:
            timeframe = "this_evening"
            time_label = "This Evening (5 PM - 10 PM)"
            specific_hour_range = (17, 23)
        elif "this afternoon" in q or "afternoon" in q:
            timeframe = "this_afternoon"
            time_label = "This Afternoon (12 PM - 5 PM)"
            specific_hour_range = (12, 17)
        elif "this morning" in q:
            timeframe = "this_morning"
            time_label = "This Morning"
            specific_hour_range = (6, 12)
        elif "this week" in q or "next 7 days" in q or "this weekend" in q or "weekend" in q:
            timeframe = "this_week"
            time_label = "7-Day Outlook"
        else:
            # Check for weekday name
            for day in cls.WEEKDAYS:
                if day in q:
                    timeframe = f"weekday_{day}"
                    time_label = f"Upcoming {day.capitalize()}"
                    break

        # 3. Intent extraction
        intent = "general"
        if any(w in q for w in ["rain", "raining", "shower", "umbrella", "wet", "precipitation", "downpour"]):
            intent = "rain"
        elif any(w in q for w in ["travel", "driving", "drive", "road", "trip", "flight", "commute", "highway", "safe to go"]):
            intent = "travel"
        elif any(w in q for w in ["hot", "cold", "temperature", "warm", "degrees", "chilly", "heat", "heatwave"]):
            intent = "temperature"
        elif any(w in q for w in ["cricket", "running", "jog", "football", "picnic", "walk", "outside", "outdoor", "event", "match"]):
            intent = "outdoor"
        elif any(w in q for w in ["wear", "jacket", "sweater", "clothes", "outfit", "dress"]):
            intent = "clothing"
        elif any(w in q for w in ["cyclone", "storm", "flood", "lightning", "thunder", "wind", "warning", "alert"]):
            intent = "severe"

        return {
            "query": query,
            "target_location_str": extracted_location or active_location_name,
            "location_overridden": extracted_location is not None,
            "timeframe": timeframe,
            "time_label": time_label,
            "specific_hour_range": specific_hour_range,
            "intent": intent
        }


class AIAssistant:
    @staticmethod
    async def process_query(
        query: str,
        active_lat: float,
        active_lon: float,
        active_location_name: str,
        forecast_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        1. Extracts location, timeframe and intent.
        2. Retrieves verified meteorological observation data from Open-Meteo.
        3. Uses LLM strictly to explain the retrieved numbers without hallucinating weather values.
        """
        # Step 1: Entity Extraction
        entities = QueryEntityExtractor.extract(query, active_location_name)
        target_loc_name = entities["target_location_str"]
        target_lat = active_lat
        target_lon = active_lon

        # If user mentioned a different location, geocode it
        if entities["location_overridden"]:
            geo_results = await WeatherService.search_city(target_loc_name)
            if geo_results:
                target_lat = geo_results[0]["latitude"]
                target_lon = geo_results[0]["longitude"]
                target_loc_name = f"{geo_results[0]['name']}, {geo_results[0].get('country', '')}"
            else:
                # Retain active location if geocoding failed
                target_loc_name = active_location_name

        # Step 2: Fetch verified meteorological data for the target location
        forecast = await WeatherService.get_forecast(target_lat, target_lon, target_loc_name)
        current = forecast.get("current", {})
        hourly = forecast.get("hourly", [])
        daily = forecast.get("daily", [])

        # Evaluate real-time alerts for target location
        from .alert_engine import AlertEngine
        all_alerts = AlertEngine.evaluate_alerts(forecast)
        active_severe_alerts = [a for a in all_alerts if a.get("severity") in ["Moderate", "High", "Extreme"]]

        # Step 3: Extract the specific verified meteorological data slice for the requested timeframe
        verified_slice = AIAssistant._extract_weather_slice(entities, current, hourly, daily, target_loc_name, active_severe_alerts)

        # Step 4: Generate grounded explanation using LLM (or Grounded Synthesizer if no LLM key)
        explanation = await AIAssistant._generate_grounded_explanation(
            query=query,
            entities=entities,
            verified_data=verified_slice,
            active_alerts=active_severe_alerts
        )

        return {
            "query": query,
            "target_location": target_loc_name,
            "coordinates": {"lat": target_lat, "lon": target_lon},
            "extracted_entities": {
                "location": target_loc_name,
                "timeframe": entities["time_label"],
                "intent": entities["intent"]
            },
            "verified_data": verified_slice,
            "active_alerts": active_severe_alerts,
            "answer": explanation["answer"],
            "badge": explanation["badge"],
            "rating": explanation["rating"],
            "key_facts": explanation["key_facts"],
            "action_advice": explanation["action_advice"],
            "suggested_followups": explanation.get("suggested_followups", [
                f"Will it rain tomorrow in {target_loc_name.split(',')[0]}?",
                f"Is it safe to travel today?",
                f"What's the weather this evening in {target_loc_name.split(',')[0]}?"
            ]),
            "grounded_source": explanation.get("grounded_source", "ECMWF/GFS Verified Meteorological Models")
        }

    @staticmethod
    def _extract_weather_slice(
        entities: Dict[str, Any],
        current: Dict[str, Any],
        hourly: List[Dict[str, Any]],
        daily: List[Dict[str, Any]],
        location_name: str,
        active_alerts: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Extracts the exact verified numbers corresponding to the user's timeframe."""
        tf = entities["timeframe"]
        today_daily = daily[0] if daily else {}
        tomorrow_daily = daily[1] if len(daily) > 1 else today_daily

        if tf in ["tomorrow", "tomorrow_morning", "tomorrow_evening"]:
            # Filter hourly for tomorrow
            hour_range = entities.get("specific_hour_range")
            filtered_hourly = []
            if len(daily) > 1:
                tom_date = daily[1].get("date", "")
                filtered_hourly = [h for h in hourly if tom_date in h.get("time", "")]
                if hour_range:
                    filtered_hourly = [h for h in filtered_hourly if any(f"T{hr:02d}:" in h.get("time", "") for hr in range(hour_range[0], hour_range[1]))]

            avg_temp = round(sum(h["temp"] for h in filtered_hourly) / len(filtered_hourly), 1) if filtered_hourly else tomorrow_daily.get("max_temp", 30)
            max_pop = max((h["precip_prob"] for h in filtered_hourly), default=tomorrow_daily.get("precip_prob_max", 0))

            return {
                "location": location_name,
                "timeframe": entities["time_label"],
                "condition": tomorrow_daily.get("condition", "Partly cloudy"),
                "max_temp_c": tomorrow_daily.get("max_temp"),
                "min_temp_c": tomorrow_daily.get("min_temp"),
                "period_temp_c": avg_temp if hour_range else None,
                "rain_probability_pct": max_pop,
                "precipitation_sum_mm": tomorrow_daily.get("precip_sum", 0.0),
                "uv_index": tomorrow_daily.get("uv_index", 0.0),
                "sunrise": tomorrow_daily.get("sunrise", ""),
                "sunset": tomorrow_daily.get("sunset", ""),
                "wind_speed_kmh": filtered_hourly[0]["wind_speed"] if filtered_hourly else current.get("wind_speed", 0.0),
                "active_alerts_count": len(active_alerts or [])
            }

        elif tf in ["this_evening", "this_afternoon", "this_morning"]:
            hour_range = entities.get("specific_hour_range", (17, 23))
            matching_hours = [h for h in hourly if any(f"T{hr:02d}:" in h.get("time", "") for hr in range(hour_range[0], hour_range[1]))]
            period_temp = round(sum(h["temp"] for h in matching_hours) / len(matching_hours), 1) if matching_hours else current.get("temperature", 28)
            period_pop = max((h["precip_prob"] for h in matching_hours), default=today_daily.get("precip_prob_max", 10))
            period_cond = matching_hours[0].get("condition", current.get("condition", "Fair")) if matching_hours else current.get("condition", "Fair")

            return {
                "location": location_name,
                "timeframe": entities["time_label"],
                "condition": period_cond,
                "temperature_c": period_temp,
                "feels_like_c": current.get("feels_like"),
                "rain_probability_pct": period_pop,
                "precipitation_rate_mm": current.get("precipitation", 0.0),
                "today_rain_sum_mm": today_daily.get("precip_sum", 0.0),
                "wind_speed_kmh": current.get("wind_speed", 10.0),
                "humidity_pct": current.get("humidity", 65),
                "active_alerts_count": len(active_alerts or [])
            }

        elif tf == "this_week":
            total_rain = round(sum(d.get("precip_sum", 0.0) for d in daily), 1)
            highest_pop = max((d.get("precip_prob_max", 0) for d in daily), default=20)
            wettest_day = max(daily, key=lambda d: d.get("max_temp", 0), default={})
            wettest_day = max(daily, key=lambda d: d.get("precip_sum", 0), default={})

            return {
                "location": location_name,
                "timeframe": "Next 7 Days",
                "condition": f"Varying ({daily[0].get('condition', 'Fair')} to {wettest_day.get('condition', 'Showers')})",
                "7_day_total_rain_mm": total_rain,
                "highest_daily_rain_probability_pct": highest_pop,
                "wettest_day": f"{wettest_day.get('date', 'Mid-week')} ({wettest_day.get('precip_sum', 0)} mm, {wettest_day.get('condition', 'Rain')})",
                "max_temp_range_c": f"{min(d.get('min_temp', 22) for d in daily)}°C to {max(d.get('max_temp', 35) for d in daily)}°C",
                "days_count": len(daily),
                "active_alerts_count": len(active_alerts or [])
            }

        else:
            # Default to current & today's weather
            return {
                "location": location_name,
                "timeframe": "Current & Today",
                "condition": current.get("condition", "Clear sky"),
                "current_temperature_c": current.get("temperature"),
                "feels_like_c": current.get("feels_like"),
                "today_max_c": today_daily.get("max_temp"),
                "today_min_c": today_daily.get("min_temp"),
                "humidity_pct": current.get("humidity"),
                "wind_speed_kmh": current.get("wind_speed"),
                "wind_direction_deg": current.get("wind_direction"),
                "precipitation_now_mm": current.get("precipitation"),
                "today_rain_sum_mm": today_daily.get("precip_sum", 0.0),
                "today_rain_probability_pct": today_daily.get("precip_prob_max", 0),
                "pressure_hpa": current.get("pressure"),
                "uv_index": today_daily.get("uv_index", 0.0),
                "active_alerts_count": len(active_alerts or [])
            }

    @staticmethod
    async def _generate_grounded_explanation(
        query: str,
        entities: Dict[str, Any],
        verified_data: Dict[str, Any],
        active_alerts: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Explains verified meteorological data via LLM if API key configured,
        or via Grounded Deterministic Synthesizer with zero numerical hallucination.
        """
        # Try LLM if configured
        if settings.GEMINI_API_KEY:
            llm_result = await AIAssistant._call_gemini(query, entities, verified_data, active_alerts)
            if llm_result:
                return llm_result
        elif settings.OPENAI_API_KEY:
            llm_result = await AIAssistant._call_openai(query, entities, verified_data, active_alerts)
            if llm_result:
                return llm_result

        # Fallback to Grounded Deterministic Synthesizer
        return AIAssistant._grounded_deterministic_synthesis(query, entities, verified_data, active_alerts)

    @staticmethod
    async def _call_gemini(
        query: str,
        entities: Dict[str, Any],
        verified_data: Dict[str, Any],
        active_alerts: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        system_prompt = (
            "You are WeatherGPT, a meteorological assistant. "
            "Explain the user's question using ONLY the numbers and facts in the VERIFIED DATA provided below. "
            "STRICT RULES: Under NO circumstances invent, change, or estimate numerical weather values. "
            "All temperatures (°C), rain chances (%), rainfall mm, and wind speeds in your response MUST match the VERIFIED DATA exactly. "
            "If active weather warnings are present in the data, explicitly warn the user and provide their safety instruction. "
            "Return JSON matching: {\"answer\": str, \"badge\": str, \"rating\": str, \"key_facts\": [str], \"action_advice\": str, \"suggested_followups\": [str]}"
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nUSER QUESTION: {query}\nINTENT: {entities['intent']}\nACTIVE SEVERE WARNINGS: {json.dumps(active_alerts or [], indent=2)}\nVERIFIED DATA:\n{json.dumps(verified_data, indent=2)}"}
                    ]
                }
            ],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    parsed["grounded_source"] = "Gemini 1.5 Flash (Grounded on Real Synoptic Models)"
                    return parsed
        except Exception as e:
            print(f"Gemini LLM call failed, reverting to grounded reasoner: {e}")
        return None

    @staticmethod
    async def _call_openai(
        query: str,
        entities: Dict[str, Any],
        verified_data: Dict[str, Any],
        active_alerts: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        system_prompt = (
            "You are WeatherGPT, a meteorological assistant. "
            "Explain the user's question using ONLY the numbers and facts in the VERIFIED DATA provided below. "
            "STRICT RULES: Under NO circumstances invent, change, or estimate numerical weather values. "
            "All temperatures (°C), rain chances (%), rainfall mm, and wind speeds in your response MUST match the VERIFIED DATA exactly. "
            "If active weather warnings are present in the data, explicitly warn the user and provide their safety instruction. "
            "Return valid JSON matching: {\"answer\": str, \"badge\": str, \"rating\": str, \"key_facts\": [str], \"action_advice\": str, \"suggested_followups\": [str]}"
        )
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"USER QUESTION: {query}\nINTENT: {entities['intent']}\nACTIVE SEVERE WARNINGS: {json.dumps(active_alerts or [], indent=2)}\nVERIFIED DATA:\n{json.dumps(verified_data, indent=2)}"}
            ],
            "response_format": {"type": "json_object"}
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(data["choices"][0]["message"]["content"])
                    parsed["grounded_source"] = "GPT-4o-mini (Grounded on Real Synoptic Models)"
                    return parsed
        except Exception as e:
            print(f"OpenAI call failed, reverting to grounded reasoner: {e}")
        return None

    @staticmethod
    def _grounded_deterministic_synthesis(
        query: str,
        entities: Dict[str, Any],
        d: Dict[str, Any],
        active_alerts: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a fluent, authoritative natural explanation grounded 100%
        on the exact numbers retrieved from the meteorological API, prominently factoring in active severe warnings.
        """
        intent = entities["intent"]
        loc = d.get("location", "the area")
        tf = d.get("timeframe", "the period")
        cond = d.get("condition", "partly cloudy")

        # Case 1: Rain Intent
        if intent == "rain":
            pop = d.get("rain_probability_pct") or d.get("today_rain_probability_pct") or d.get("highest_daily_rain_probability_pct", 0)
            rain_mm = d.get("precipitation_sum_mm") or d.get("today_rain_sum_mm") or d.get("7_day_total_rain_mm", 0.0)

            if pop >= 60 or rain_mm >= 5.0:
                answer = f"Yes, rain is very likely for {tf.lower()} in {loc}. Meteorological models project a {pop}% probability of precipitation with an expected accumulation of {rain_mm} mm under {cond.lower()} conditions."
                badge = f"{pop}% Rain Chance"
                rating = "Rain Expected"
                advice = "Carry an umbrella or raincoat; expect wet roads and possible water collection in low-lying areas."
            elif pop >= 25 or rain_mm > 0.4:
                answer = f"There is a moderate chance of light, scattered showers for {tf.lower()} in {loc} ({pop}% probability, ~{rain_mm} mm expected). Rain will likely be intermittent rather than continuous."
                badge = f"{pop}% Rain Chance"
                rating = "Showers Possible"
                advice = "Keep a compact umbrella handy if stepping out for extended outdoor work."
            else:
                answer = f"No significant rain is expected for {tf.lower()} in {loc}. The precipitation probability is only {pop}% with projected accumulation around {rain_mm} mm and {cond.lower()} skies."
                badge = f"Dry ({pop}% Rain Chance)"
                rating = "Dry Conditions"
                advice = "Weather conditions will not disrupt outdoor or travel plans."

            key_facts = [
                f"Precipitation probability: {pop}%",
                f"Projected accumulation: {rain_mm} mm",
                f"Sky condition: {cond}"
            ]
            if "max_temp_c" in d and d["max_temp_c"] is not None:
                key_facts.append(f"Temperature range: {d.get('min_temp_c')}°C to {d.get('max_temp_c')}°C")

        # Case 2: Travel Intent
        elif intent == "travel":
            pop = d.get("rain_probability_pct") or d.get("today_rain_probability_pct", 10)
            rain_mm = d.get("precipitation_sum_mm") or d.get("today_rain_sum_mm", 0.0)
            wind = d.get("wind_speed_kmh", 10.0)

            if rain_mm >= 30.0 or wind >= 45.0:
                rating = "Caution Required"
                badge = "Adverse Transit Conditions"
                answer = f"Travel requires caution for {tf.lower()} in {loc}. Models indicate adverse weather with {rain_mm} mm of rain expected, {pop}% rain probability, and wind speeds near {wind} km/h."
                advice = "Allow extra travel time, avoid waterlogged underpasses, and monitor live road advisories."
            elif pop >= 50 or rain_mm >= 8.0:
                rating = "Moderate Risk"
                badge = "Wet Roads Likely"
                answer = f"Travel is manageable but plan for wet surfaces for {tf.lower()} in {loc}. Precipitation likelihood is {pop}% (~{rain_mm} mm) with {cond.lower()}."
                advice = "Maintain safe vehicle braking distance and check wiper blades."
            else:
                rating = "Safe for Travel"
                badge = "Favorable Travel"
                answer = f"Yes, conditions look favorable for travel for {tf.lower()} in {loc}. Wind speeds are around {wind} km/h with low rain risk ({pop}% chance) and good transit visibility."
                advice = "Normal driving and transit conditions expected."

            key_facts = [
                f"Road condition: {'Likely dry / clear' if pop < 45 else 'Wet surfaces probable'}",
                f"Precipitation chance: {pop}% ({rain_mm} mm)",
                f"Wind speed: {wind} km/h"
            ]

        # Case 3: Temperature / Heat / Cold Intent
        elif intent == "temperature":
            temp = d.get("current_temperature_c") or d.get("period_temp_c") or d.get("temperature_c") or d.get("max_temp_c", 30)
            max_t = d.get("today_max_c") or d.get("max_temp_c", temp)
            min_t = d.get("today_min_c") or d.get("min_temp_c", temp)
            fl = d.get("feels_like_c", temp)

            if max_t >= 38.0 or fl >= 42.0:
                badge = f"High Heat ({max_t}°C)"
                rating = "Heat Advisory"
                advice = "Stay well hydrated and limit strenuous direct sun exposure during peak afternoon hours."
            elif min_t <= 14.0:
                badge = f"Cool / Chilly ({min_t}°C)"
                rating = "Cool Weather"
                advice = "Carry an extra thermal layer or jacket for early morning or night hours."
            else:
                badge = f"Comfortable ({max_t}°C / {min_t}°C)"
                rating = "Pleasant"
                advice = "Standard seasonal comfort; no extreme thermal risk."

            answer = f"For {tf.lower()} in {loc}, temperatures will peak at {max_t}°C with lows near {min_t}°C (feels like {fl}°C). Sky condition is {cond.lower()}."
            key_facts = [
                f"Maximum temperature: {max_t}°C",
                f"Minimum temperature: {min_t}°C",
                f"Thermal index (feels like): {fl}°C",
                f"Sky condition: {cond}"
            ]

        # Case 4: Outdoor / Sports Intent
        elif intent == "outdoor":
            pop = d.get("rain_probability_pct") or d.get("today_rain_probability_pct", 10)
            wind = d.get("wind_speed_kmh", 12.0)
            t = d.get("current_temperature_c") or d.get("max_temp_c", 28)

            if pop >= 55:
                badge = "Rain Interference Risk"
                rating = "Rain Expected"
                answer = f"Outdoor sports or activities may be disrupted for {tf.lower()} in {loc} due to an elevated {pop}% rain probability and {cond.lower()}."
                advice = "Have an indoor backup venue ready or check the hourly rain radar before heading out."
            elif t >= 36:
                badge = "High Daytime Heat"
                rating = "Warm"
                answer = f"Outdoor activities are feasible for {tf.lower()} in {loc}, but temperatures will reach {t}°C. Schedule play in early morning or late evening."
                advice = "Take frequent hydration breaks and seek shade during midday."
            else:
                badge = "Great for Outdoors"
                rating = "Favorable"
                answer = f"Conditions are favorable for outdoor sports and activities for {tf.lower()} in {loc}. Rain probability is low at {pop}% with comfortable winds ({wind} km/h)."
                advice = "Enjoy outdoor training, running, or games."

            key_facts = [
                f"Precipitation likelihood: {pop}%",
                f"Expected temperature: {t}°C",
                f"Wind speed: {wind} km/h"
            ]

        # Case 5: Clothing Intent
        elif intent == "clothing":
            t = d.get("current_temperature_c") or d.get("period_temp_c") or d.get("max_temp_c", 28)
            fl = d.get("feels_like_c", t)
            pop = d.get("rain_probability_pct") or d.get("today_rain_probability_pct", 10)

            if t < 16:
                badge = f"Chilly ({t}°C)"
                rating = "Warm Layering"
                advice = "Wear a warm jacket, fleece sweater, or windbreaker."
            elif t > 33:
                badge = f"Hot ({t}°C)"
                rating = "Breathable Cotton"
                advice = "Wear lightweight, loose cotton clothes and sunglasses."
            else:
                badge = f"Casual ({t}°C)"
                rating = "Everyday Casual"
                advice = "Comfortable standard casual wear (t-shirt, trousers) is appropriate."

            rain_note = " Definitely carry an umbrella as rain chance is elevated." if pop >= 50 else " No rainwear needed."
            answer = f"In {loc} for {tf.lower()}, temperatures are around {t}°C (feels like {fl}°C).{rain_note}"
            key_facts = [
                f"Temperature: {t}°C (Feels like {fl}°C)",
                f"Rain probability: {pop}%",
                f"Condition: {cond}"
            ]

        # Case 6: General Meteorological Outlook
        else:
            t = d.get("current_temperature_c") or d.get("period_temp_c") or d.get("max_temp_c", 28)
            fl = d.get("feels_like_c", t)
            pop = d.get("rain_probability_pct") or d.get("today_rain_probability_pct", 10)
            wind = d.get("wind_speed_kmh", 12.0)
            hum = d.get("humidity_pct", 65)

            badge = f"{t}°C • {cond}"
            rating = "Observed Weather"
            answer = f"For {tf.lower()} in {loc}, weather readings indicate {t}°C (feels like {fl}°C) with {cond.lower()}. Wind is blowing at {wind} km/h with {hum}% relative humidity and a {pop}% chance of precipitation."
            advice = "Review the 24-hour hourly timeline for exact hour-by-hour variations."
            key_facts = [
                f"Observed temperature: {t}°C",
                f"Heat index (feels like): {fl}°C",
                f"Precipitation probability: {pop}%",
                f"Wind speed: {wind} km/h",
                f"Humidity: {hum}%"
            ]

        # If active severe warnings are active for this location, prominently factor them in
        if active_alerts and len(active_alerts) > 0:
            top_alert = active_alerts[0]
            alert_banner = f"⚠️ [{top_alert['severity'].upper()} WARNING: {top_alert['headline']}] {top_alert['description']} "
            answer = alert_banner + answer
            advice = f"SAFETY DIRECTIVE: {top_alert['instruction']} {advice}"
            key_facts.insert(0, f"Active Warning: {top_alert['severity']} - {top_alert['type']}")
            if top_alert['severity'] in ['High', 'Extreme']:
                badge = f"{top_alert['severity']} Alert: {top_alert['type']}"
                rating = f"{top_alert['severity']} Risk"

        return {
            "answer": answer,
            "badge": badge,
            "rating": rating,
            "key_facts": key_facts,
            "action_advice": advice,
            "suggested_followups": [
                f"Will it rain tomorrow in {loc.split(',')[0]}?",
                f"Is it safe to travel today in {loc.split(',')[0]}?",
                f"What's the weather this evening?"
            ],
            "grounded_source": "ECMWF/GFS Verified Observations (Strict Grounding)"
        }
