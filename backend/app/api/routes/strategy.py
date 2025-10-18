"Strategy lab endpoints."

from fastapi import APIRouter, Depends

from app.api.dependencies import monte_carlo_dependency
from app.models.api import WhatIfRequest, WhatIfResponse
from app.services.monte_carlo import MonteCarloEvaluator

router = APIRouter(prefix="/strategy", tags=["strategy"])


@router.post("/whatif", response_model=WhatIfResponse)
async def compute_what_if(
    request: WhatIfRequest,
    evaluator: MonteCarloEvaluator = Depends(monte_carlo_dependency),
) -> WhatIfResponse:
    return evaluator.what_if(request)
