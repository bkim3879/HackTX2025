"Telemetry ingestion helpers spanning persistence and pub/sub."

from __future__ import annotations

import orjson
import structlog
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import AppSettings, get_settings
from app.models.api import TelemetryTick
from app.models.db import TelemetryTickRecord

logger = structlog.get_logger(__name__)


class TelemetryService:
    """Handle telemetry ingestion, persistence, and fan-out."""

    def __init__(self, redis: Redis, settings: AppSettings | None = None) -> None:
        self._redis = redis
        self._settings = settings or get_settings()

    async def ingest_tick(
        self, session: AsyncSession, tick: TelemetryTick
    ) -> TelemetryTickRecord:
        record = TelemetryTickRecord(
            race_id=tick.race_id,
            driver_id=tick.driver_id,
            ts=tick.ts,
            lap=tick.lap,
            stint_age=tick.stint_age,
            compound=tick.compound,
            payload=tick.model_dump(by_alias=True),
        )
        session.add(record)
        await session.commit()
        await session.refresh(record)

        await self._cache_last_state(tick)
        await self._publish_tick(tick)

        logger.info(
            "telemetry.ingested",
            race_id=tick.race_id,
            driver_id=tick.driver_id,
            lap=tick.lap,
        )
        return record

    async def recent_ticks(
        self, session: AsyncSession, race_id: str, driver_id: str, limit: int = 5
    ) -> list[TelemetryTickRecord]:
        statement = (
            select(TelemetryTickRecord)
            .where(
                TelemetryTickRecord.race_id == race_id,
                TelemetryTickRecord.driver_id == driver_id,
            )
            .order_by(TelemetryTickRecord.ts.desc())
            .limit(limit)
        )
        result = await session.execute(statement)
        return list(result.scalars().all())

    async def _cache_last_state(self, tick: TelemetryTick) -> None:
        key = f"telemetry:last:{tick.race_id}:{tick.driver_id}"
        await self._redis.set(
            key, orjson.dumps(tick.model_dump(by_alias=True)).decode(), ex=300
        )

    async def _publish_tick(self, tick: TelemetryTick) -> None:
        payload = {
            "raceId": tick.race_id,
            "driverId": tick.driver_id,
            "lap": tick.lap,
            "ts": tick.ts.isoformat(),
        }
        await self._redis.publish(
            self._settings.telemetry_channel, orjson.dumps(payload).decode()
        )
