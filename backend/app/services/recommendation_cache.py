"Redis-backed helpers for storing and broadcasting recommendations."

from __future__ import annotations

import orjson
from redis.asyncio import Redis

from app.models.api import Recommendation


class RecommendationCache:
    """Thin wrapper around Redis for recommendation storage."""

    def __init__(
        self,
        redis: Redis,
        prefix: str = "recommendation",
        ttl_seconds: int = 30,
    ) -> None:
        self._redis = redis
        self._prefix = prefix
        self._ttl = ttl_seconds

    def _key(self, race_id: str, driver_id: str) -> str:
        return f"{self._prefix}:{race_id}:{driver_id}"

    async def set_current(
        self, race_id: str, driver_id: str, recommendation: Recommendation
    ) -> None:
        data = orjson.dumps(
            recommendation.model_dump(mode="json", by_alias=True)
        ).decode()
        await self._redis.set(self._key(race_id, driver_id), data, ex=self._ttl)

    async def get_current(self, race_id: str, driver_id: str) -> Recommendation | None:
        data = await self._redis.get(self._key(race_id, driver_id))
        if not data:
            return None
        return Recommendation.model_validate_json(data)

    async def publish_update(
        self, channel: str, race_id: str, driver_id: str, recommendation: Recommendation
    ) -> None:
        payload = {
            "raceId": race_id,
            "driverId": driver_id,
            "recommendation": recommendation.model_dump(by_alias=True),
        }
        await self._redis.publish(channel, orjson.dumps(payload).decode())
