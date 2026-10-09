# Fireflies Clone — Project Context

## 1. Project overview

Fireflies Clone is a split full-stack meeting intelligence application. The current repository contains a FastAPI backend with SQLite/SQLAlchemy persistence, deterministic development data, Meetings/Transcript/Summary/Action Items APIs, and a Next.js frontend through meeting-detail summary and action-items UI.

The codebase—not the original assignment description—is the source of truth. Real media playback, meeting CRUD UI, authentication, uploads, speech-to-text, AI integration, and deployment are not complete.

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
    MeetingDetail.tsx               meeting metadata, playback/transcript, summary, and action-items sections
    MeetingPlayback.tsx             shared playback state for the player and transcript
    MediaPlayer.tsx                 controlled simulated meeting-duration-driven playback controls
    Transcript.tsx                  client-side transcript loading, search, highlighting, and active segment state
    MeetingSummary.tsx              client-side summary and topic loading/display
    ActionItems.tsx                 client-side action-item loading/display
  lib/
    meetings.ts                    meeting types and list API client
    meetingDetail.ts                single-meeting API client
    meetingInsights.ts              summary and action-items API clients
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

`frontend/app/meetings/[meetingId]/page.tsx` is the dynamic detail route. It server-fetches the meeting through `getMeeting`, displays the meeting title, date/time, duration, participants, a back link, synchronized playback/transcript, summary, and action-items sections, and provides route-level loading, error, and not-found states. The detail response contains only meeting metadata and participants; summary, topics, action items, and transcript content are fetched separately.

`MeetingPlayback` owns shared `currentTime` and `isPlaying` state for its `MediaPlayer` and `Transcript` children. Its playback callback is stabilized with `useCallback` so player time changes do not unnecessarily restart the simulated-playback timer effect.

### Media Player Placeholder

`MediaPlayer` is a reusable controlled client component rendered through `MeetingPlayback`. It uses the meeting duration as its mock recording duration and simulates playback with a timer. It provides accessible play/pause controls, an interactive seek bar, and current/total `MM:SS` time. Playback automatically stops at the meeting duration. No real audio or video file is used.

### Transcript display

`Transcript` is a client component rendered through `MeetingPlayback`. It fetches `GET /api/v1/meetings/{meeting_id}/transcript`, supports abort-on-unmount and retry, shows loading/error/empty states, displays the segment count, and renders ordered segments with speaker, text, and `MM:SS` start timestamps. Clicking a segment seeks the shared player time to its `start_time`, including fractional seconds. Playback progression and manual player seeking update the active transcript row. Active-segment detection uses `start_time <= currentTime < end_time`; intentional gaps between segments have no active row.

Transcript search is local to the loaded segments for the current meeting. It performs case-insensitive literal-text matching, highlights every query occurrence without treating the query as a regular expression, and reports matching segments rather than individual occurrences. Previous/next controls select a matching segment and scroll it into view; no-match searches show a clear empty-results message. Clearing the search removes highlights and the selected search result. Search-selected rows are visually distinct from playback-active rows, including when both states apply. Transcript search does not provide global meeting search or editing.

### Summary and Action Items

`MeetingSummary` and `ActionItems` independently fetch the existing summary and action-items APIs through `lib/meetingInsights.ts`. The meeting detail page displays summary text and topics in the API-returned order. A summary HTTP 404 is isolated as a “No summary yet” state and does not break the detail page. Summary and action-item sections each provide loading, error/retry, and empty states. Action items display their task, optional assignee or unassigned status, and read-only Open/Completed status. No backend, database, seed-data, or API-contract changes were made.

### Frontend data-fetching modules

- `lib/meetings.ts`: `Meeting`/query/response types and `getMeetings`; maps UI filters to API query parameters.
- `lib/meetingDetail.ts`: `getMeeting`; maps 404 to `null`.
- `lib/meetingInsights.ts`: `getMeetingSummary` and `getActionItems`; maps a missing summary (404) to `null`.
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

- Phase 12 — Media Player Placeholder
- Phase 13 — Transcript ↔ Player Synchronization
- Phase 14 — Transcript Search & Highlighting
- Phase 15 — Meeting Detail Summary & Action Items UI

Recent Git milestones include the frontend shell, meetings API connection, library filters, detail page, transcript display, media player placeholder, transcript/player synchronization, transcript search/highlighting, and meeting-detail summary/action-items UI. Do not rewrite or reimplement those phases.

## 7. Current status and roadmap

Current status: **Phase 15 — Meeting Detail Summary & Action Items UI is complete.**

Phase 13 remains intact: clicking a transcript row seeks the simulated player, and the active transcript row follows playback and manual seeking. Phase 14 transcript search/highlighting remains intact. Phase 15 was manually tested alongside the existing functionality. Frontend lint (`npm.cmd run lint`), the production build (`npm.cmd run build`), and `git diff --check` passed.

Remaining work, in likely order:

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

Before changing anything, inspect the current repository, `git log`, and this document. Treat implementation as the source of truth. Continue after Phase 15, beginning with meeting CRUD UI, forms, modals, and toasts unless a different task is requested. Preserve the current separation: `MeetingPlayback` owns shared simulated playback state, `MediaPlayer` is controlled by that state, and no real media integration exists. Preserve the active-segment rule (`start_time <= currentTime < end_time`), including the intentional inactive gaps between segments; local literal-text transcript search/highlighting; and the read-only summary/action-items sections with independent fetch states. Keep frontend and backend separation, API versioning, schema/service layering, deterministic seed behavior, and the current completed functionality intact. Verify changes with the relevant frontend/backend checks, modify only files in scope, and do not commit or push unless asked.

## 10. Development rules and decisions

- Work incrementally by phase and keep tasks narrowly scoped.
- Avoid unnecessary dependencies and preserve the existing architecture.
- Keep ORM models, API schemas, services, and route handlers separated by responsibility.
- Keep transcript segments separate with numeric seconds so future search, highlighting, and synchronization remain possible.
- Real speech-to-text, authentication, uploads, and AI/LLM integration are out of scope for the current implementation.
- Use Git commits after meaningful milestones only when requested by the developer.
