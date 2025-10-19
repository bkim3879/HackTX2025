"Simple Redis-backed fixed window rate limiter."

from __future__ import annotations

import time

from fastapi import HTTPException, status
from redis.asyncio import Redis


class RateLimitExceeded(HTTPException):
    def __init__(self, detail: str = "Rate limit exceeded") -> None:
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


class RateLimiter:
    """Fixed window limiter using Redis counters."""

    def __init__(self, redis: Redis, prefix: str = "ratelimit") -> None:
        self._redis = redis
        self._prefix = prefix

    async def check(self, key: str, limit_per_minute: int) -> None:
        window = int(time.time() // 60)
        redis_key = f"{self._prefix}:{key}:{window}"
        count = await self._redis.incr(redis_key)
        if count == 1:
            await self._redis.expire(redis_key, 70)
        if count > limit_per_minute:
            raise RateLimitExceeded()
