"Replay log endpoints."

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import db_session_dependency
from app.models.api import ActionScore, DecisionAck, DecisionLogEntry
from app.services.replay_log import ReplayLogService

router = APIRouter(prefix="/replay", tags=["replay"])
_replay_service = ReplayLogService()


@router.get("/log")
async def get_replay_log(
    race_id: str | None = Query(default=None, alias="raceId"),
    driver_id: str | None = Query(default=None, alias="driverId"),
    from_lap: int | None = Query(default=None, alias="fromLap"),
    to_lap: int | None = Query(default=None, alias="toLap"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    session: AsyncSession = Depends(db_session_dependency),
) -> dict[str, object]:
    records = await _replay_service.fetch(
        session=session,
        race_id=race_id,
        driver_id=driver_id,
        from_lap=from_lap,
        to_lap=to_lap,
        limit=limit,
        offset=offset,
    )
    items: list[dict[str, object]] = []
    for record in records:
        entry = DecisionLogEntry(
            ts=record.ts,
            raceId=record.race_id,
            driverId=record.driver_id,
            lap=record.lap,
            stateHash=record.state_hash,
            recommendation=ActionScore(**record.recommendation),
            alts=[ActionScore(**alt) for alt in record.alts or []],
            ack=(
                DecisionAck(by=record.ack_by, ts=record.ack_ts)
                if record.ack_by and record.ack_ts
                else None
            ),
            explain=record.explain or {},
        )
        items.append(entry.model_dump(by_alias=True))
    return {"items": items, "count": len(items)}
