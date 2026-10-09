# Fireflies Clone — Project Context

## 1. Project overview

Fireflies Clone is a split full-stack meeting intelligence application. The current repository contains a FastAPI backend with SQLite/SQLAlchemy persistence, deterministic development data, Meetings/Transcript/Summary/Action Items APIs, and a Next.js frontend through meeting CRUD UI.

The codebase—not the original assignment description—is the source of truth. Real media playback, authentication, uploads, speech-to-text, AI integration, and deployment are not complete.

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
    MeetingFormDialog.tsx           reusable native-dialog meeting create/edit form
    DeleteMeetingDialog.tsx         native-dialog cascading-delete confirmation
  lib/
    meetings.ts                    meeting types plus list and CRUD API clients
    meetingDetail.ts                single-meeting API client
    meetingInsights.ts              summary and action-items API clients
    transcripts.ts                  transcript API client
    meetingFormatters.ts            date, duration, and timestamp formatting
  meetings/[meetingId]/             dynamic detail route plus loading/error/not-found UI
```

`AppShell` provides Fireflies-style navigation labels (Meetings, Search, Settings), workspace header, notifications/profile controls, and the invite button. Meetings is a real link; Search and Settings are semantically disabled unavailable controls. The inactive workspace, invitation, notification, and profile controls are also clearly marked unavailable.

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

`MeetingList` renders title, formatted meeting date/time, formatted duration, and participant names. Each row links to `/meetings/{id}`. The library includes a New meeting control that opens the reusable create/edit form; it refreshes after a successful creation and displays accessible mutation feedback.

### Meeting Detail

`frontend/app/meetings/[meetingId]/page.tsx` is the dynamic detail route. It server-fetches the meeting through `getMeeting`, displays the meeting title, date/time, duration, participants, a back link, synchronized playback/transcript, summary, and action-items sections, and provides route-level loading, error, and not-found states. The detail response contains only meeting metadata and participants; summary, topics, action items, and transcript content are fetched separately.

`MeetingPlayback` owns shared `currentTime` and `isPlaying` state for its `MediaPlayer` and `Transcript` children. Its playback callback is stabilized with `useCallback` so player time changes do not unnecessarily restart the simulated-playback timer effect.

Meeting detail provides Edit and Delete controls. Editing updates the displayed meeting data; deletion uses a native-dialog confirmation that warns that transcript, summary, topics, and action items will also be removed, then returns successfully deleted meetings to the library.

### Meeting CRUD

`lib/meetings.ts` provides typed frontend clients for creating, updating, and deleting meetings using the existing API contracts. `MeetingFormDialog` is a reusable native-dialog form with title, date/time, duration, and dynamically addable/removable participant inputs. Client-side validation aligns with the backend: trimmed title and participant names, title/name length limits, one to fifty participants, and a non-negative integer duration. Edit requests send only changed fields; when participants change, the complete intended set is sent because the backend replaces participants. Mutation controls disable while requests are in progress and surface accessible success or error feedback. No backend, database, seed-data, or API-contract changes were made.

### Media Player Placeholder

`MediaPlayer` is a reusable controlled client component rendered through `MeetingPlayback`. It uses the meeting duration as its mock recording duration and simulates playback with a timer. It provides accessible play/pause controls, an interactive seek bar, and current/total `MM:SS` time. Playback automatically stops at the meeting duration. No real audio or video file is used.

### Transcript display

`Transcript` is a client component rendered through `MeetingPlayback`. It fetches `GET /api/v1/meetings/{meeting_id}/transcript`, supports abort-on-unmount and retry, shows loading/error/empty states, displays the segment count, and renders ordered segments with speaker, text, and `MM:SS` start timestamps. Clicking a segment seeks the shared player time to its `start_time`, including fractional seconds. Playback progression and manual player seeking update the active transcript row. Active-segment detection uses `start_time <= currentTime < end_time`; intentional gaps between segments have no active row.

Transcript search is local to the loaded segments for the current meeting. It performs case-insensitive literal-text matching, highlights every query occurrence without treating the query as a regular expression, and reports matching segments rather than individual occurrences. Previous/next controls select a matching segment and scroll it into view; no-match searches show a clear empty-results message. Clearing the search removes highlights and the selected search result. Search-selected rows are visually distinct from playback-active rows, including when both states apply. Transcript search does not provide global meeting search or editing.

### Summary and Action Items

`MeetingSummary` and `ActionItems` independently fetch the existing summary and action-items APIs through `lib/meetingInsights.ts`. The meeting detail page displays summary text and topics in the API-returned order. A summary HTTP 404 is isolated as a “No summary yet” state and does not break the detail page. Summary and action-item sections each provide loading, error/retry, and empty states. Action items display their task, optional assignee or unassigned status, and read-only Open/Completed status. No backend, database, seed-data, or API-contract changes were made.

### Frontend Shell Accessibility and Responsive Polish

Phase 17 replaced misleading `href="#"` navigation with a real Meetings link and semantically disabled Search and Settings controls. Inactive workspace, invitation, notification, and profile controls are visibly and accessibly marked unavailable. Interactive controls and meeting filters have accessible labels and visible keyboard focus styles.

The frontend now improves text wrapping, truncation, and narrow-screen usability across the meeting library, filters, detail layout, player, transcript, summaries, action items, and CRUD dialogs. Dialogs are viewport-constrained and scrollable, have larger touch targets, descriptions, and accessible error announcements.

Create, Edit, and Delete dialogs restore focus to their respective opener after close, Cancel, or Escape when that opener remains enabled and connected. Native dialog close handling distinguishes explicit user/successful-save closes from cleanup closes, preventing cleanup-triggered close events from incorrectly resetting parent state or interfering with focus restoration. CRUD, transcript search, click-to-seek, playback synchronization, summaries, and action items remain intact.

### Frontend data-fetching modules

- `lib/meetings.ts`: `Meeting`/query/response types plus `getMeetings`, `createMeeting`, `updateMeeting`, and `deleteMeeting`; maps UI filters to API query parameters and parses mutation errors.
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
- Phase 16 — Meeting CRUD UI
- Phase 17 — Frontend Shell Accessibility and Responsive Polish
- Phase 18 — Project setup and architecture documentation
- Phase 19 — Backend API test suite
- Phase 20 — Final verification and assignment audit

Recent Git milestones include the frontend shell, meetings API connection, library filters, detail page, transcript display, media player placeholder, transcript/player synchronization, transcript search/highlighting, meeting-detail summary/action-items UI, meeting CRUD UI, frontend shell accessibility/responsive polish, and project setup/architecture documentation. Backend tests and Phase 20 audit files may still be uncommitted. Do not rewrite or reimplement those phases.

## 7. Current status and roadmap

Current status: **Phase 20 — Final Verification and Assignment Audit is complete.** The local application is implemented through meeting CRUD UI, accessibility polish, documentation, and an isolated backend test suite. **Public deployment and a hosted link are not complete.** No original assignment document is present in the repository; remaining assignment work is inferred from README/ARCHITECTURE limitations and this audit.

Phase 20 verification (2026-10-09), performed without starting the dev servers, without init/seed, and without browser testing:

- Backend tests from the repository root: `backend\.venv\Scripts\python.exe -m pytest -v` — **8 passed**.
- Frontend lint from `frontend/`: `npm.cmd run lint` — **passed**.
- Frontend production build from `frontend/`: `npm.cmd run build` — **passed** (Next.js 16.4.0).
- `git diff --check` — **passed** (CRLF checkout warnings only).
- Tests use an isolated `tmp_path` SQLite file, assert they do not use `backend/data/fireflies_clone.db`, and enable `PRAGMA foreign_keys=ON`.
- Starlette 1.7 `TestClient` requires `httpx2` (not `httpx`); `backend/requirements.txt` lists `pytest` and `httpx2`.
- Frontend API base URL order is `NEXT_PUBLIC_BACKEND_API_URL` → `BACKEND_API_URL` → `http://127.0.0.1:8000` in the meetings, detail, transcript, and insights clients.
- Backend CORS default is `http://localhost:3000` via `CORS_ORIGINS`. That matches the documented frontend origin. Opening the UI as `http://127.0.0.1:3000` would not match the default CORS origin.
- Code review confirmed the implemented feature surfaces: library search/filter/sort, meeting detail, simulated playback with `start_time <= currentTime < end_time` active-segment sync, local transcript search, read-only summary/topics and action items, and create/edit/delete. This phase did not repeat manual browser testing.
- No Dockerfile, hosting config, or deployed URL exists in the repository.

