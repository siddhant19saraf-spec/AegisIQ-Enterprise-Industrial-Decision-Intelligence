from fastapi import APIRouter

from app.api.v1.endpoints import (
    assets,
    audit_logs,
    auth,
    dashboard,
    health,
    incidents,
    notifications,
    reports,
    risk,
)

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(health.router)
v1_router.include_router(auth.router)
v1_router.include_router(dashboard.router)
v1_router.include_router(assets.router)
v1_router.include_router(incidents.router)
v1_router.include_router(notifications.router)
v1_router.include_router(reports.router)
v1_router.include_router(audit_logs.router)
v1_router.include_router(risk.router)
