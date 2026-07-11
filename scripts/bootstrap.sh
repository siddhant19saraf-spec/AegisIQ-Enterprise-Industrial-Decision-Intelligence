#!/bin/bash
set -euo pipefail

echo "=== AegisIQ Bootstrap ==="

# Start infrastructure
echo "Starting infrastructure services..."
docker compose up -d postgres neo4j qdrant redis

# Wait for healthy
echo "Waiting for PostgreSQL..."
until docker compose exec postgres pg_isready -U aegisiq &>/dev/null; do sleep 2; done

# Backend setup
echo "Setting up backend..."
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "=== Bootstrap complete ==="
echo "Run: cd backend && uvicorn app.main:app --reload"
echo "Run: cd frontend && npm run dev"
