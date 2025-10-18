"End-to-end API tests covering core flows."

from __future__ import annotations

from datetime import datetime, timezone

import pytest


def _tick_payload(lap: int = 1) -> dict[str, object]:
    return {
        "raceId": "bahrain_2025",
        "driverId": "CAR_44",
        "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "lap": lap,
        "stintAge": lap,
        "compound": "M",
        "pace": 95.3 + lap,
        "tireWear": 0.5 + lap * 0.02,
        "fuel": 38.4 - lap * 0.3,
        "trackTemp": 42.5,
        "rainProb": 0.12,
        "scProb": 0.06,
        "gapFront": 1.8,
        "gapBack": 0.9,
        "position": 6,
    }


@pytest.mark.asyncio
async def test_telemetry_round_trip(async_client):
    headers = {"x-api-key": "test-key"}
    response = await async_client.post(
        "/api/v1/telemetry/tick", json=_tick_payload(), headers=headers
    )
    assert response.status_code == 202

    reco_resp = await async_client.get(
        "/api/v1/recommendation/current",
        params={"raceId": "bahrain_2025", "driverId": "CAR_44"},
    )
    assert reco_resp.status_code == 200
    body = reco_resp.json()
    assert "best" in body
    assert body["best"]["action"]
    assert isinstance(body["alts"], list)


@pytest.mark.asyncio
async def test_what_if_endpoint(async_client):
    payload = {
        "raceId": "bahrain_2025",
        "driverId": "CAR_44",
        "current": _tick_payload(),
        "candidates": [
            {"pitIn": 0, "compound": "S"},
            {"pitIn": 1, "compound": "S"},
            {"pitIn": 2, "compound": "S"},
        ],
        "horizon": 6,
        "rollouts": 32,
        "riskLambda": 0.3,
    }
    response = await async_client.post("/api/v1/strategy/whatif", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) == 3
    assert body["chosen"]["compound"] == "S"


@pytest.mark.asyncio
async def test_replay_log_returns_entries(async_client):
    headers = {"x-api-key": "test-key"}
    for lap in range(1, 4):
        await async_client.post(
            "/api/v1/telemetry/tick", json=_tick_payload(lap=lap), headers=headers
        )

    response = await async_client.get(
        "/api/v1/replay/log",
        params={"raceId": "bahrain_2025", "driverId": "CAR_44"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["count"] >= 3


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert body["redis"]
    assert body["database"]
