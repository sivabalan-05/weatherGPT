from fastapi import APIRouter, Query, HTTPException, status
from typing import Dict, Any, List
from ..services.weather_service import WeatherService

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("/search")
async def search_cities(q: str = Query(..., min_length=1, description="City name to search")):
    try:
        results = await WeatherService.search_city(q)
        return {"query": q, "results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"City geocoding failed: {str(e)}"
        )

@router.get("/forecast")
async def get_forecast(
    lat: float = Query(..., description="Latitude between -90.0 and 90.0"),
    lon: float = Query(..., description="Longitude between -180.0 and 180.0"),
    name: str = Query("Current Location", description="City/Location Name")
):
    try:
        data = await WeatherService.get_forecast(lat, lon, name)
        return data
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except RuntimeError as run_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(run_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error retrieving forecast: {str(e)}"
        )
