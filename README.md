# Engineering Validation Platform (MVP)

A full-stack starter for an intelligent compliance and manufacturing validation platform.

## What is included

- FastAPI backend for design validation findings
- Next.js frontend dashboard for findings, risk score, and recommendations
- Docker Compose one-command local launch
- API-first structure ready for CAD parsers, rules engines, and simulation services

## Quick start (Docker)

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## Quick start (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Core endpoints

- `GET /health`
- `POST /api/v1/validate-design`
- `GET /api/v1/standards`
- `GET /api/v1/design-sources`
- `POST /api/v1/suggest-process`
- `POST /api/v1/compare-measurements`

## Next build milestones

- Add CAD parsers for STEP/IGES/DXF
- Add standards-as-code rule packs (ISO/ASTM/ANSI/OSHA/CE)
- Integrate simulation runners for stress/thermal/load scenarios
- Add collaboration workflows and approvals
