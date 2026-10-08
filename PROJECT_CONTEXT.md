# Fireflies Clone — Project Context

## 1. Project Overview

Fireflies Clone is a full-stack meeting intelligence application for a Fireflies-like meetings library and meeting detail experience. The assignment is expected to grow from the current backend foundation into a persisted meetings dashboard with transcripts, media synchronization, summaries, action items, and a polished frontend.

The current repository contains the backend architecture, SQLite schema, deterministic development data, Meetings CRUD API, and Transcript API. The frontend is currently a standard Next.js scaffold; Fireflies-specific UI has not been implemented yet.

## 2. Required Stack

- Frontend: Next.js 16.4.0 + TypeScript
- Backend: Python 3.14.0 + FastAPI
- Database: SQLite
- ORM: SQLAlchemy 2.1.4

The backend uses Pydantic models through FastAPI for API request and response validation. Real-time speech-to-text is out of scope. Current transcripts are deterministic seeded/mock data.

## 3. Assignment Requirements

The planned application requirements include:

- Meetings library/dashboard
- Meeting and transcript detail
- Interactive transcript
- Media player placeholder
- Transcript search and matching-text highlighting
- AI-generated summary presentation
- Action-item presentation and management
- CRUD functionality
- Fireflies-like UI/UX
- Persistent data
- Deterministic seed data
- README and project documentation
- Deployment

Detailed product acceptance criteria beyond the repository's current README and architecture notes are not confirmed in the current repository. Future work should use the assignment brief and actual codebase as the source of truth rather than inventing behavior.

## 4. Current Architecture

The repository is split into independent `backend/` and `frontend/` applications.

Backend request/data flow:

```text
API router → Pydantic schema → service/business logic → SQLAlchemy ORM/session → SQLite
```

The backend currently has this structure:

```text
backend/
  app/
    api/
      deps.py
      router.py
      v1/
        health.py
        meetings.py
        router.py
        transcripts.py
    core/
      config.py
    db/
      base.py
      init_db.py
      models.py
      seed.py
      session.py
    schemas/
      meetings.py
      transcripts.py
    services/
      meetings.py
      transcripts.py
    main.py
  requirements.txt
```

The API is versioned under `/api/v1`. `app/main.py` includes the versioned API router under `/api`, while the API package includes the v1 router under `/v1`.

The database session dependency is `app.api.deps.get_db`. It creates a SQLAlchemy session for a request and closes it afterward. Database configuration is in `app.core.config`; `DATABASE_URL` can override the default SQLite URL.

CORS is configured in `app.main` from `CORS_ORIGINS`. The default local frontend origin is:

```text
http://localhost:3000
```

The frontend currently contains the standard Next.js App Router scaffold (`frontend/app`, `public`, TypeScript, ESLint, and package configuration). It does not yet communicate with the backend or contain application-specific Fireflies UI.

## 5. Database Schema

The SQLAlchemy models are defined in `backend/app/db/models.py`. The SQLite database is normally created at:

```text
backend/data/fireflies_clone.db
```

Entities and relationships:

- `meetings`: title, meeting date, duration in seconds, and created/updated timestamps.
- `participants`: unique participant names.
- `meeting_participants`: composite-key many-to-many join table between meetings and participants.
- `transcript_segments`: meeting-owned speaker transcript entries with numeric `start_time` and `end_time` seconds and text.
- `summaries`: one summary per meeting; `meeting_id` is unique.
- `summary_topics`: ordered topics belonging to a meeting; position is non-negative and unique within a meeting.
- `action_items`: meeting-owned tasks with optional assignee, completion state, and timestamps.

Important model behavior:

- A meeting has many participants, transcript segments, summary topics, and action items.
- A meeting has one summary.
- Participants and meetings are many-to-many through `meeting_participants`.
- Meeting-owned child foreign keys use cascade behavior.
- Meeting duration must be non-negative.
- Transcript start times must be non-negative and end times must be at or after the start time at the database level. The Transcript API additionally requires `end_time > start_time` and keeps it within the meeting duration.
- SQLite foreign-key enforcement is enabled for every SQLAlchemy connection.
- No migration framework is currently present or required by the current setup.

