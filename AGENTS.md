# AegisIQ — Agent Instructions

## Build & Test Commands

### Backend
- Lint: `cd backend && ruff check .`
- Test: `cd backend && pytest -v`
- Single test: `cd backend && pytest tests/test_health.py -v`
- Migrate: `cd backend && alembic upgrade head`
- New migration: `cd backend && alembic revision --autogenerate -m "description"`

### Frontend
- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Typecheck: `cd frontend && npm run typecheck`
- Lint: `cd frontend && npm run lint`

## Project Conventions

- Python: async-first, type hints everywhere, snake_case
- TypeScript: strict mode, named exports, PascalCase components
- CSS: Tailwind utility classes, CSS variables for theme
- Backend models: SQLAlchemy ORM in `backend/app/models/`
- Pydantic schemas: `backend/app/schemas/` — one file per domain
- API endpoints: `backend/app/api/v1/endpoints/` — one file per resource
- Repositories: Generic CRUD in `base.py`, extend per entity
- Frontend features: self-contained in `src/features/<name>/`
- Never duplicate logic; extract to shared module on first reuse
