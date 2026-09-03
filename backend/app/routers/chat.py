from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..services.ai_assistant import AIAssistant

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    query: str
    latitude: float
    longitude: float
    location_name: str
    forecast_data: Optional[Dict[str, Any]] = None

@router.post("/query")
async def ask_weather_gpt(req: ChatRequest):
    try:
        response = await AIAssistant.process_query(
            query=req.query,
            active_lat=req.latitude,
            active_lon=req.longitude,
            active_location_name=req.location_name,
            forecast_data=req.forecast_data
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WeatherGPT Assistant error: {str(e)}")