Remaining work:

- public deployment configuration, deployment instructions, and a hosted link.

Phase 13 remains intact in code: clicking a transcript row seeks the simulated player, and the active transcript row follows playback and manual seeking. Transcript search/highlighting, summary, action-item, and CRUD features remain intact. Real media playback, authentication, uploads, speech-to-text, and AI/LLM integration remain out of scope.

## 8. Commands

From `backend/` with the virtual environment active:

```powershell
python -m app.db.init_db
python -m app.db.seed
python -m uvicorn app.main:app --reload
```

Backend tests from the repository root (does not use the development database):

```powershell
backend\.venv\Scripts\python.exe -m pytest -v
```

From `frontend/`:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

The frontend normally runs at `http://localhost:3000`; the backend at `http://127.0.0.1:8000`. PowerShell on this machine requires `npm.cmd` rather than the `npm.ps1` shim.

## 9. Continuation instructions

Before changing anything, inspect the current repository, `git log`, and this document. Treat implementation as the source of truth. Continue after Phase 20 with public deployment and a hosted link unless a different task is requested. Do not claim the project is deployed until a live URL exists. Preserve the current separation: `MeetingPlayback` owns shared simulated playback state, `MediaPlayer` is controlled by that state, and no real media integration exists. Preserve the active-segment rule (`start_time <= currentTime < end_time`), including the intentional inactive gaps between segments; local literal-text transcript search/highlighting; read-only summary/action-items sections with independent fetch states; the meeting CRUD dialog and feedback flows; and dialog focus restoration. Keep frontend and backend separation, API versioning, schema/service layering, deterministic seed behavior, and the current completed functionality intact. Verify changes with the relevant frontend/backend checks, modify only files in scope, and do not commit or push unless asked.

## 10. Development rules and decisions

- Work incrementally by phase and keep tasks narrowly scoped.
- Avoid unnecessary dependencies and preserve the existing architecture.
- Keep ORM models, API schemas, services, and route handlers separated by responsibility.
- Keep transcript segments separate with numeric seconds so future search, highlighting, and synchronization remain possible.
- Real speech-to-text, authentication, uploads, and AI/LLM integration are out of scope for the current implementation.
- Use Git commits after meaningful milestones only when requested by the developer.
