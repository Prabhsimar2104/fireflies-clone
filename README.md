# Fireflies Clone

Fireflies Clone is a local full-stack meeting intelligence application. It provides a meeting library, meeting details, transcript navigation and search, simulated playback, summaries, action items, and meeting CRUD workflows backed by FastAPI and SQLite.

## Implemented features

- Meeting library with title search, participant and date filters, sorting, loading/error/empty states, and create workflow.
- Meeting detail pages with metadata, participants, editing, and cascading deletion confirmation.
- Transcript display with local literal-text search, match navigation, timestamp click-to-seek, and active-segment playback synchronization.
- Simulated meeting playback with play/pause and seek controls.
- Read-only summary, ordered topics, and action-item display with independent loading and error states.
- Responsive and keyboard-accessible UI, including focus restoration after Create, Edit, and Delete dialogs close.
- Versioned FastAPI endpoints for meetings, transcripts, summaries/topics, and action items.

## Technology and architecture

- Frontend: Next.js 16, React 19, TypeScript, CSS Modules.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy.
- Database: SQLite.

```text
Next.js UI
  -> typed frontend API clients
  -> FastAPI routers
  -> Pydantic schemas
  -> service layer
  -> SQLAlchemy models/ORM
  -> SQLite
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the implemented route groups and entity relationships.

## Prerequisites

- Windows PowerShell.
- Python 3.14 (the version used by this project).
- Node.js with npm.

## Run locally

Use two PowerShell terminals from a clean checkout.

### Terminal 1: backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m app.db.init_db
python -m app.db.seed
python -m uvicorn app.main:app --reload
```

The backend listens on `http://127.0.0.1:8000`.

### Terminal 2: frontend

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

The frontend listens on `http://localhost:3000`.

PowerShell on the project’s development machine uses `npm.cmd` instead of the `npm.ps1` shim.

## Environment configuration

Configuration is optional for local development. Copy the examples if you need to override defaults:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

| Variable | Used by | Default / behavior |
| --- | --- | --- |
| `DATABASE_URL` | Backend | `sqlite:///.../backend/data/fireflies_clone.db`, based on the backend directory. |
| `CORS_ORIGINS` | Backend | `http://localhost:3000`; accepts a comma-separated origin list. |
| `NEXT_PUBLIC_BACKEND_API_URL` | Frontend | First choice for the API base URL. |
| `BACKEND_API_URL` | Frontend | Used only when `NEXT_PUBLIC_BACKEND_API_URL` is unset. |
| Neither frontend API variable | Frontend | `http://127.0.0.1:8000`. |

The frontend resolves its API base URL in this exact order:

```text
NEXT_PUBLIC_BACKEND_API_URL -> BACKEND_API_URL -> http://127.0.0.1:8000
```

## Database setup and seed data

`python -m app.db.init_db` creates the SQLite directory and ORM tables when they do not already exist. It does not remove existing data.

`python -m app.db.seed` calls database initialization itself, then **deletes and rebuilds all application data** with the deterministic local seed dataset. Run it only when resetting local development data is intended.

The seed workflow verifies the rebuilt data and produces 5 meetings, 8 participants, 75 transcript segments, 5 summaries, 15 topics, and 15 action items.

## Validation and frontend commands

From `frontend/`:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

`start` serves a production build after `build` has completed. Repository whitespace can be checked from the repository root:

```powershell
git diff --check
```

## Health and API documentation

With the backend running:

- Health check: `http://127.0.0.1:8000/health`
- Versioned health check: `http://127.0.0.1:8000/api/v1/health`
- Interactive FastAPI documentation: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`

## API overview

All application endpoints are versioned under `/api/v1`.

- `GET /meetings` supports pagination, title search, participant/date filters, and sort order.
- `GET`, `POST`, `PATCH`, and `DELETE /meetings/{meeting_id}` manage meetings; creation is `POST /meetings`.
- `GET` and `POST /meetings/{meeting_id}/transcript`, plus `PATCH` and `DELETE` for individual transcript segments.
- `GET` and `PATCH /meetings/{meeting_id}/summary`; summary topics support `POST`, `PATCH`, and `DELETE` beneath `/summary/topics`.
- `GET` and `POST /meetings/{meeting_id}/action-items`, plus `PATCH` and `DELETE` for individual action items.

Use the interactive API documentation for complete request and response schemas.

## Current limitations

- Playback is simulated from a meeting duration; there is no real audio or video file playback.
- There is no authentication, workspace switching, invitations, notifications, profile menu, Search page, or Settings page implementation.
- There are no uploads, speech-to-text processing, or AI/LLM integrations.
- Production deployment configuration and deployment instructions are not yet complete.

## Project documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) describes the implemented system structure.
- [backend/README.md](backend/README.md) covers backend-specific setup and operations.
- [frontend/README.md](frontend/README.md) covers frontend-specific setup and API configuration.
- `PROJECT_CONTEXT.md` is the detailed project continuation record.
