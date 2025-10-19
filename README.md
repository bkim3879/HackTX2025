# HackTX2025

## Backend quick start

1. `cd backend`
2. `python3 -m venv .venv && source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. `cp .env.example .env` and adjust values (update `API_KEY`, `REDIS_URL`, `FASTF1_CACHE_DIR`, etc.)
5. Ensure Redis is running locally (`docker run --rm -p 6379:6379 redis:7-alpine`)
6. Launch the API with `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Interactive API docs: `http://localhost:8000/api/v1/docs`

Detailed endpoint reference: `backend/docs/backend_info.md`

### Tests

```bash
cd backend
pytest
```

Fakeredis is used in tests, so no live Redis instance is required.

### FastF1 ingestion

The backend can pull historical telemetry via FastF1. Populate `.env` with a writable `FASTF1_CACHE_DIR`, then call:

```bash
curl -X POST http://localhost:8000/api/v1/telemetry/import/fastf1 \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"year":2023,"eventName":"Bahrain","sessionCode":"R","driverId":"VER"}'
```

The cache fills on first run (may take a minute). Subsequent requests replay cached data instantly.

## Container workflow

1. `cd backend`
2. `docker-compose up --build`
3. API is available on `http://localhost:8000`, Redis on `localhost:6379`

Override environment values using a `.env` file or exported variables before invoking `docker-compose`.