## 6. Seed Data

The deterministic seed module is `backend/app/db/seed.py`. It replaces the current local development records in dependency order and recreates the same dataset on every run.

Expected current counts:

- 5 meetings
- 8 participants
- 22 meeting-participant links
- 75 transcript segments
- 5 summaries
- 15 summary topics
- 15 action items

Each seeded meeting has at least 15 transcript segments, associated participants, one summary, three topics, and three action items. Seed transcript speakers match the meeting participants, and timestamps are numeric media-seeking values.

Seed command, run from `backend/` with the virtual environment active:

```powershell
python -m app.db.seed
```

The seed module also verifies required relationships, timestamp ranges, and orphan records.

## 7. Implemented API Endpoints

All versioned endpoints are under `/api/v1`.

### Health

- `GET /health` — legacy/backend health check; returns `{"status": "running"}`.
- `GET /api/v1/health` — versioned API health check; returns running status and `api_version: "v1"`.

### Meetings

- `GET /api/v1/meetings` — paginated meetings library response with `items`, `total`, `limit`, and `offset`. Query parameters:
  - `search`: case-insensitive title search.
  - `participant`: case-insensitive participant-name filter.
  - `date_from` and `date_to`: inclusive date range.
  - `sort_order`: `newest` by default or `oldest`.
  - `limit`: default 20, bounded from 1 to 100.
  - `offset`: default 0, non-negative.
- `GET /api/v1/meetings/{meeting_id}` — returns one meeting with ID, title, date, duration, and participants. Returns 404 if missing.
- `POST /api/v1/meetings` — creates a meeting from title, meeting date, duration, and participants. Existing participant names are reused.
- `PATCH /api/v1/meetings/{meeting_id}` — partially updates title, meeting date, duration, and/or participants.
- `DELETE /api/v1/meetings/{meeting_id}` — deletes a meeting and its meeting-owned child records.

Meeting list/detail responses do not include transcript, summary, topic, or action-item sections.

### Transcripts

- `GET /api/v1/meetings/{meeting_id}/transcript` — returns the meeting's transcript segments ordered by ascending numeric `start_time`.
- `POST /api/v1/meetings/{meeting_id}/transcript` — creates a segment with `speaker`, `start_time`, `end_time`, and `text`. The speaker must belong to the meeting's participants.
- `PATCH /api/v1/meetings/{meeting_id}/transcript/{segment_id}` — partially updates a segment while preserving meeting ownership, speaker, and timestamp validation.
- `DELETE /api/v1/meetings/{meeting_id}/transcript/{segment_id}` — deletes a segment belonging to the specified meeting.

Transcript responses expose only `id`, `speaker`, `start_time`, `end_time`, and `text`. There is no separate transcript search endpoint yet; numeric timestamps and individual segments are intended to support future search/highlighting and media seeking.

Not implemented in the current repository: summary APIs, topic APIs, action-item APIs, authentication, file upload, audio processing, speech-to-text, and AI/LLM integration.

## 8. Completed Development Phases

- Phase 1A — FastAPI backend initialization: created the backend package, virtual environment, requirements, minimal FastAPI app, and `/health` endpoint.
- Phase 1B — Next.js frontend initialization: created the TypeScript App Router frontend with ESLint and npm setup.
- Phase 2 — SQLite + SQLAlchemy schema: created the database module, ORM models, relationships, constraints, and database initialization command.
- Phase 3 — Deterministic seed data: added five realistic meetings with reusable participants, transcripts, summaries, topics, and action items.
- Phase 4 — Backend API foundation: added `/api/v1`, CORS, configuration, router organization, service structure, and database session dependency.
- Phase 5 — Meetings CRUD API: added paginated/filterable meeting listing and meeting create, read, update, and delete operations.
- Phase 6 — Transcript API: added ordered transcript retrieval and segment create, update, and delete operations with participant and timestamp validation.

