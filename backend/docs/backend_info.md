# RTSC+ Backend Reference

This page mirrors the core setup notes in the README but adds deeper, API-focused detail for engineers wiring clients and data feeds.

## Environment & Bootstrapping

- Python 3.11 virtualenv (or container) with `backend/requirements.txt`
- Key env vars (defaults in `.env.example`):
  - `API_KEY` — required for write endpoints
  - `REDIS_URL` — Redis for pub/sub + cache (`redis://localhost:6379/0` locally)
  - `DATABASE_URL` — SQLite by default (`sqlite+aiosqlite:///./rtsc.db`)
  - `FASTF1_CACHE_DIR` — writable cache dir for FastF1 (`./data/fastf1-cache`)
- Services started via `uvicorn app.main:app --reload` or `docker-compose up`

Testing: `pytest` (fakeredis fixture, no external services needed).

## REST Endpoints

All endpoints are prefixed with `/api/v1`.

### Telemetry Tick
- **Route:** `POST /telemetry/tick`
- **Auth:** `x-api-key`
- **Purpose:** ingest a live tick, persist, recompute recommendation.
- **Sample request:**
  ```json
  {
    "raceId": "bahrain_2025",
    "driverId": "CAR_44",
    "ts": "2025-10-18T14:05:23Z",
    "lap": 32,
    "stintAge": 14,
    "compound": "M",
    "pace": 95.3,
    "tireWear": 0.62,
    "trackTemp": 42.5,
    "rainProb": 0.12,
    "scProb": 0.06,
    "gapFront": 1.8,
    "gapBack": 0.9,
    "position": 6
  }
  ```
- **Response:** `{"status": "accepted"}` (202)
- **Usage:** primary ingestion path for the real-time telemetry bridge.

### FastF1 Import
- **Route:** `POST /telemetry/import/fastf1`
- **Auth:** `x-api-key`
- **Purpose:** load historical laps from FastF1 and push them through the pipeline.
- **Request:**
  ```json
  {
    "year": 2023,
    "eventName": "Bahrain",
    "sessionCode": "R",
    "driverId": "VER",
    "raceId": "bahrain_race_2023"
  }
  ```
- **Response:** `{"imported": 58}`
- **Usage:** scenario/replay mode, synthetic dataset seeding.

### Current Recommendation
- **Route:** `GET /recommendation/current?raceId=...&driverId=...`
- **Purpose:** return latest recommendation, pulling from Redis cache or recomputing.
- **Response sample:**
  ```json
  {
    "best": {"action":"pit_in_1_s","mu":-6.2,"sigma":1.9,"conf":0.82,"reasons":["degradation_up","clean_rejoin"]},
    "alts": [
      {"action":"pit_now_s","mu":-5.0,"sigma":1.6,"conf":0.77},
      {"action":"stay_3_laps","mu":2.8,"sigma":2.2,"conf":0.41}
    ],
    "model": {"version":"rtsc_1.0.3","latencyMs":143}
  }
  ```
- **Usage:** front-end widgets or integrations that need synchronous fetches.

### Strategy What-If
- **Route:** `POST /strategy/whatif`
- **Purpose:** run Monte Carlo evaluation for candidate actions.
- **Body:**
  ```json
  {
    "raceId": "bahrain_2025",
    "driverId": "CAR_44",
    "current": { "... all TelemetryTick fields ..." },
    "candidates": [
      {"pitIn":0,"compound":"S"},
      {"pitIn":1,"compound":"S"},
      {"pitIn":2,"compound":"S"}
    ],
    "horizon": 12,
    "rollouts": 500,
    "riskLambda": 0.3
  }
  ```
- **Response:**
  ```json
  {
    "results": [
      {"pitIn":0,"compound":"S","mu":-5.1,"sigma":1.7},
      {"pitIn":1,"compound":"S","mu":-5.8,"sigma":1.8},
      {"pitIn":2,"compound":"S","mu":-6.2,"sigma":1.9}
    ],
    "chosen": {"pitIn":2,"compound":"S","score":-5.63}
  }
  ```
- **Usage:** RTSC+ Strategy Lab and decision-support tooling.

### Replay Log
- **Route:** `GET /replay/log`
- **Query params:** `raceId`, `driverId`, optional `fromLap`, `toLap`, `limit`, `offset`.
- **Purpose:** retrieve stored decision log entries.
- **Response snippet:**
  ```json
  {
    "items": [
      {
        "ts":"2025-10-18T14:05:23Z",
        "raceId":"bahrain_2025",
        "driverId":"CAR_44",
        "lap":32,
        "stateHash":"a1b2c3d4e5f6",
        "recommendation":{"action":"pit_in_1_s","mu":-6.2,"sigma":1.9,"conf":0.82},
        "alts":[{"action":"pit_now_s","mu":-5.0,"sigma":1.6,"conf":0.77}],
        "explain":{"riskLambda":0.3,"modelVersion":"rtsc_1.0.3","latencyMs":143}
      }
    ],
    "count": 1
  }
  ```
- **Usage:** timeline replay, audit logging, coaching review.

### Health and Metadata
- `GET /health` → `{"status":"ok","redis":"ok","database":"ok"}`  
  Used for deploy health checks.
- `GET /meta` → `{"app":"RTSC+ Backend","version":"rtsc_1.0.3","riskLambda":0.3,"wsRecommendationFreqHz":1}`  
  Used for UI version banners and smoke verification.

## WebSocket Channel

### Recommendations Stream
- **Route:** `ws://<host>/api/v1/ws/recommendations?raceId=...&driverId=...`
- **Handshake:** send `raceId` + `driverId` query params.
- **Initial payload:** latest cached recommendation.
- **Subsequent messages:** sent whenever the decision engine publishes a new recommendation.
- **Sample message:**
  ```json
  {
    "raceId": "bahrain_2025",
    "driverId": "CAR_44",
    "recommendation": {
      "best": {"action":"pit_in_1_s","mu":-6.2,"sigma":1.9,"conf":0.82},
      "alts": [...],
      "model": {"version":"rtsc_1.0.3","latencyMs":143}
    }
  }
  ```
- **Usage:** powers Mission Control live tiles and downstream alerting services.

## Service Components

- **TelemetryService** (`app/services/telemetry.py`)
  - Persists ticks into SQLModel.
  - Caches the last state in Redis and publishes `telemetry.updated`.
- **DecisionEngineService** (`app/services/decision_engine.py`)
  - Evaluates candidate actions via `MonteCarloEvaluator`.
  - Stores recommendations in Redis + decision log.
- **MonteCarloEvaluator** (`app/services/monte_carlo.py`)
  - Simple stochastic model using configurable risk lambda.
- **FastF1IngestService** (`app/services/fastf1_ingest.py`)
  - Converts historical laps into the standard telemetry format.

## Operational Notes

- Redis, database schema, and FastF1 cache are initialized in `app/main.py` during FastAPI lifespan.
- Rate limiting is per driver per minute via Redis counters (`RateLimiter`).
- Logging is structured JSON (structlog + orjson) with race/driver context added by the services.
- Docker image (`backend/Dockerfile`) installs dependencies and exposes port 8000; compose file adds Redis dependency.

Use this page as the quick reference for backend integrations while the main README stays focused on setup steps.
