from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from ..services.alert_engine import AlertEngine
from ..services.weather_service import WeatherService

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("")
@router.get("/")
async def get_alerts(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Current Location")
):
    try:
        forecast = await WeatherService.get_forecast(lat, lon, name)
        alerts = AlertEngine.evaluate_alerts(forecast)
        return {
            "location": name,
            "coordinates": {"lat": lat, "lon": lon},
            "alerts": alerts,
            "count": len(alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
