"WebSocket channels for live recommendations."

from __future__ import annotations

import asyncio

import orjson
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.core.config import get_settings
from app.services.recommendation_cache import RecommendationCache

router = APIRouter()


@router.websocket("/ws/recommendations")
async def recommendations_socket(websocket: WebSocket) -> None:
    params = websocket.query_params
    race_id = params.get("raceId")
    driver_id = params.get("driverId")
    if not race_id or not driver_id:
        await websocket.close(code=1008)
        return

    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    cache = RecommendationCache(redis)
    await websocket.accept()

    try:
        current = await cache.get_current(race_id, driver_id)
        if current:
            await websocket.send_json(
                {
                    "raceId": race_id,
                    "driverId": driver_id,
                    "recommendation": current.model_dump(by_alias=True),
                }
            )

        pubsub = redis.pubsub()
        await pubsub.subscribe(settings.recommendation_channel)

        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )
            if message and message.get("type") == "message":
                payload = orjson.loads(message["data"])
                if (
                    payload.get("raceId") == race_id
                    and payload.get("driverId") == driver_id
                ):
                    await websocket.send_json(payload)
            await asyncio.sleep(1.0 / settings.ws_recommendation_freq_hz)
    except WebSocketDisconnect:
        return
    finally:
        await redis.close()
        if "pubsub" in locals():
            await pubsub.close()
