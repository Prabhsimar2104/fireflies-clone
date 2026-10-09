# Architecture

## Overview

Fireflies Clone is a full-stack meeting notes and transcription demo. The Next.js frontend communicates with a versioned FastAPI backend over HTTP. The backend validates requests with Pydantic, applies application logic in service modules, and persists data through SQLAlchemy to SQLite.

```text
Browser
  |
  v
Next.js UI (React + TypeScript)
  |
  v
Frontend API clients
  |
  v
FastAPI routers (/api/v1)
  |
  v
Pydantic request/response schemas
  |
  v
Service layer
  |
  v
SQLAlchemy ORM and database sessions
  |
  v
SQLite database
```

## Technology Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript, CSS Modules.
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy.
- **Database:** SQLite, normally stored at `backend/data/fireflies_clone.db`.
- **Backend tests:** pytest with FastAPI's test client.

## Frontend

The frontend lives in `frontend/`.

- The root route (`/`) renders the meetings library.
- The meeting detail route (`/meetings/[meetingId]`) renders an individual meeting.
- Client components manage interactive behavior such as search, filters, CRUD dialogs, transcript navigation, and simulated playback.
- Typed modules under `app/lib` communicate with the backend and provide data to the UI.
- `MeetingPlayback` owns shared simulated playback state used by `MediaPlayer` and `Transcript`.
- Transcript search matches text locally and allows users to navigate between matching segments.
- Selecting a transcript segment seeks the simulated playback position; the active segment is highlighted as playback advances.

The frontend resolves its backend API base URL in this order:

1. `NEXT_PUBLIC_BACKEND_API_URL`
2. `BACKEND_API_URL`
3. `http://127.0.0.1:8000`

## Backend

The backend lives in `backend/app/`.

- `main.py` creates the FastAPI application, configures CORS, and mounts the application router at `/api`.
- `api/router.py` mounts the versioned router at `/v1`, producing the `/api/v1` API prefix.
- Route modules under `api/v1` define HTTP handlers and response models.
- `schemas/` contains Pydantic request and response models.
- `services/` contains meeting, transcript, summary/topic, and action-item operations.
- `db/` contains SQLAlchemy models, session configuration, database initialization, bootstrap logic, and seed data.

Request handlers use database sessions supplied through the API dependency layer. SQLite foreign-key enforcement is enabled for database connections.

## Database Schema

The database contains seven tables.

| Table | Purpose |
|---|---|
| `meetings` | Meeting title, date, duration, and timestamps. |
| `participants` | Unique participant names. |
| `meeting_participants` | Join table connecting meetings and participants. |
| `transcript_segments` | Transcript text, speaker, start time, and end time. |
| `summaries` | One summary text record per meeting. |
| `summary_topics` | Ordered topics associated with a meeting. |
| `action_items` | Tasks, optional assignees, completion status, and timestamps. |

### Relationships and Constraints

- Meetings and participants have a many-to-many relationship through `meeting_participants`.
- A meeting can have multiple transcript segments.
- A meeting can have one summary, enforced by a unique `meeting_id` in `summaries`.
- A meeting can have multiple ordered summary topics. Topic positions are unique within a meeting.
- A meeting can have multiple action items.
- Deleting a meeting cascades to its meeting-owned transcript segments, summary, summary topics, and action items.
- SQLite foreign-key enforcement is enabled for SQLAlchemy connections.

The schema is implemented in `backend/app/db/models.py`.

## API Route Groups

All versioned application endpoints use the `/api/v1` prefix.

- **Health:** `GET /health`.
- **Meetings:** List, retrieve, create, partially update, and delete meeting resources.
- **Transcripts:** List and create transcript segments; update and delete individual segments.
- **Summaries and topics:** Retrieve or update a meeting summary; create, update, and delete summary topics.
- **Action items:** List and create action items; update or delete individual items.

FastAPI also exposes `GET /health` outside the versioned API prefix.

Interactive API documentation is available at `/docs`, and the OpenAPI schema is available at `/openapi.json` when the backend is running.

## Database Initialization and Seed Data

Database initialization and seeding are separate operations.

- `app.db.init_db` creates missing tables without intentionally resetting existing application records.
- `app.db.seed` rebuilds the deterministic demo dataset by deleting existing application records and recreating the sample data.
- `app.db.bootstrap` initializes the schema and seeds the database only if it is empty.

**Warning:** The seed command is destructive. Do not run it against data that must be preserved.

The sample dataset includes meetings, participants, transcript segments, summaries, summary topics, and action items.

## Deployment

The demo is deployed separately:

- **Frontend:** Vercel.
- **Backend:** Render.
- **Database:** SQLite on the backend's filesystem.

The frontend uses `NEXT_PUBLIC_BACKEND_API_URL` to reach the deployed backend. The backend's `CORS_ORIGINS` setting must allow the frontend origin.

The current hosted SQLite database uses Render's ephemeral filesystem. Data changes may be lost when the instance restarts, is replaced, or is redeployed. The deployment demonstrates the application workflow but does not provide durable production database storage.

## Deliberate Boundaries and Limitations

- Meeting content, transcripts, summaries, and topics use seeded demo data.
- Playback is simulated; no actual audio or video is played.
- Real-time speech-to-text and audio transcription are not implemented.
- Summary generation does not use an integrated AI/LLM pipeline.
- Audio/video uploads are not implemented.
- Real user authentication, workspace switching, and team collaboration are not implemented.
- Search and Settings navigation destinations are placeholders rather than complete application pages.
- The hosted SQLite database is not durable production storage.

See the root `README.md` for setup instructions, environment variables, API endpoint details, tests, and links to the deployed application.
