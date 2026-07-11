# AegisIQ Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Python 3.12+
- Node.js 22+

## Development

```bash
# 1. Start infrastructure
docker compose up -d postgres neo4j qdrant redis

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend
cd frontend
npm install
npm run dev
```

## Production

```bash
# Full stack with Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `SECRET_KEY` — Random 32+ char string (required)
- `POSTGRES_*` — Database credentials
- `NEO4J_*` — Graph database credentials
- `REDIS_URL` — Redis connection string
- `QDRANT_*` — Vector store connection
