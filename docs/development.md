# AegisIQ Developer Guide

## Project Structure

```
aegisiq/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Endpoints
│   │   ├── core/     # Config, security, middleware
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic v2 schemas
│   │   ├── services/ # Business logic
│   │   └── repositories/ # Data access
│   ├── alembic/      # Database migrations
│   └── tests/
├── frontend/         # Next.js application
│   ├── src/
│   │   ├── app/      # Pages and layouts
│   │   ├── components/ # UI components
│   │   ├── features/ # Feature modules
│   │   ├── lib/      # Utilities
│   │   ├── hooks/    # Shared hooks
│   │   └── types/    # TypeScript types
│   └── tests/
├── docker/           # Infrastructure config
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Conventions

- **Python**: Follow PEP 8, use type hints, prefer async
- **TypeScript**: Strict mode, no `any`, named exports
- **CSS**: Tailwind utility classes, CSS variables for theming
- **Components**: Feature-co-located, shared in `components/ui/`
- **API**: RESTful, versioned (`/api/v1/`), snake_case JSON
- **Migrations**: Always create with Alembic before pushing schema changes

## Commands

```bash
# Backend
cd backend
ruff check .           # Lint
pytest -v              # Test
alembic upgrade head   # Migrate
alembic revision --autogenerate -m "description"

# Frontend
cd frontend
npm run dev            # Dev server
npm run build          # Production build
npm run typecheck      # TypeScript check
npm run lint           # ESLint
```

## Adding a New Feature

1. Create backend model in `app/models/`
2. Create Pydantic schema in `app/schemas/`
3. Create repository in `app/repositories/`
4. Create service in `app/services/`
5. Create endpoint in `app/api/v1/endpoints/`
6. Register router in `app/api/v1/router.py`
7. Create Alembic migration
8. Create frontend feature module in `src/features/`
9. Add page in `src/app/`
