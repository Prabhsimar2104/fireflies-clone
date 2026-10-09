# Architecture

## Overview

Fireflies Clone is a split full-stack application. The Next.js frontend renders the meeting workspace and calls a versioned FastAPI backend. The backend validates requests with Pydantic, applies domain behavior in service modules, and persists data through SQLAlchemy to SQLite.

```text
Next.js UI
  -> typed frontend API clients
  -> FastAPI routers
  -> Pydantic schemas
  -> service layer
  -> SQLAlchemy models/ORM
  -> SQLite
```

## Technology stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, CSS Modules.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy.
- Database: SQLite, normally stored at `backend/data/fireflies_clone.db`.

## Frontend

The frontend lives in `frontend/app`.

- Route components render the meetings library at `/` and the meeting detail route at `/meetings/[meetingId]`.
- Client components own interactive UI behavior such as filters, CRUD dialogs, transcript search, and simulated playback.
- Typed modules in `app/lib` call the backend for meetings, detail data, transcripts, summaries/action items, and formatting.
- `MeetingPlayback` owns the shared simulated playback state consumed by `MediaPlayer` and `Transcript`.

The frontend API base URL is resolved as `NEXT_PUBLIC_BACKEND_API_URL`, then `BACKEND_API_URL`, then `http://127.0.0.1:8000`.

## Backend

The backend lives in `backend/app`.

- `main.py` creates the FastAPI application, configures CORS, and mounts the API at `/api`.
- `api/router.py` mounts the v1 router at `/v1`, producing the `/api/v1` application API prefix.
- Route modules under `api/v1` define HTTP handlers and response schemas.
- `schemas` contains the Pydantic request and response models.
- `services` contains meeting, transcript, summary/topic, and action-item operations.
- `db` contains SQLAlchemy models, session setup, table initialization, and deterministic seed data.

SQLite connections enable foreign-key enforcement. Request sessions are supplied through the API dependency layer.

## Main entities

- `Meeting`: title, meeting date, duration, participants, and owned meeting data.
- `Participant`: a unique named participant that can be linked to many meetings.
- `TranscriptSegment`: speaker, text, numeric start/end timestamps, and a parent meeting.
- `Summary`: one summary text record per meeting.
- `SummaryTopic`: ordered topic associated with a meeting summary.
- `ActionItem`: task, optional assignee, completion status, and parent meeting.

Deleting a meeting cascades to its owned transcript segments, summary, summary topics, and action items. Meetings and participants use a join table.

## API route groups

All application routes are under `/api/v1`.

- Health: `GET /health`.
- Meetings: list, retrieve, create, partially update, and delete `/meetings` resources.
- Transcript: list/create `/meetings/{meeting_id}/transcript` segments and update/delete individual segments.
- Summary and topics: read/update `/meetings/{meeting_id}/summary`; create, update, and delete summary topics under `/summary/topics`.
- Action items: list/create `/meetings/{meeting_id}/action-items` and update/delete individual action items.

FastAPI also exposes a legacy `GET /health` endpoint outside the versioned API.

## Local data lifecycle

`app.db.init_db` creates tables if needed. `app.db.seed` initializes the database, clears existing application records, rebuilds deterministic local seed data, and verifies the result. See the root README for setup and reset warnings.

## Deliberate boundaries

The implementation does not include real media files or playback, uploads, authentication, team collaboration, speech-to-text, AI/LLM integration, or production deployment configuration.
