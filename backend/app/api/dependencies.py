"FastAPI dependency wiring for core services."

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import AppSettings, get_settings
from app.core.database import get_session
from app.core.redis import get_redis
from app.services.decision_engine import DecisionEngineService
from app.services.monte_carlo import MonteCarloEvaluator
from app.services.rate_limit import RateLimiter
from app.services.recommendation_cache import RecommendationCache
from app.services.telemetry import TelemetryService


async def settings_dependency() -> AppSettings:
    return get_settings()


async def redis_dependency() -> AsyncIterator[Redis]:
    async for client in get_redis():
        yield client


async def db_session_dependency() -> AsyncIterator[AsyncSession]:
    async for session in get_session():
        yield session


async def telemetry_service_dependency(
    redis: Redis = Depends(redis_dependency),
    settings: AppSettings = Depends(settings_dependency),
) -> AsyncIterator[TelemetryService]:
    yield TelemetryService(redis=redis, settings=settings)


async def rate_limiter_dependency(
    redis: Redis = Depends(redis_dependency),
) -> AsyncIterator[RateLimiter]:
    yield RateLimiter(redis)


async def recommendation_cache_dependency(
    redis: Redis = Depends(redis_dependency),
) -> AsyncIterator[RecommendationCache]:
    yield RecommendationCache(redis)


async def decision_engine_dependency(
    redis: Redis = Depends(redis_dependency),
    settings: AppSettings = Depends(settings_dependency),
) -> AsyncIterator[DecisionEngineService]:
    cache = RecommendationCache(redis)
    evaluator = MonteCarloEvaluator(settings)
    yield DecisionEngineService(
        evaluator=evaluator,
        cache=cache,
        settings=settings,
    )


async def monte_carlo_dependency(
    settings: AppSettings = Depends(settings_dependency),
) -> MonteCarloEvaluator:
    return MonteCarloEvaluator(settings)
