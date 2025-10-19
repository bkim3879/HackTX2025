"Async database utilities built on top of SQLModel."

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from .config import get_settings

_settings = get_settings()


engine: AsyncEngine = create_async_engine(
    _settings.database_url,
    echo=_settings.app_env == "dev",
    future=True,
    pool_pre_ping=True,
)
session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine, expire_on_commit=False
)


async def init_db() -> None:
    """Create database schema."""
    from app.models import db as db_models  # Late import keeps metadata in sync

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Yield an async session for request scope."""
    async with session_factory() as session:
        yield session
