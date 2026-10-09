# Fireflies Clone — Meeting Notes & Transcription Platform

A full-stack meeting intelligence application inspired by Fireflies.ai. Browse meetings, search transcripts, synchronize transcript navigation with simulated playback, review meeting summaries and topics, and manage meetings and action items.

**Live Demo:** [Fireflies Clone](https://fireflies-clone-orcin.vercel.app/)
**Backend API:** [API Base URL](https://fireflies-clone-api-trco.onrender.com/api/v1)
**GitHub Repository:** [fireflies-clone](https://github.com/Prabhsimar2104/fireflies-clone)

## Features

### Meetings Library
- Browse meetings with titles, dates, durations, and participants.
- Search meetings by title and filter by participant or date.
- Sort meetings by recency.
- Create, edit, and delete meetings.
- Handle loading, error, and empty states.

### Meeting Details and Transcripts
- View meeting metadata and participants.
- Browse transcript segments with speaker labels and timestamps.
- Search transcript text and navigate between matching results.
- Select a transcript segment to seek simulated playback to its timestamp.
- Highlight the active transcript segment as simulated playback advances.

### Summaries and Action Items
- View seeded meeting summaries and ordered topics.
- Create, edit, complete, reopen, and delete action items.
- Assign an optional participant to an action item.

### Backend and Persistence
- Versioned REST API built with FastAPI.
- SQLite persistence through SQLAlchemy.
- Pydantic request and response validation.
- Relational schema with foreign-key constraints and cascading deletion.
- Deterministic sample meetings, transcripts, summaries, topics, and action items.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | CSS Modules |
| Backend | Python, FastAPI, Pydantic |
| ORM | SQLAlchemy |
| Database | SQLite |
| Testing | pytest, FastAPI/Starlette test client |

## Architecture Overview

The frontend and backend are separate applications.

```text
Browser
   |
   v
Next.js + React + TypeScript
   |
   v
Typed frontend API clients
   |
   v
FastAPI routers (/api/v1)
   |
   v
Pydantic validation
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

The frontend renders the meeting library and meeting detail pages. Its API client modules communicate with the backend over HTTP.

The FastAPI application routes requests to the appropriate endpoint. Pydantic schemas validate request data, service modules implement application operations, and SQLAlchemy persists the resulting changes in SQLite.

See [ARCHITECTURE.md](ARCHITECTURE.md) for further implementation details.

## Database Schema

The database contains seven tables.

| Table | Purpose |
|---|---|
| `meetings` | Meeting title, date, duration, and timestamps |
| `participants` | Unique participant records |
| `meeting_participants` | Join table connecting meetings and participants |
| `transcript_segments` | Transcript text, speaker, and start/end timestamps |
| `summaries` | Summary text associated with a meeting |
| `summary_topics` | Ordered topics associated with a meeting summary |
| `action_items` | Tasks, optional assignees, completion state, and timestamps |

### Relationships

- A meeting can have multiple participants, and a participant can attend multiple meetings through `meeting_participants`.
- A meeting has many transcript segments.
- A meeting has one summary.
- A meeting summary has ordered topics.
- A meeting has many action items.
- Deleting a meeting cascades to its meeting-owned transcript segments, summary, summary topics, and action items.
- SQLite foreign-key enforcement is enabled for SQLAlchemy connections.

The schema is implemented in `backend/app/db/models.py`.

## Prerequisites

- Python 3.14, matching the development environment used for this project.
- Node.js and npm.
- Windows PowerShell for the commands below.

## Run Locally

Clone the repository and open its directory:

```powershell
git clone https://github.com/Prabhsimar2104/fireflies-clone.git
cd fireflies-clone
```

Use two PowerShell terminals.

### 1. Start the backend

In the first terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m app.db.init_db
python -m app.db.seed
python -m uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

**Warning:** `python -m app.db.seed` deletes and rebuilds the existing application records. Run it only when initializing or intentionally resetting local demo data. Do not run it against data you want to preserve.

### 2. Start the frontend

In the second terminal, from the repository root:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

The frontend runs at `http://localhost:3000`.

On the Windows development environment used for this project, `npm.cmd` avoids PowerShell's `npm.ps1` execution-policy issue.

## Environment Variables

Example configuration files are provided in `backend/.env.example` and `frontend/.env.example`.

| Variable | Application | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | Overrides the database connection URL |
| `CORS_ORIGINS` | Backend | Comma-separated allowed frontend origins |
| `NEXT_PUBLIC_BACKEND_API_URL` | Frontend | Preferred backend API base URL |
| `BACKEND_API_URL` | Frontend | Fallback API base URL |

The frontend resolves the backend URL in this order:

1. `NEXT_PUBLIC_BACKEND_API_URL`
2. `BACKEND_API_URL`
3. `http://127.0.0.1:8000`

For local development, the backend's default CORS origin is `http://localhost:3000`. The configured origin must match the frontend's browser origin.

## Seed Data

The deterministic development dataset contains:

- 5 meetings
- 8 participants
- 22 meeting-participant links
- 75 transcript segments
- 5 summaries
- 15 summary topics
- 15 action items

The seed script replaces the current application records with this dataset. Database initialization alone creates missing tables without intentionally resetting existing application records.

## API Overview

All versioned application endpoints use the `/api/v1` prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Versioned API health check |
| `GET` | `/meetings` | List, search, filter, sort, and paginate meetings |
| `GET` | `/meetings/{meeting_id}` | Retrieve a meeting |
| `POST` | `/meetings` | Create a meeting |
| `PATCH` | `/meetings/{meeting_id}` | Update meeting metadata |
| `DELETE` | `/meetings/{meeting_id}` | Delete a meeting and its owned data |
| `GET` | `/meetings/{meeting_id}/transcript` | List transcript segments |
| `POST` | `/meetings/{meeting_id}/transcript` | Create a transcript segment |
| `PATCH` | `/meetings/{meeting_id}/transcript/{segment_id}` | Update a transcript segment |
| `DELETE` | `/meetings/{meeting_id}/transcript/{segment_id}` | Delete a transcript segment |
| `GET` | `/meetings/{meeting_id}/summary` | Retrieve a meeting summary and topics |
| `PATCH` | `/meetings/{meeting_id}/summary` | Update a meeting summary |
| `POST` | `/meetings/{meeting_id}/summary/topics` | Create a summary topic |
| `PATCH` | `/meetings/{meeting_id}/summary/topics/{topic_id}` | Update a summary topic |
| `DELETE` | `/meetings/{meeting_id}/summary/topics/{topic_id}` | Delete a summary topic |
| `GET` | `/meetings/{meeting_id}/action-items` | List action items |
| `POST` | `/meetings/{meeting_id}/action-items` | Create an action item |
| `PATCH` | `/meetings/{meeting_id}/action-items/{action_item_id}` | Update an action item |
| `DELETE` | `/meetings/{meeting_id}/action-items/{action_item_id}` | Delete an action item |

The backend also exposes `GET /health` outside the versioned API prefix.

### Interactive API Documentation

With the backend running locally:

- Health: `http://127.0.0.1:8000/health`
- Versioned health: `http://127.0.0.1:8000/api/v1/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`

## Tests and Quality Checks

Run backend tests from the repository root:

```powershell
backend\.venv\Scripts\python.exe -m pytest -v
```

Run frontend checks from `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run build
```

To serve the production frontend build locally after building:

```powershell
npm.cmd run start
```

The backend tests use temporary SQLite databases rather than the local development database.

## Deployment

- **Frontend:** [https://fireflies-clone-orcin.vercel.app/](https://fireflies-clone-orcin.vercel.app/)
- **Backend API:** [https://fireflies-clone-api-trco.onrender.com/api/v1](https://fireflies-clone-api-trco.onrender.com/api/v1)
- **Backend health check:** [https://fireflies-clone-api-trco.onrender.com/api/v1/health](https://fireflies-clone-api-trco.onrender.com/api/v1/health)

The deployed frontend uses `NEXT_PUBLIC_BACKEND_API_URL` to reach the deployed backend. The backend's `CORS_ORIGINS` configuration must include the deployed frontend origin.

**Hosted database limitation:** The demo uses SQLite on Render's ephemeral filesystem. Data changes may be lost when the instance restarts, is replaced, or is redeployed. This deployment is intended as a demonstration, not durable production storage.

## Assumptions and Limitations

- The application uses seeded demo meetings and mock meeting insights.
- Playback is simulated using the meeting duration; no real audio or video is played.
- There is no real-time speech-to-text, audio transcription pipeline, or LLM-powered summary generation.
- Audio/video uploads are not implemented.
- Real user authentication, workspace switching, team collaboration, and integrations are not implemented.
- Search and Settings navigation destinations are placeholders rather than complete application pages.
- The application focuses on post-meeting browsing, transcript interaction, summaries, and task management.

Real-time meeting bots, transcription, and integrations are outside the implemented scope of this demo.

## Additional Documentation

- [Architecture](ARCHITECTURE.md)
- [Backend setup and operations](backend/README.md)
- [Frontend setup and configuration](frontend/README.md)
- [Project continuation context](PROJECT_CONTEXT.md)
