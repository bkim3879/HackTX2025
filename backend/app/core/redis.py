"Async Redis connection helpers."

from __future__ import annotations

from collections.abc import AsyncIterator

from redis.asyncio import Redis

from .config import get_settings

_settings = get_settings()


async def get_redis() -> AsyncIterator[Redis]:
    """Yield a Redis client bound to the configured URL."""
    client = Redis.from_url(_settings.redis_url, decode_responses=True)
    try:
        yield client
    finally:
        await client.close()
