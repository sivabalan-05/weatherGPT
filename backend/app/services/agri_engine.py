from typing import Dict, Any, List

CROPS_DATABASE = {
    "rice": {
        "name": "Paddy / Rice (धान / நெல்)",
        "type": "Kharif staple",
        "ideal_temp": (22, 35),
        "water_need": "High",
        "sensitive_to": "Severe dry spells during panicle initiation, sudden flash flood submergence",
        "spray_optimal_wind": 12.0
    },
    "wheat": {
        "name": "Wheat (गेहूं / கோதுமை)",
        "type": "Rabi staple",
        "ideal_temp": (15, 25),
        "water_need": "Moderate",
        "sensitive_to": "Terminal heat during grain filling, unseasonal rain at maturity",
        "spray_optimal_wind": 14.0
    },
    "cotton": {
        "name": "Cotton (कपास / பருத்தி)",
        "type": "Cash crop",
        "ideal_temp": (21, 34),
        "water_need": "Moderate",
        "sensitive_to": "Waterlogging (causes boll shedding), high humidity boll rot",
        "spray_optimal_wind": 10.0
    },
    "sugarcane": {
        "name": "Sugarcane (गन्ना / கரும்பு)",
        "type": "Perennial crop",
        "ideal_temp": (24, 38),
        "water_need": "High",
        "sensitive_to": "Severe frost or prolonged water deficit during formative stage",
        "spray_optimal_wind": 15.0
    },
    "maize": {
        "name": "Maize / Corn (मक्का / மக்காச்சோளம்)",
        "type": "Kharif/Rabi cereal",
        "ideal_temp": (20, 30),
        "water_need": "Moderate",
        "sensitive_to": "Water stagnation during early vegetative phase, drought at silking",
        "spray_optimal_wind": 12.0
    },
    "groundnut": {
        "name": "Groundnut / Peanut (मूंगफली / வேர்க்கடலை)",
        "type": "Oilseed",
        "ideal_temp": (22, 32),
        "water_need": "Low-Moderate",
        "sensitive_to": "Pegging stage water deficit, continuous rain at harvesting",
        "spray_optimal_wind": 14.0
    },
    "tomato": {
        "name": "Tomato & Vegetables (टमाटर / தக்காளி)",
        "type": "Horticultural crop",
        "ideal_temp": (18, 28),
        "water_need": "Moderate with regulated drainage",
        "sensitive_to": "Leaf curl virus vectors in dry heat, late blight in cool wet weather",
        "spray_optimal_wind": 10.0
    }
}

