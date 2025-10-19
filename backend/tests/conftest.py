"Shared pytest fixtures for API tests."

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fakeredis.aioredis import FakeRedis
from httpx import AsyncClient

from app.api.dependencies import redis_dependency
from app.core.config import get_settings
from app.main import create_app


@pytest_asyncio.fixture
async def app_fixture(tmp_path, monkeypatch) -> AsyncGenerator:
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("API_KEY", "test-key")
    monkeypatch.setenv("MODEL_VERSION", "test-model")
    monkeypatch.setenv("RTSC_TEST_SEED", "1234")

    get_settings.cache_clear()
    app = create_app()

    fake_redis = FakeRedis(decode_responses=True)

    async def _redis_override() -> AsyncIterator[FakeRedis]:
        yield fake_redis

    app.dependency_overrides[redis_dependency] = _redis_override

    yield app

    await fake_redis.aclose()


@pytest_asyncio.fixture
async def async_client(app_fixture) -> AsyncIterator[AsyncClient]:
    async with app_fixture.router.lifespan_context(app_fixture):
        async with AsyncClient(app=app_fixture, base_url="http://testserver") as client:
            client.app = app_fixture  # type: ignore[attr-defined]
            yield client
