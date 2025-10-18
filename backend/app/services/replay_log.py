"Replay log query helpers."

from __future__ import annotations

from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.db import DecisionLogRecord


class ReplayLogService:
    """Expose paginated access to the decision log."""

    async def fetch(
        self,
        session: AsyncSession,
        race_id: str | None = None,
        driver_id: str | None = None,
        from_lap: int | None = None,
        to_lap: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[DecisionLogRecord]:
        conditions = []
        if race_id:
            conditions.append(DecisionLogRecord.race_id == race_id)
        if driver_id:
            conditions.append(DecisionLogRecord.driver_id == driver_id)
        if from_lap is not None:
            conditions.append(DecisionLogRecord.lap >= from_lap)
        if to_lap is not None:
            conditions.append(DecisionLogRecord.lap <= to_lap)

        statement = select(DecisionLogRecord).order_by(DecisionLogRecord.ts).offset(offset).limit(limit)
        if conditions:
            statement = statement.where(and_(*conditions))

        result = await session.execute(statement)
        return list(result.scalars().all())