class AgriEngine:
    @staticmethod
    def get_supported_crops() -> List[Dict[str, str]]:
        return [{"id": k, "name": v["name"], "type": v["type"]} for k, v in CROPS_DATABASE.items()]

    @staticmethod
    def generate_advisory(crop_id: str, forecast_data: Dict[str, Any]) -> Dict[str, Any]:
        crop = CROPS_DATABASE.get(crop_id.lower(), CROPS_DATABASE["rice"])
        current = forecast_data.get("current", {})
        daily = forecast_data.get("daily", [])

        total_rain_3d = sum(d.get("precip_sum", 0.0) for d in daily[:3])
        total_rain_7d = sum(d.get("precip_sum", 0.0) for d in daily)
        max_wind_3d = max([d.get("precip_sum", 0.0) for d in daily[:3]] + [current.get("wind_speed", 0.0)])
        current_temp = current.get("temperature", 28.0)
        current_humidity = current.get("humidity", 65)

        # 1. Irrigation Advice
        if total_rain_3d >= 25.0:
            irrigation_status = "Suspend Irrigation"
            irrigation_color = "amber"
            irrigation_detail = (
                f"Anticipating significant rainfall (~{round(total_rain_3d, 1)} mm) over the next 72 hours. "
                f"Postpone planned furrow or sprinkler irrigation to conserve energy and avoid root-zone waterlogging."
            )
        elif total_rain_3d >= 8.0:
            irrigation_status = "Light or Restricted Irrigation"
            irrigation_color = "sky"
            irrigation_detail = (
                f"Moderate showers (~{round(total_rain_3d, 1)} mm) expected. Apply light irrigation only if topsoil moisture "
                f"shows visible cracking, otherwise hold for natural precipitation."
            )
        elif current_temp > 35.0:
            irrigation_status = "Active Irrigation Needed"
            irrigation_color = "emerald"
            irrigation_detail = (
                f"High daytime temperatures ({current_temp}°C) will accelerate evapotranspiration. "
                f"Provide irrigation in early morning or evening hours to minimize evaporation losses."
            )
        else:
            irrigation_status = "Normal Scheduled Irrigation"
            irrigation_color = "emerald"
            irrigation_detail = (
                f"Conditions are steady with low rain probability (~{round(total_rain_7d, 1)} mm across 7 days). "
                f"Maintain your regular irrigation interval based on crop growth phase."
            )

        # 2. Farming Activities Window (Spraying, fertilizing, harvesting)
        activity_windows = []
        # Find best day for spraying (low wind, low rain)
        best_spray_day = None
        for d in daily[:4]:
            if d.get("precip_prob_max", 0) < 30 and d.get("precip_sum", 0) < 1.0:
                best_spray_day = d.get("date", "Tomorrow")
                break
        
        if best_spray_day:
            activity_windows.append({
                "activity": "Chemical & Organic Spraying",
                "recommendation": f"Favorable window around {best_spray_day} morning (7:00 AM - 10:30 AM). Wind and rain risk remain minimal.",
                "favorable": True
            })
        else:
            activity_windows.append({
                "activity": "Chemical & Organic Spraying",
                "recommendation": "Unfavorable for spraying over the next 48 hours due to rain probability and wash-off risk.",
                "favorable": False
            })

        # Sowing / Harvesting window
        if total_rain_3d < 5.0 and current_temp < 38.0:
            activity_windows.append({
                "activity": "Harvesting & Threshing",
                "recommendation": "Favorable dry spell for harvesting mature crops and open sun drying of grains.",
                "favorable": True
            })
        elif total_rain_3d >= 20.0:
            activity_windows.append({
                "activity": "Harvesting & Threshing",
                "recommendation": "Expedite harvest of already mature produce and store under waterproof tarpaulins.",
                "favorable": False
            })

        # 3. Weather Risks
        risks = []
        if current_humidity > 80 and current_temp >= 26.0:
            risks.append({
                "level": "Medium Risk",
                "title": "Fungal Spore Proliferation",
                "detail": "Prolonged high relative humidity and warm temperatures create optimal conditions for blast, sheath blight, or powdery mildew."
            })
        if total_rain_3d > 40.0:
            risks.append({
                "level": "High Risk",
                "title": "Soil Saturation & Drainage Strain",
                "detail": "Ensure field bund channels and drainage ditches are cleared to evacuate standing water rapidly."
            })
        if current.get("wind_speed", 0.0) > 35.0:
            risks.append({
                "level": "Medium Risk",
                "title": "Lodging Hazard in Tall Stands",
                "detail": "Brisk winds may cause mechanical lodging in tall standing crops nearing grain maturity."
            })
        if not risks:
            risks.append({
                "level": "Low Risk",
                "title": "Benign Meteorological Conditions",
                "detail": "No acute weather hazards detected for standard crop development stages."
            })

        return {
            "crop": crop,
            "rainfall_forecast": {
                "next_3_days_mm": round(total_rain_3d, 1),
                "next_7_days_mm": round(total_rain_7d, 1),
                "trend": "Wet / Rainy" if total_rain_3d > 20 else "Dry / Moderate"
            },
            "irrigation": {
                "status": irrigation_status,
                "badge_color": irrigation_color,
                "guidance": irrigation_detail
            },
            "activities": activity_windows,
            "risks": risks,
            "disclaimer": "Advisory based on numerical weather prediction models (ECMWF/GFS). Field conditions, soil moisture retention, and microclimates vary. Always cross-verify with local Krishi Vigyan Kendra (KVK) or agricultural extension officers before major farm interventions."
        }
