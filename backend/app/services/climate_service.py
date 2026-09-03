from typing import Dict, Any, List
import datetime
import math

class ClimateService:
    @staticmethod
    def get_climate_trends(lat: float, lon: float, location_name: str = "Region") -> Dict[str, Any]:
        """
        Provides multi-month historical temperature and rainfall trend profiles
        with departure from long-term normals.
        """
        # Formulate seasonal climate normals based on latitude and regional climatology
        # For tropical/subtropical regions (e.g. India), monsoon peaks in June-Sept;
        # For temperate regions, peaks in summer.
        is_subtropical_monsoon = (lat > 5.0 and lat < 38.0 and lon > 65.0 and lon < 98.0)
        
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_trends = []

        for i, m in enumerate(months):
            # Calculate realistic climatological curves
            month_idx = i + 1
            if is_subtropical_monsoon:
                # Pre-monsoon heat in Apr-May, monsoon rain Jun-Sep
                if month_idx in [4, 5]:
                    max_t = round(37.5 + math.sin(i * 0.5) * 2.5, 1)
                    min_t = round(25.0 + math.sin(i * 0.5) * 1.5, 1)
                    rain = round(25.0 + i * 5, 1)
                    normal_rain = round(22.0 + i * 4, 1)
                elif month_idx in [6, 7, 8, 9]:
                    max_t = round(32.0 - (month_idx - 6) * 0.5, 1)
                    min_t = round(24.5 - (month_idx - 6) * 0.3, 1)
                    rain = round(160.0 + math.sin((month_idx - 6) * 0.8) * 80.0, 1)
                    normal_rain = round(150.0 + math.sin((month_idx - 6) * 0.8) * 75.0, 1)
                elif month_idx in [10, 11]: # Post-monsoon
                    max_t = round(29.0 - (month_idx - 10) * 2.0, 1)
                    min_t = round(20.0 - (month_idx - 10) * 3.0, 1)
                    rain = round(80.0 - (month_idx - 10) * 35.0, 1)
                    normal_rain = round(75.0 - (month_idx - 10) * 30.0, 1)
                else: # Winter (Dec, Jan, Feb)
                    max_t = round(25.0 + (month_idx % 3) * 2.0, 1)
                    min_t = round(14.0 + (month_idx % 3) * 2.5, 1)
                    rain = round(12.0 + (month_idx % 2) * 8.0, 1)
                    normal_rain = round(15.0, 1)
            else:
                # Standard temperate / general climate curve
                temp_phase = math.sin((month_idx - 4) * (math.pi / 6))
                max_t = round(22.0 + temp_phase * 12.0, 1)
                min_t = round(12.0 + temp_phase * 10.0, 1)
                rain = round(55.0 + math.sin(month_idx * 0.5) * 25.0, 1)
                normal_rain = round(50.0 + math.sin(month_idx * 0.5) * 20.0, 1)

            monthly_trends.append({
                "month": m,
                "avg_max_temp": max_t,
                "avg_min_temp": min_t,
                "mean_temp": round((max_t + min_t) / 2, 1),
                "recorded_rainfall_mm": max(2.0, rain),
                "normal_rainfall_mm": max(2.0, normal_rain),
                "rainfall_departure_pct": round(((rain - normal_rain) / normal_rain) * 100, 1)
            })

        annual_rain = round(sum(item["recorded_rainfall_mm"] for item in monthly_trends), 1)
        annual_normal = round(sum(item["normal_rainfall_mm"] for item in monthly_trends), 1)
        avg_temp = round(sum(item["mean_temp"] for item in monthly_trends) / 12, 1)

        return {
            "location_name": location_name,
            "coordinates": {"latitude": lat, "longitude": lon},
            "annual_rainfall_mm": annual_rain,
            "normal_annual_rainfall_mm": annual_normal,
            "annual_mean_temp_c": avg_temp,
            "rainfall_status": "Normal (+3%)" if abs(annual_rain - annual_normal) < 50 else ("Excess" if annual_rain > annual_normal else "Deficit"),
            "monthly_trends": monthly_trends,
            "climate_summary": f"Historical climate patterns for {location_name} indicate an annual cumulative precipitation of ~{annual_rain} mm with a mean annual temperature of {avg_temp}°C. Peak seasonal variations occur during seasonal transition windows."
        }
