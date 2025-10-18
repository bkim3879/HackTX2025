"Health and metadata endpoints."

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text

from app.api.dependencies import (
    db_session_dependency,
    redis_dependency,
    settings_dependency,
)
from app.core.config import AppSettings
from app.models.api import HealthResponse, MetaResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health_check(
    session: AsyncSession = Depends(db_session_dependency),
    redis: Redis = Depends(redis_dependency),
) -> HealthResponse:
    redis_status = "ok"
    db_status = "ok"
    try:
        await redis.ping()
    except Exception as exc:  # pragma: no cover - network failures
        redis_status = f"error:{exc.__class__.__name__}"

    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - db failures
        db_status = f"error:{exc.__class__.__name__}"

    status = "ok" if redis_status == "ok" and db_status == "ok" else "degraded"
    return HealthResponse(status=status, redis=redis_status, database=db_status)


@router.get("/meta", response_model=MetaResponse)
async def meta(
    settings: AppSettings = Depends(settings_dependency),
) -> MetaResponse:
    return MetaResponse(
        app=settings.app_name,
        version=settings.model_version,
        riskLambda=settings.risk_lambda,
        wsRecommendationFreqHz=settings.ws_recommendation_freq_hz,
    )
