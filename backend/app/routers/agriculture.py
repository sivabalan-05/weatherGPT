from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from ..services.agri_engine import AgriEngine
from ..services.weather_service import WeatherService

router = APIRouter(prefix="/api/agriculture", tags=["agriculture"])

@router.get("/crops")
async def get_crops():
    return {"crops": AgriEngine.get_supported_crops()}

@router.get("/advisory")
async def get_crop_advisory(
    crop: str = Query("rice", description="Crop identifier (e.g. rice, wheat, cotton)"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Current Location")
):
    try:
        forecast = await WeatherService.get_forecast(lat, lon, name)
        advisory = AgriEngine.generate_advisory(crop, forecast)
        return {
            "location": name,
            "coordinates": {"lat": lat, "lon": lon},
            "advisory": advisory
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
