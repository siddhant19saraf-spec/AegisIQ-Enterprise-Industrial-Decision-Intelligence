# AegisIQ

Enterprise Industrial Decision Intelligence Platform

## Capabilities

- **Industrial Asset Management** — Hierarchy, lifecycle, real-time status
- **Incident Management** — Tracking, investigation, resolution workflows
- **Executive Dashboard** — KPIs, trends, real-time monitoring
- **Digital Twin** — Live asset visualization and simulation
- **AI Copilot** — Natural language query interface
- **Computer Vision** — Image/video analysis for safety and inspection
- **Knowledge Graph** — Neo4j-powered relationship exploration
- **RAG** — Context-aware question answering over technical docs
- **Explainable AI** — Prediction and recommendation explanations
- **Predictive Analytics** — Forecasting and anomaly detection
- **Reporting** — Scheduled and on-demand report generation
- **Notifications** — Real-time alerts via WebSocket
- **RBAC** — Role-based access control

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2, Alembic |
| Databases | PostgreSQL, Neo4j, Qdrant, Redis |
| Infrastructure | Docker, Docker Compose, GitHub Actions |

## Quick Start

```bash
# Infrastructure
docker compose up -d postgres neo4j qdrant redis

# Backend
cd backend && pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Developer Guide](docs/development.md)
