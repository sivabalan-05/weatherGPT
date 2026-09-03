from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any
from ..services.climate_service import ClimateService

router = APIRouter(prefix="/api/climate", tags=["climate"])

@router.get("/trends")
async def get_climate_trends(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Region", description="Location Name")
):
    try:
        trends = ClimateService.get_climate_trends(lat, lon, name)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
