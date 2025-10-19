"Telemetry ingestion endpoints."

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    db_session_dependency,
    decision_engine_dependency,
    fastf1_service_dependency,
    rate_limiter_dependency,
    telemetry_service_dependency,
    settings_dependency,
)
from app.core.config import AppSettings
from app.core.security import require_api_key
from app.models.api import FastF1ImportRequest, TelemetryTick
from app.services.decision_engine import DecisionEngineService
from app.services.fastf1_ingest import FastF1IngestService
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


@router.post(
    "/import/fastf1",
    dependencies=[Depends(require_api_key)],
)
async def import_fastf1_session(
    request: FastF1ImportRequest,
    session: AsyncSession = Depends(db_session_dependency),
    telemetry_service: TelemetryService = Depends(telemetry_service_dependency),
    decision_engine: DecisionEngineService = Depends(decision_engine_dependency),
    fastf1_service: FastF1IngestService = Depends(fastf1_service_dependency),
) -> dict[str, int]:
    count = await fastf1_service.ingest_session(
        year=request.year,
        event_name=request.event_name,
        session_code=request.session_code,
        driver_id=request.driver_id,
        race_id_override=request.race_id,
        telemetry_service=telemetry_service,
        decision_engine=decision_engine,
        db_session=session,
    )
    return {"imported": count}

@router.get(
    "/latest",
    response_model=TelemetryTick,
)
async def latest_telemetry_tick(
    race_id: str = Query(..., alias="raceId"),
    driver_id: str = Query(..., alias="driverId"),
    session: AsyncSession = Depends(db_session_dependency),
    telemetry_service: TelemetryService = Depends(telemetry_service_dependency),
) -> TelemetryTick:
    records = await telemetry_service.recent_ticks(
        session=session,
        race_id=race_id,
        driver_id=driver_id,
        limit=1,
    )
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry available",
        )
    return TelemetryTick.model_validate(records[0].payload)
