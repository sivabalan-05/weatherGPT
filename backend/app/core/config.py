from pydantic import BaseModel
import os

class Settings(BaseModel):
    APP_NAME: str = "WeatherGPT API"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1"
    GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1"
    ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1"
    
    # Optional LLM integration keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto") # auto | gemini | openai | deterministic

settings = Settings()
