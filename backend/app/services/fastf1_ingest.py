"Utilities for sourcing telemetry from the FastF1 dataset."

from __future__ import annotations

import asyncio
import math
from datetime import datetime, timezone
from typing import Iterable, Sequence

import fastf1
import pandas as pd
import structlog

from app.core.config import AppSettings
from app.models.api import TelemetryTick
from fastf1_cache import ensure_cache

logger = structlog.get_logger(__name__)

_COMPOUND_MAP = {
    "SOFT": "S",
    "SUPER SOFT": "S",
    "SS": "S",
    "MEDIUM": "M",
    "M": "M",
    "HARD": "H",
    "H": "H",
    "INTERMEDIATE": "I",
    "INT": "I",
    "WET": "W",
    "FULL WET": "W",
}


class FastF1IngestService:
    """Fetch and normalize telemetry from FastF1."""

    def __init__(self, settings: AppSettings) -> None:
        self._settings = settings
        ensure_cache(settings.fastf1_cache_dir)

    async def ingest_session(
        self,
        *,
        year: int,
        event_name: str,
        session_code: str,
        driver_id: str,
        race_id_override: str | None,
        telemetry_service,
        decision_engine,
        db_session,
    ) -> int:
        ticks = await self.fetch_ticks(
            year=year,
            event_name=event_name,
            session_code=session_code,
            driver_id=driver_id,
            race_id_override=race_id_override,
        )

        for tick in ticks:
            await telemetry_service.ingest_tick(session=db_session, tick=tick)
            await decision_engine.process_tick(
                session=db_session, tick=tick, persist=True
            )

        logger.info(
            "fastf1.ingested",
            year=year,
            event=event_name,
            session=session_code,
            driver=driver_id,
            count=len(ticks),
        )
        return len(ticks)

    async def fetch_ticks(
        self,
        *,
        year: int,
        event_name: str,
        session_code: str,
        driver_id: str,
        race_id_override: str | None,
    ) -> list[TelemetryTick]:
        session = await asyncio.to_thread(
            fastf1.get_session, year, event_name, session_code
        )
        await asyncio.to_thread(session.load, telemetry=False, weather=True)
        race_id = race_id_override or _default_race_id(year, session.event["EventName"])

        laps = session.laps.pick_driver(driver_id.upper())
        if laps.empty:
            raise ValueError(f"No laps available for driver {driver_id}")

        logger.info(
            "fastf1.session.loaded",
            year=year,
            event=session.event["EventName"],
            session=session_code,
            driver=driver_id,
            laps=len(laps),
        )

        start_time = session.t0_date.to_pydatetime().astimezone(timezone.utc)
        weather = session.weather_data
        ticks: list[TelemetryTick] = []

        for _, lap in laps.iterrows():
            lap_number = int(lap.get("LapNumber", 0))
            ts = _lap_start_timestamp(lap, start_time)
            stint_age = _stint_age(lap)
            compound = _normalize_compound(lap.get("Compound"))
            track_temp = _lap_track_temp(lap, weather)
            gap_front = _timedelta_to_seconds(lap.get("DriverAheadTime"))
            gap_back = _timedelta_to_seconds(lap.get("DriverBehindTime"))
            position = _safe_int(lap.get("Position"))

            tick = TelemetryTick(
                race_id=race_id,
                driver_id=driver_id.upper(),
                ts=ts,
                lap=lap_number,
                stint_age=stint_age,
                compound=compound,
                pace=_timedelta_to_seconds(lap.get("LapTime")),
                tire_wear=_estimate_tire_wear(stint_age),
                fuel=None,
                track_temp=track_temp,
                rain_prob=0.0,
                sc_prob=0.0,
                gap_front=gap_front,
                gap_back=gap_back,
                position=position,
            )
            ticks.append(tick)

        return ticks


def _default_race_id(year: int, event_name: str) -> str:
    safe_name = (
        event_name.lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("'", "")
        .replace(".", "")
    )
    return f"{safe_name}_{year}"


def _lap_start_timestamp(lap: pd.Series, session_start: datetime) -> datetime:
    lap_start = lap.get("LapStartTime")
    if pd.isna(lap_start):
        return session_start
    return (session_start + lap_start.to_pytimedelta()).astimezone(timezone.utc)


def _stint_age(lap: pd.Series) -> int:
    tyre_life = _safe_int(lap.get("TyreLife"))
    if tyre_life is not None and tyre_life > 0:
        return tyre_life
    stint_lap = _safe_int(lap.get("StintLap"))
    if stint_lap is not None and stint_lap > 0:
        return stint_lap
    lap_number = _safe_int(lap.get("LapNumber")) or 1
    return lap_number


def _normalize_compound(compound: str | None) -> str:
    if not compound:
        return "M"
    return _COMPOUND_MAP.get(compound.upper(), "M")


def _timedelta_to_seconds(value) -> float | None:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if hasattr(value, "total_seconds"):
        return float(value.total_seconds())
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_int(value) -> int | None:
    if value is None:
        return None
    try:
        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _estimate_tire_wear(stint_age: int) -> float | None:
    if stint_age <= 0:
        return None
    return round(min(1.0, stint_age / 30.0), 3)


def _lap_track_temp(lap: pd.Series, weather) -> float | None:
    if weather is None or weather.empty:
        return None
    lap_time = lap.get("LapStartTime")
    if pd.isna(lap_time):
        return None
    # Weather "Time" column is relative to session start.
    deltas = (weather["Time"] - lap_time).abs()
    idx = deltas.idxmin()
    value = weather.iloc[idx].get("TrackTemp")
    if pd.isna(value):
        return None
    return float(value)
