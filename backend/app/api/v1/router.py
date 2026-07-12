from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    assets,
    audit_logs,
    auth,
    copilot,
    dashboard,
    decisions,
    digital_twin,
    emergency,
    health,
    incidents,
    knowledge_graph,
    notifications,
    rag_enterprise,
    reports,
    risk,
    risk_predictive,
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
v1_router.include_router(risk_predictive.router)
v1_router.include_router(copilot.router)
v1_router.include_router(decisions.router)
v1_router.include_router(knowledge_graph.router)
v1_router.include_router(rag_enterprise.router)
v1_router.include_router(digital_twin.router)
v1_router.include_router(analytics.router)
v1_router.include_router(emergency.router)
