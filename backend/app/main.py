from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import weather, chat, alerts, agriculture, climate
from .core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Intelligent Meteorological Intelligence & WeatherGPT API"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(weather.router)
app.include_router(chat.router)
app.include_router(alerts.router)
app.include_router(agriculture.router)
app.include_router(climate.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "endpoints": [
            "/api/weather/search",
            "/api/weather/forecast",
            "/api/chat/query",
            "/api/alerts",
            "/api/agriculture/crops",
            "/api/agriculture/advisory",
            "/api/climate/trends"
        ]
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WeatherGPT"}
