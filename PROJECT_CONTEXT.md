# Fireflies Clone — Project Context

## 1. Project overview

Fireflies Clone is a split full-stack meeting intelligence application. The current repository contains a FastAPI backend with SQLite/SQLAlchemy persistence, deterministic development data, Meetings/Transcript/Summary/Action Items APIs, and a Next.js frontend through the transcript display milestone.

The codebase—not the original assignment description—is the source of truth. Media playback, transcript synchronization/search, summary UI, action-item UI, meeting CRUD UI, authentication, uploads, speech-to-text, AI integration, and deployment are not complete.

## 2. Stack and architecture

- Frontend: Next.js 16.4.0 App Router, React 19.3.0, TypeScript, CSS Modules.
- Backend: Python 3.14.0, FastAPI, Pydantic, SQLAlchemy 2.1.4.
- Database: SQLite, normally `backend/data/fireflies_clone.db`.
- API base: `/api/v1`; frontend defaults to `http://127.0.0.1:8000` and can use `NEXT_PUBLIC_BACKEND_API_URL` or `BACKEND_API_URL`.

Backend flow:

```text
API router → Pydantic schema → service → SQLAlchemy session/ORM → SQLite
```

The backend is organized under `backend/app/{api,core,db,schemas,services}`. `app.api.deps.get_db` supplies request sessions, `app.core.config` handles configuration, and `app.main` configures CORS (default frontend origin `http://localhost:3000`).

Frontend structure:

```text
frontend/app/
  page.tsx                         meetings library
  layout.tsx, globals.css          root layout and global styling
  page.module.css                  library page styling
  components/
    AppShell.tsx                   sidebar, header, workspace chrome
    MeetingFilters.tsx              search/filter/sort controls
    MeetingList.tsx                 linked meeting rows and empty state
    MeetingDetail.tsx               meeting metadata and transcript section
    Transcript.tsx                  client-side transcript loading/display
  lib/
    meetings.ts                    meeting types and list API client
    meetingDetail.ts                single-meeting API client
    transcripts.ts                  transcript API client
    meetingFormatters.ts            date, duration, and timestamp formatting
  meetings/[meetingId]/             dynamic detail route plus loading/error/not-found UI
```

`AppShell` provides Fireflies-style navigation labels (Meetings, Search, Settings), workspace header, notifications/profile controls, and the invite button. Search and Settings navigation are visual placeholders.

## 3. Database and seed data

SQLAlchemy models are in `backend/app/db/models.py`; initialization is `backend/app/db/init_db.py`; deterministic replacement/verification is `backend/app/db/seed.py`. The schema includes meetings, unique participants, the meeting-participant join table, transcript segments, one summary per meeting, ordered summary topics, and action items. Child records cascade from their meeting. Foreign keys and timestamp/duration constraints are enforced.

The seeded dataset is stable and contains:

- 5 meetings
- 8 participants
- 22 meeting-participant links
- 75 transcript segments
- 5 summaries
- 15 summary topics
- 15 action items

Each meeting has participants, at least 15 transcript segments, one summary with three topics, and three action items. Seed transcripts use numeric seconds and participant speakers.

## 4. Current frontend behavior

### Meetings Library

The root page (`/`) is a client component. It fetches the paginated meetings response with a 300 ms debounce and aborts stale requests. It renders loading, error/retry, filtered-empty, and no-meetings states.

`MeetingFilters` supports:

- case-insensitive title search through the backend `search` query;
- participant-name filtering;
- inclusive `From` and `To` date fields with input constraints;
- newest/oldest sorting;
- clearing active filters.

`MeetingList` renders title, formatted meeting date/time, formatted duration, and participant names. Each row links to `/meetings/{id}`. The UI does not create, edit, or delete meetings.

### Meeting Detail

`frontend/app/meetings/[meetingId]/page.tsx` is the dynamic detail route. It server-fetches the meeting through `getMeeting`, displays the meeting title, date/time, duration, participants, and a back link, and provides route-level loading, error, and not-found states. The detail response contains only meeting metadata and participants; it does not include summary, topics, action items, or transcript content.

### Transcript display

`Transcript` is a client component rendered on the detail page. It fetches `GET /api/v1/meetings/{meeting_id}/transcript`, supports abort-on-unmount and retry, shows loading/error/empty states, displays the segment count, and renders ordered segments with speaker, text, and `MM:SS` start timestamps. It does not provide transcript search, highlighting, editing, media controls, or media synchronization.

### Frontend data-fetching modules

