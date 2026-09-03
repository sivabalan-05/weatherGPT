from typing import List, Dict, Any

class AlertEngine:
    @staticmethod
    def evaluate_alerts(forecast_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluates weather alerts using IMD-aligned meteorological criteria
        and returns structured alert items. Evaluates current, hourly (24h), and daily (7d) metrics.
        """
        alerts = []
        current = forecast_data.get("current", {})
        hourly = forecast_data.get("hourly", [])
        daily = forecast_data.get("daily", [])

        # Extract key meteorological thresholds
        current_temp = current.get("temperature", 25.0)
        feels_like = current.get("feels_like", current_temp)
        today_daily = daily[0] if daily else {}
        tomorrow_daily = daily[1] if len(daily) > 1 else today_daily

        today_max = today_daily.get("max_temp", current_temp)
        today_min = today_daily.get("min_temp", current_temp)
        today_rain = today_daily.get("precip_sum", 0.0)
        tomorrow_rain = tomorrow_daily.get("precip_sum", 0.0)
        multi_day_rain = today_rain + tomorrow_rain + (daily[2].get("precip_sum", 0.0) if len(daily) > 2 else 0.0)

        # Maximum wind speed in current or upcoming 24h
        max_hourly_wind = max([h.get("wind_speed", 0.0) for h in hourly[:24]] + [current.get("wind_speed", 0.0)])
        max_hourly_pop = max([h.get("precip_prob", 0) for h in hourly[:24]] + [today_daily.get("precip_prob_max", 0)])

        # Check for thunderstorm codes in current or upcoming 24h
        has_thunderstorm = (
            current.get("weather_code") in [95, 96, 99]
            or any(h.get("code") in [95, 96, 99] for h in hourly[:24])
            or today_daily.get("code") in [95, 96, 99]
            or tomorrow_daily.get("code") in [95, 96, 99]
        )

        # 1. Extreme Temperature (Heatwave & Coldwave)
        if today_max >= 44.0 or feels_like >= 46.0:
            alerts.append({
                "id": "alert-heatwave-extreme",
                "type": "Heatwave",
                "severity": "Extreme",
                "headline": "Severe Heatwave Warning",
                "description": f"Maximum temperatures reaching {today_max}°C with heat index feels like {feels_like}°C. Severe danger of heat hyperthermia.",
                "instruction": "Avoid outdoor activities between 11 AM and 4 PM. Drink oral rehydration solutions and maintain indoor cooling.",
                "issued_time": "Immediate",
                "valid_until": "Today, 6:00 PM"
            })
        elif today_max >= 40.0 or feels_like >= 42.0:
            alerts.append({
                "id": "alert-heatwave-moderate",
                "type": "Heatwave",
                "severity": "Moderate",
                "headline": "Heatwave Advisory",
                "description": f"Daytime temperatures hovering near {today_max}°C with oppressive heat index.",
                "instruction": "Stay well hydrated, wear loose light-colored cotton clothing, and minimize direct midday sun exposure.",
                "issued_time": "Active",
                "valid_until": "Today, 5:30 PM"
            })
        elif today_min <= 6.0:
            alerts.append({
                "id": "alert-coldwave-high",
                "type": "Coldwave",
                "severity": "High",
                "headline": "Severe Coldwave Alert",
                "description": f"Minimum nighttime temperatures dipping down to {today_min}°C.",
                "instruction": "Protect livestock, insulate exposed domestic water pipes, and dress in multiple thermal layers.",
                "issued_time": "Evening",
                "valid_until": "Tomorrow Morning, 8:00 AM"
            })

        # 2. Heavy Rainfall & Flood Risk (IMD Criteria)
        if today_rain >= 115.5 or tomorrow_rain >= 115.5 or multi_day_rain >= 150.0:
            alerts.append({
                "id": "alert-rain-extreme",
                "type": "Heavy rainfall",
                "severity": "Extreme",
                "headline": "Very Heavy to Extremely Heavy Rainfall Alert (Red Warning)",
                "description": f"Torrential downpour with projected accumulations exceeding {max(today_rain, tomorrow_rain)} mm in 24 hours.",
                "instruction": "Severe flash flood and urban waterlogging risk. Avoid transit across riverbanks, subways, and low-lying underpasses.",
                "issued_time": "Immediate",
                "valid_until": "Next 36 Hours"
            })
            alerts.append({
                "id": "alert-flood-high",
                "type": "Flood risk",
                "severity": "High",
                "headline": "Inundation & Urban Runoff Warning",
                "description": "Continuous precipitation will overload municipal drainage and cause rapid street runoff.",
                "instruction": "Secure ground-level electrical appliances and move valuables to higher floors.",
                "issued_time": "Active",
                "valid_until": "Next 48 Hours"
            })
        elif today_rain >= 64.5 or tomorrow_rain >= 64.5:
            alerts.append({
                "id": "alert-rain-high",
                "type": "Heavy rainfall",
                "severity": "High",
                "headline": "Isolated Heavy Rainfall Warning (Orange Alert)",
                "description": f"Significant rainfall expected ({max(today_rain, tomorrow_rain)} mm) producing localized waterlogging and slow traffic.",
                "instruction": "Plan road transit with buffer time. Keep umbrella and rain gear ready.",
                "issued_time": "Active",
                "valid_until": "Next 24 Hours"
            })
        elif today_rain >= 20.0 or tomorrow_rain >= 20.0 or max_hourly_pop >= 75:
            alerts.append({
                "id": "alert-rain-moderate",
                "type": "Heavy rainfall",
                "severity": "Moderate",
                "headline": "Moderate to Heavy Rain Spells (Yellow Watch)",
                "description": f"Frequent rain spells anticipated ({max(today_rain, tomorrow_rain)} mm expected, {max_hourly_pop}% probability).",
                "instruction": "Drive carefully on wet surfaces and prepare for localized traffic congestion.",
                "issued_time": "Today",
                "valid_until": "Tonight"
            })

        # 3. Thunderstorm & Lightning Activity
        if has_thunderstorm:
            alerts.append({
                "id": "alert-thunderstorm",
                "type": "Thunderstorm",
                "severity": "High",
                "headline": "Thunderstorm & Lightning Activity",
                "description": "Atmospheric convective instability generating sudden electrical discharges and gusty squalls.",
                "instruction": "Do not seek shelter under isolated tall trees or tin sheds. Unplug sensitive electrical devices.",
                "issued_time": "Active",
                "valid_until": "Next 12 Hours"
            })
            alerts.append({
                "id": "alert-lightning",
                "type": "Lightning",
                "severity": "Moderate",
                "headline": "Cloud-to-Ground Lightning Hazard",
                "description": "Localized lightning strikes detected in the approaching convective cluster.",
                "instruction": "Remain indoors or inside an enclosed metal-topped vehicle until thunder ceases.",
                "issued_time": "Active",
                "valid_until": "Storm Passage"
            })

        # 4. Wind & Cyclone Hazard Assessment
        if max_hourly_wind >= 70.0:
            alerts.append({
                "id": "alert-cyclone",
                "type": "Cyclone",
                "severity": "Extreme",
                "headline": "Severe Cyclonic Gale Force Wind Warning",
                "description": f"Destructive surface winds reaching {round(max_hourly_wind, 1)} km/h with high damaging potential.",
                "instruction": "Remain strictly inside reinforced structures. Fishermen advised not to venture into sea.",
                "issued_time": "Urgent",
                "valid_until": "Next 24 Hours"
            })
        elif max_hourly_wind >= 45.0:
            alerts.append({
                "id": "alert-strong-winds",
                "type": "Strong winds",
                "severity": "High",
                "headline": "Strong Surface Winds Warning",
                "description": f"Brisk surface winds gusting up to {round(max_hourly_wind, 1)} km/h.",
                "instruction": "Secure loose outdoor sheet metal and avoid parking vehicles beneath fragile tree limbs.",
                "issued_time": "Active",
                "valid_until": "Tonight"
            })
        elif max_hourly_wind >= 32.0:
            alerts.append({
                "id": "alert-wind-moderate",
                "type": "Strong winds",
                "severity": "Moderate",
                "headline": "Gusty Surface Wind Advisory",
                "description": f"Elevated wind speeds around {round(max_hourly_wind, 1)} km/h.",
                "instruction": "Take precautions with lightweight outdoor furniture and two-wheeler commuting.",
                "issued_time": "Today",
                "valid_until": "Evening"
            })

        # Default Low alert if conditions are serene
        if not alerts:
            alerts.append({
                "id": "alert-normal-low",
                "type": "General Alert",
                "severity": "Low",
                "headline": "No Severe Weather Warnings Active",
                "description": "Atmospheric parameters are currently within normal baseline thresholds for this region.",
                "instruction": "Routine outdoor, agricultural, and transit operations may proceed with standard seasonal precautions.",
                "issued_time": "Current",
                "valid_until": "Next 24 Hours"
            })

        return alerts
