"Telemetry ingestion endpoints."

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    db_session_dependency,
    decision_engine_dependency,
    rate_limiter_dependency,
    telemetry_service_dependency,
    settings_dependency,
)
from app.core.config import AppSettings
from app.core.security import require_api_key
from app.models.api import TelemetryTick
from app.services.decision_engine import DecisionEngineService
from app.services.rate_limit import RateLimiter
from app.services.telemetry import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("/tick", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(require_api_key)])
async def ingest_telemetry_tick(
    tick: TelemetryTick,
    session: AsyncSession = Depends(db_session_dependency),
    telemetry_service: TelemetryService = Depends(telemetry_service_dependency),
    decision_engine: DecisionEngineService = Depends(decision_engine_dependency),
    rate_limiter: RateLimiter = Depends(rate_limiter_dependency),
    settings: AppSettings = Depends(settings_dependency),
) -> dict[str, str]:
    await rate_limiter.check(
        key=f"{tick.race_id}:{tick.driver_id}",
        limit_per_minute=settings.telemetry_rate_limit_per_min,
    )
    await telemetry_service.ingest_tick(session=session, tick=tick)
    await decision_engine.process_tick(session=session, tick=tick)
    return {"status": "accepted"}
