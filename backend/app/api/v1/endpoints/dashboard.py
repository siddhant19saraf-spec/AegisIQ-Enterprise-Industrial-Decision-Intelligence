from fastapi import APIRouter, Depends

from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(svc: DashboardService = Depends()):
    return await svc.get_summary()
