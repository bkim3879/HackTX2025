"Recommendation retrieval endpoints."

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.dependencies import (
    db_session_dependency,
    decision_engine_dependency,
    recommendation_cache_dependency,
)
from app.models.api import (
    ActionScore,
    Recommendation,
    RecommendationModelMetadata,
    TelemetryTick,
)
from app.models.db import DecisionLogRecord, TelemetryTickRecord
from app.services.decision_engine import DecisionEngineService
from app.services.recommendation_cache import RecommendationCache

router = APIRouter(prefix="/recommendation", tags=["recommendations"])


@router.get("/current", response_model=Recommendation)
async def get_current_recommendation(
    race_id: str = Query(..., alias="raceId"),
    driver_id: str = Query(..., alias="driverId"),
    cache: RecommendationCache = Depends(recommendation_cache_dependency),
    session: AsyncSession = Depends(db_session_dependency),
    decision_engine: DecisionEngineService = Depends(decision_engine_dependency),
) -> Recommendation:
    cached = await cache.get_current(race_id, driver_id)
    if cached:
        return cached

    recent_tick = await _latest_tick(session, race_id, driver_id)
    if not recent_tick:
        stored = await _latest_decision(session, race_id, driver_id)
        if stored:
            return stored
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No data")

    telemetry = TelemetryTick.model_validate(recent_tick.payload)
    recommendation = await decision_engine.process_tick(
        session=session,
        tick=telemetry,
        persist=False,
        rollouts=64,
    )
    return recommendation


async def _latest_tick(
    session: AsyncSession, race_id: str, driver_id: str
) -> TelemetryTickRecord | None:
    statement = (
        select(TelemetryTickRecord)
        .where(
            TelemetryTickRecord.race_id == race_id,
            TelemetryTickRecord.driver_id == driver_id,
        )
        .order_by(TelemetryTickRecord.ts.desc())
        .limit(1)
    )
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def _latest_decision(
    session: AsyncSession, race_id: str, driver_id: str
) -> Recommendation | None:
    statement = (
        select(DecisionLogRecord)
        .where(
            DecisionLogRecord.race_id == race_id,
            DecisionLogRecord.driver_id == driver_id,
        )
        .order_by(DecisionLogRecord.ts.desc())
        .limit(1)
    )
    result = await session.execute(statement)
    record = result.scalar_one_or_none()
    if not record:
        return None
    return Recommendation(
        best=ActionScore(**record.recommendation),
        alts=[ActionScore(**alt) for alt in record.alts or []],
        model=RecommendationModelMetadata(
            version=record.explain.get("modelVersion", "unknown") if record.explain else "unknown",
            latencyMs=record.explain.get("latencyMs", 200) if record.explain else 200,
        ),
    )