## 9. Current Status

Current phase:

**Phase 7 — Summary & Action Items API**

Phase 7 has **not** been implemented yet.

## 10. Remaining Roadmap

Planned remaining work, in broad order:

- Summary & Action Items APIs
- Backend testing and completion
- Frontend layout
- Meetings dashboard/library
- Meeting detail page
- Media player placeholder
- Transcript/player synchronization
- Transcript search and highlighting
- Summary UI
- Action-item management UI
- Meeting CRUD UI
- Forms, modals, and toasts
- Fireflies-style UI polish
- Error and loading states
- README/final documentation
- Final testing
- Deployment
- GitHub cleanup
- Interview preparation

These are planned items only and are not implemented unless documented in the current API or codebase above.

## 11. Important Development Rules

- Work incrementally by phase.
- Keep Codex tasks narrowly scoped.
- Do not let Codex implement later phases prematurely.
- Preserve the existing architecture unless there is a strong reason to change it.
- Avoid unnecessary dependencies.
- Keep the frontend and backend separated.
- Keep database models separate from API schemas.
- Keep business logic in services rather than route handlers.
- Use Git commits after meaningful milestones.
- Verify each phase before moving to the next.
- The developer should understand the code rather than blindly accepting generated code.

## 12. Codex Workflow

- Cursor is the IDE.
- Codex is used for implementation.
- ChatGPT is used for architecture, planning, explanation, review, and debugging.
- Prefer GPT-5.6 Luna + Light for simple documentation/setup tasks.
- Prefer GPT-5.6 Terra + Medium for normal implementation tasks.
- Use higher reasoning only when a difficult bug genuinely requires it.
- Keep prompts small and phase-specific to conserve Codex usage.

## 13. Important Commands

Commands below assume PowerShell and the indicated working directory.

Backend virtual environment activation:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

Backend development server:

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

Database initialization:

```powershell
cd backend
python -m app.db.init_db
```

Seed and verify deterministic local data:

```powershell
cd backend
python -m app.db.seed
```

Frontend development server:

```powershell
cd frontend
npm.cmd run dev
```

On this machine, PowerShell blocks the `npm.ps1` shim, so `npm.cmd` is the working npm command. The frontend is normally available at `http://localhost:3000`; the backend is normally available at `http://127.0.0.1:8000`.

Useful Git workflow commands:

```powershell
git status
git diff
git add <files>
git commit -m "Describe the milestone"
git push
```

The exact active branch and remote configuration are not confirmed in this document; inspect `git branch --show-current` and `git remote -v` before any push operation.

## 14. Important Decisions

- FastAPI was selected instead of Django for a small, focused API service.
- SQLite is used for this assignment's local persistent database.
- SQLAlchemy is the ORM and keeps database models separate from API schemas.
- API versioning uses `/api/v1` so future API revisions can coexist.
- Routers handle HTTP concerns, schemas handle validation/serialization, and services contain business logic.
- Transcript segments are stored individually rather than as one large transcript so they can be ordered, edited, searched, highlighted, and synchronized with media later.
- Transcript timestamps are stored numerically in seconds for media synchronization.
- Participants are represented through a many-to-many relationship with meetings.
- Real speech-to-text is out of scope; current transcript content is seeded/mock data.

## 15. Continuation Instructions for Another AI

Before implementing anything, inspect the current repository and this document. Treat the actual codebase as the source of truth. Continue from the current phase rather than rebuilding existing functionality. Preserve the existing backend/frontend separation, router-schema-service layering, database models, seed behavior, and API versioning.

The next planned implementation task is **Phase 7 — Summary & Action Items API**. Do not implement later frontend phases in the same task unless explicitly requested.
