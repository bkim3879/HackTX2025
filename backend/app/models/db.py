"SQLModel ORM tables backing telemetry history and decision logs."

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class TelemetryTickRecord(SQLModel, table=True):
    __tablename__ = "telemetry_ticks"

    id: int | None = Field(default=None, primary_key=True)
    race_id: str = Field(index=True)
    driver_id: str = Field(index=True)
    ts: datetime = Field(
        index=True,
        default_factory=lambda: datetime.now(timezone.utc),
    )
    lap: int
    stint_age: int
    compound: str
    payload: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))


class DecisionLogRecord(SQLModel, table=True):
    __tablename__ = "decision_log"

    id: int | None = Field(default=None, primary_key=True)
    race_id: str = Field(index=True)
    driver_id: str = Field(index=True)
    lap: int
    ts: datetime = Field(index=True)
    state_hash: str = Field(index=True)
    recommendation: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))
    alts: list[dict[str, Any]] | None = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )
    explain: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )
    ack_by: str | None = Field(default=None)
    ack_ts: datetime | None = Field(default=None)
