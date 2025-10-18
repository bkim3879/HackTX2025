"Aggregate API routers for versioned API."

from fastapi import APIRouter

from .recommendations import router as recommendations_router
from .replay import router as replay_router
from .strategy import router as strategy_router
from .system import router as system_router
from .telemetry import router as telemetry_router
from .ws import router as ws_router

api_router = APIRouter()
api_router.include_router(system_router)
api_router.include_router(telemetry_router)
api_router.include_router(recommendations_router)
api_router.include_router(strategy_router)
api_router.include_router(replay_router)
api_router.include_router(ws_router)
