"Pydantic models that define the RTSC+ public API."

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, Field

Compound = Literal["S", "M", "H", "I", "W"]


class TelemetryTick(BaseModel):
    race_id: str = Field(alias="raceId")
    driver_id: str = Field(alias="driverId")
    ts: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="ISO timestamp when the tick was generated",
    )
    lap: int
    stint_age: int = Field(alias="stintAge")
    compound: Compound
    pace: float | None = None
    tire_wear: float | None = Field(default=None, alias="tireWear")
    fuel: float | None = None
    track_temp: float | None = Field(default=None, alias="trackTemp")
    rain_prob: float | None = Field(default=None, alias="rainProb")
    sc_prob: float | None = Field(default=None, alias="scProb")
    gap_front: float | None = Field(default=None, alias="gapFront")
    gap_back: float | None = Field(default=None, alias="gapBack")
    position: int | None = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class ActionScore(BaseModel):
    action: str
    mu: float
    sigma: float
    conf: float | None = None
    reasons: list[str] | None = None


class RecommendationModelMetadata(BaseModel):
    version: str
    latency_ms: int = Field(alias="latencyMs")


class Recommendation(BaseModel):
    best: ActionScore
    alts: list[ActionScore] = Field(default_factory=list)
    model: RecommendationModelMetadata


class WhatIfCandidate(BaseModel):
    pit_in: int = Field(alias="pitIn")
    compound: Compound


class WhatIfRequest(BaseModel):
    race_id: str = Field(alias="raceId")
    driver_id: str = Field(alias="driverId")
    current: TelemetryTick
    candidates: list[WhatIfCandidate]
    horizon: int = 12
    rollouts: int = 500
    risk_lambda: float = Field(default=0.3, alias="riskLambda")

    model_config = {"populate_by_name": True}


class WhatIfResult(BaseModel):
    pit_in: int = Field(alias="pitIn")
    compound: Compound
    mu: float
    sigma: float


class ChosenWhatIf(BaseModel):
    pit_in: int = Field(alias="pitIn")
    compound: Compound
    score: float


class WhatIfResponse(BaseModel):
    results: list[WhatIfResult]
    chosen: ChosenWhatIf


class DecisionAck(BaseModel):
    by: str
    ts: datetime


class DecisionLogEntry(BaseModel):
    ts: datetime
    race_id: str = Field(alias="raceId")
    driver_id: str = Field(alias="driverId")
    lap: int
    state_hash: str = Field(alias="stateHash")
    recommendation: ActionScore
    alts: list[ActionScore]
    ack: DecisionAck | None = None
    explain: dict[str, float | int | str | list[str]] | None = None


class HealthResponse(BaseModel):
    status: str
    redis: str | None = None
    database: str | None = None


class MetaResponse(BaseModel):
    app: str
    version: str
    risk_lambda: float = Field(alias="riskLambda")
    ws_recommendation_freq_hz: int = Field(alias="wsRecommendationFreqHz")