- `lib/meetings.ts`: `Meeting`/query/response types and `getMeetings`; maps UI filters to API query parameters.
- `lib/meetingDetail.ts`: `getMeeting`; maps 404 to `null`.
- `lib/transcripts.ts`: `TranscriptSegment` type and `getTranscript`.
- `lib/meetingFormatters.ts`: date, duration, and timestamp presentation helpers.

## 5. Backend API endpoints

All versioned endpoints are under `/api/v1`.

- `GET /health` — legacy health response.
- `GET /api/v1/health` — versioned health response.
- `GET /api/v1/meetings` — paginated list with `search`, `participant`, `date_from`, `date_to`, `sort_order`, `limit`, and `offset`.
- `GET /api/v1/meetings/{meeting_id}` — meeting metadata and participants.
- `POST /api/v1/meetings` — create a meeting and reuse matching participants.
- `PATCH /api/v1/meetings/{meeting_id}` — partially update meeting fields/participants.
- `DELETE /api/v1/meetings/{meeting_id}` — delete a meeting and owned children.
- `GET/POST /api/v1/meetings/{meeting_id}/transcript` — list or create segments.
- `PATCH/DELETE /api/v1/meetings/{meeting_id}/transcript/{segment_id}` — update or delete an owned segment.
- `GET/PATCH /api/v1/meetings/{meeting_id}/summary` — read or update summary text.
- `POST /api/v1/meetings/{meeting_id}/summary/topics` — create a topic.
- `PATCH/DELETE /api/v1/meetings/{meeting_id}/summary/topics/{topic_id}` — update/delete a topic.
- `GET/POST /api/v1/meetings/{meeting_id}/action-items` — list or create action items.
- `PATCH/DELETE /api/v1/meetings/{meeting_id}/action-items/{action_item_id}` — update/delete action items, including completion state.

Transcript creation/update validates participant ownership and timestamp ranges. Summary topics enforce meeting ownership and unique positions. API schemas and service modules are separate from ORM models.

## 6. Completed phases

- Phase 1A — FastAPI backend initialization
- Phase 1B — Next.js frontend initialization
- Phase 2 — SQLite + SQLAlchemy schema
- Phase 3 — deterministic seed data
- Phase 4 — backend API foundation
- Phase 5 — Meetings CRUD API
- Phase 6 — Transcript API
- Phase 7 — Summary & Action Items API
- Phase 8 — Backend smoke testing
- Phase 9 — Frontend application shell
- Phase 10A — Meetings data fetching/list rendering
- Phase 10B — Meetings search, participant/date filtering, and sorting
- Phase 11A — Meeting Detail page
- Phase 11B — Transcript display

Recent Git milestones include the frontend shell, meetings API connection, library filters, detail page, and transcript display. Do not rewrite or reimplement those phases.

## 7. Current status and roadmap

Current status: **Phase 11B is complete. The next implementation phase is Phase 12 — Summary & Action Items frontend UI.**

Remaining work, in likely order:

- Phase 12: fetch and present summary/topics and action items in the meeting detail experience;
- media-player placeholder and transcript/media synchronization;
- transcript search and matching-text highlighting;
- meeting CRUD UI, forms/modals/toasts;
- frontend polish and any additional responsive/accessibility improvements;
- final documentation, testing, and deployment.

These items are not complete unless implemented in the repository. In particular, do not claim the backend Summary/Action Items APIs mean their frontend UI is complete.

## 8. Commands

From `backend/` with the virtual environment active:

```powershell
python -m app.db.init_db
python -m app.db.seed
python -m uvicorn app.main:app --reload
```

From `frontend/`:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

The frontend normally runs at `http://localhost:3000`; the backend at `http://127.0.0.1:8000`. PowerShell on this machine requires `npm.cmd` rather than the `npm.ps1` shim.

## 9. Continuation instructions

Before changing anything, inspect the current repository, `git log`, and this document. Treat implementation as the source of truth. Continue at Phase 12: add the frontend summary/topics and action-item experience using the existing backend endpoints, existing App Router/detail structure, and existing CSS/module conventions. Keep frontend and backend separation, API versioning, schema/service layering, deterministic seed behavior, and the current completed functionality intact. Do not implement unrelated later phases in the same task unless explicitly requested. Verify changes with the relevant frontend/backend checks, modify only files in scope, and do not commit or push unless asked.

## 10. Development rules and decisions

- Work incrementally by phase and keep tasks narrowly scoped.
- Avoid unnecessary dependencies and preserve the existing architecture.
- Keep ORM models, API schemas, services, and route handlers separated by responsibility.
- Keep transcript segments separate with numeric seconds so future search, highlighting, and synchronization remain possible.
- Real speech-to-text, authentication, uploads, and AI/LLM integration are out of scope for the current implementation.
- Use Git commits after meaningful milestones only when requested by the developer.
