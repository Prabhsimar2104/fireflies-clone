# Fireflies Clone Backend

The backend is a FastAPI application using SQLAlchemy and SQLite. It provides versioned meetings, transcript, summary/topic, and action-item APIs for the Next.js frontend.

## Python environment and dependencies

From the `backend/` directory in Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The project context records Python 3.14 as the development version.

## Configuration

Copy the example only when overriding local defaults:

```powershell
Copy-Item .env.example .env
```

| Variable | Default / behavior |
| --- | --- |
| `DATABASE_URL` | SQLite database at `backend/data/fireflies_clone.db`, represented by an absolute `sqlite:///...` URL. |
| `CORS_ORIGINS` | `http://localhost:3000`; accepts comma-separated origins. |

See [.env.example](.env.example) for example values. No secrets are required for the local SQLite setup.

## Initialize and seed SQLite

```powershell
python -m app.db.init_db
python -m app.db.seed
```

`init_db` creates the configured SQLite parent directory and ORM tables if they do not exist. It does not clear existing data.

> Warning: `seed` calls initialization and then deletes all current application records before rebuilding the deterministic local seed dataset. Use it as a local reset command.

## Run the server

```powershell
python -m uvicorn app.main:app --reload
```

The local server is available at `http://127.0.0.1:8000`.

## Run backend tests

The API suite creates a separate temporary SQLite database for every test and does not use the local development database or seed command.

From the repository root:

```powershell
backend\.venv\Scripts\python.exe -m pytest -v
```

From `backend/` with the virtual environment active:

```powershell
python -m pytest -v
```

## Health and API documentation

- Legacy health check: `http://127.0.0.1:8000/health`
- Versioned health check: `http://127.0.0.1:8000/api/v1/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`

Application endpoints are under `/api/v1`. See the root [README](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md) for the endpoint overview and implemented architecture.
