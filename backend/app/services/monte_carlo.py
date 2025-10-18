"Lightweight stochastic evaluator approximating pit strategy outcomes."

from __future__ import annotations

import math
import statistics
import random
from dataclasses import dataclass
from typing import Iterable

from app.core.config import AppSettings
from app.models.api import (
    ActionScore,
    TelemetryTick,
    WhatIfCandidate,
    WhatIfRequest,
    WhatIfResponse,
    WhatIfResult,
)


@dataclass(frozen=True)
class EvaluatedCandidate:
    candidate: WhatIfCandidate
    mu: float
    sigma: float
    conf: float
    reasons: list[str]


class MonteCarloEvaluator:
    """Simple Monte Carlo evaluator seeded for determinism."""

    def __init__(self, settings: AppSettings) -> None:
        self._settings = settings

    def _rng(self, *keys: str) -> random.Random:
        seed = self._settings.test_seed
        if seed is None:
            seed = 0
            for key in keys:
                seed ^= hash(key) & 0xFFFFFFFF
        return random.Random(seed)

    def evaluate(
        self,
        current: TelemetryTick,
        candidates: Iterable[WhatIfCandidate],
        rollouts: int,
        risk_lambda: float,
    ) -> list[EvaluatedCandidate]:
        evaluations: list[EvaluatedCandidate] = []
        base_pace = current.pace or 95.0
        rng = self._rng(current.race_id, current.driver_id, str(current.lap))

        for candidate in candidates:
            samples: list[float] = []
            deterioration = max(current.stint_age, 1)
            for _ in range(max(rollouts, 1)):
                pace_delta = self._pace_delta(
                    rng=rng,
                    base_pace=base_pace,
                    stint_age=deterioration,
                    compound=candidate.compound,
                    pit_in=candidate.pit_in,
                    rain_prob=current.rain_prob or 0.0,
                    sc_prob=current.sc_prob or 0.0,
                )
                samples.append(pace_delta)

            mu = statistics.fmean(samples)
            sigma = statistics.pstdev(samples) if len(samples) > 1 else 0.0
            conf = max(0.0, min(1.0, 1.0 - (sigma / (abs(mu) + 5.0))))
            reasons = self._reasons(candidate, mu, sigma, current)
            evaluations.append(
                EvaluatedCandidate(
                    candidate=candidate,
                    mu=mu,
                    sigma=sigma,
                    conf=conf,
                    reasons=reasons,
                )
            )

        evaluations.sort(key=lambda item: item.mu + risk_lambda * item.sigma)
        return evaluations

    def _pace_delta(
        self,
        rng: random.Random,
        base_pace: float,
        stint_age: int,
        compound: str,
        pit_in: int,
        rain_prob: float,
        sc_prob: float,
    ) -> float:
        compound_bias = {"S": -1.2, "M": -0.2, "H": 0.6, "I": 1.6, "W": 3.4}.get(
            compound, 0.0
        )
        degradation = 0.18 * math.log1p(stint_age)
        pit_loss = 0.0
        if pit_in <= 0:
            pit_loss = 18.5 + rng.random() * 1.5
        else:
            degradation += pit_in * 0.12

        weather_penalty = (rain_prob * 4.0) + (sc_prob * 3.0)
        noise = rng.gauss(0.0, 0.9)
        return (base_pace + compound_bias + degradation + pit_loss + weather_penalty + noise) - base_pace

    def _reasons(
        self, candidate: WhatIfCandidate, mu: float, sigma: float, current: TelemetryTick
    ) -> list[str]:
        tags: list[str] = []
        if candidate.pit_in <= 0:
            tags.append("fresh_tires")
        if mu < 0:
            tags.append("projected_gain")
        if sigma < 1.5:
            tags.append("low_variance")
        if current.tire_wear and current.tire_wear > 0.6:
            tags.append("degradation_up")
        if not tags:
            tags.append("baseline")
        return tags

    def build_action_scores(
        self, evaluations: list[EvaluatedCandidate]
    ) -> list[ActionScore]:
        return [
            ActionScore(
                action=self._format_action(candidate),
                mu=round(item.mu, 2),
                sigma=round(item.sigma, 2),
                conf=round(item.conf, 2),
                reasons=item.reasons,
            )
            for item in evaluations
            for candidate in [item.candidate]
        ]

    def _format_action(self, candidate: WhatIfCandidate) -> str:
        if candidate.pit_in <= 0:
            return f"pit_now_{candidate.compound.lower()}"
        if candidate.pit_in == 1:
            return f"pit_in_1_{candidate.compound.lower()}"
        return f"stay_{candidate.pit_in}_laps"

    def what_if(self, request: WhatIfRequest) -> WhatIfResponse:
        evaluations = self.evaluate(
            current=request.current,
            candidates=request.candidates,
            rollouts=request.rollouts,
            risk_lambda=request.risk_lambda,
        )
        results = [
            WhatIfResult(
                pitIn=item.candidate.pit_in,
                compound=item.candidate.compound,
                mu=round(item.mu, 2),
                sigma=round(item.sigma, 2),
            )
            for item in evaluations
        ]
        chosen = evaluations[0]
        score = chosen.mu + request.risk_lambda * chosen.sigma
        return WhatIfResponse(
            results=results,
            chosen={
                "pitIn": chosen.candidate.pit_in,
                "compound": chosen.candidate.compound,
                "score": round(score, 2),
            },
        )
