from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query, status

from ..services.analog_engine import AnalogEngine

router = APIRouter(prefix="/api/analog", tags=["analog"])


@router.get("")
async def get_weather_analogs(
    lat: float = Query(..., description="Latitude between -90.0 and 90.0"),
    lon: float = Query(..., description="Longitude between -180.0 and 180.0"),
    name: str = Query("This location", description="City/Location Name")
):
    """Historical days resembling today, and what followed each of them."""
    try:
        return await AnalogEngine.find_analogs(lat, lon, name)
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
            detail=f"Unexpected error retrieving historical analogs: {str(e)}"
        )
