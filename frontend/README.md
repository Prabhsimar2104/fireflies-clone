# Fireflies Clone Frontend

The frontend is a Next.js 16 App Router application for the Fireflies Clone meeting workspace. It requires the FastAPI backend to serve meeting, transcript, summary, and action-item data.

## Setup

From the `frontend/` directory in Windows PowerShell:

```powershell
npm.cmd ci
```

## Configuration

Copy `.env.example` to `.env.local` only when the backend is not running at its default address:

```powershell
Copy-Item .env.example .env.local
```

The API base URL is resolved in this order:

```text
NEXT_PUBLIC_BACKEND_API_URL -> BACKEND_API_URL -> http://127.0.0.1:8000
```

`NEXT_PUBLIC_BACKEND_API_URL` is the first-choice frontend API URL. `BACKEND_API_URL` is the fallback when it is unset. See [.env.example](.env.example) for the supported variable.

The backend must allow the frontend origin through its `CORS_ORIGINS` setting; its local default is `http://localhost:3000`.

## Commands

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

- `dev` starts the development server at `http://localhost:3000`.
- `lint` runs ESLint.
- `build` creates an optimized production build.
- `start` serves the production build and should be run after `build`.

Use `npm.cmd` in PowerShell on this project’s development machine instead of the `npm.ps1` shim.

## Backend dependency

Start and seed the backend before using the frontend. See [../backend/README.md](../backend/README.md) for the Python environment, database initialization, destructive seed reset, and server commands.

The default backend address is `http://127.0.0.1:8000`; the interactive API documentation is available at `http://127.0.0.1:8000/docs` while it is running.
