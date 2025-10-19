"Decision engine orchestrating Monte Carlo evaluation and persistence."

from __future__ import annotations

import hashlib
import time
from typing import Sequence

import orjson
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import AppSettings, get_settings
from app.models.api import (
    ActionScore,
    Recommendation,
    RecommendationModelMetadata,
    TelemetryTick,
    WhatIfCandidate,
)
from app.models.db import DecisionLogRecord
from app.services.monte_carlo import MonteCarloEvaluator
from app.services.recommendation_cache import RecommendationCache

logger = structlog.get_logger(__name__)


class DecisionEngineService:
    """Run strategy evaluation for incoming telemetry."""

    def __init__(
        self,
        evaluator: MonteCarloEvaluator,
        cache: RecommendationCache,
        settings: AppSettings | None = None,
    ) -> None:
        self._evaluator = evaluator
        self._cache = cache
        self._settings = settings or get_settings()

    async def process_tick(
        self,
        session: AsyncSession,
        tick: TelemetryTick,
        rollouts: int | None = None,
        persist: bool = True,
    ) -> Recommendation:
        start = time.perf_counter()
        candidates = self._candidates_for_tick(tick)
        evaluations = self._evaluator.evaluate(
            current=tick,
            candidates=candidates,
            rollouts=rollouts or 128,
            risk_lambda=self._settings.risk_lambda,
        )
        action_scores = self._evaluator.build_action_scores(evaluations)
        latency_ms = int((time.perf_counter() - start) * 1000)

        recommendation = Recommendation(
            best=action_scores[0],
            alts=action_scores[1:4],
            model=RecommendationModelMetadata(
                version=self._settings.model_version,
                latencyMs=max(latency_ms, 1),
            ),
        )

        await self._cache.set_current(tick.race_id, tick.driver_id, recommendation)

        if persist:
            await self._cache.publish_update(
                channel=self._settings.recommendation_channel,
                race_id=tick.race_id,
                driver_id=tick.driver_id,
                recommendation=recommendation,
            )

            await self._append_decision_log(session, tick, action_scores, latency_ms)
            logger.info(
                "decision.computed",
                race_id=tick.race_id,
                driver_id=tick.driver_id,
                lap=tick.lap,
                action=recommendation.best.action,
            )
        return recommendation

    def _candidates_for_tick(self, tick: TelemetryTick) -> list[WhatIfCandidate]:
        compounds_cycle = self._compound_rotation(tick.compound)
        return [
            WhatIfCandidate(pitIn=0, compound=compounds_cycle[0]),
            WhatIfCandidate(pitIn=1, compound=compounds_cycle[1]),
            WhatIfCandidate(pitIn=2, compound=compounds_cycle[2]),
            WhatIfCandidate(pitIn=3, compound=tick.compound),
        ]

    def _compound_rotation(self, current: str) -> Sequence[str]:
        order = ["S", "M", "H"]
        if current.upper() not in order:
            return ("S", "M", "H")
        idx = order.index(current.upper())
        return order[(idx + 1) % len(order) :] + order[: idx + 1]

    async def _append_decision_log(
        self,
        session: AsyncSession,
        tick: TelemetryTick,
        action_scores: list[ActionScore],
        latency_ms: int,
    ) -> None:
        state_payload = tick.model_dump(by_alias=True, mode="json")
        state_hash = hashlib.sha1(orjson.dumps(state_payload)).hexdigest()[:12]
        record = DecisionLogRecord(
            race_id=tick.race_id,
            driver_id=tick.driver_id,
            lap=tick.lap,
            ts=tick.ts,
            state_hash=state_hash,
            recommendation=action_scores[0].model_dump(by_alias=True),
            alts=[score.model_dump(by_alias=True) for score in action_scores[1:4]],
            explain={
                "riskLambda": self._settings.risk_lambda,
                "modelVersion": self._settings.model_version,
                "latencyMs": latency_ms,
            },
        )
        session.add(record)
        await session.commit()
