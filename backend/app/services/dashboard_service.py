from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.asset_repository import AssetRepository
from app.repositories.incident_repository import IncidentRepository
from app.repositories.report_repository import ReportRepository
from app.schemas.dashboard import DashboardSummary


class DashboardService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.asset_repo = AssetRepository(db)
        self.incident_repo = IncidentRepository(db)
        self.report_repo = ReportRepository(db)

    async def get_summary(self) -> DashboardSummary:
        asset_statuses = await self.asset_repo.count_by_status()
        incident_severities = await self.incident_repo.count_by_severity()
        active_incidents = await self.incident_repo.count_active()
        incidents_today = await self.incident_repo.count_today()
        _, total_assets = await self.asset_repo.list(limit=0)
        _, open_reports = await self.report_repo.list(limit=0)

        total_assets_val = total_assets or 0
        critical = asset_statuses.get("critical", 0)
        operational = asset_statuses.get("operational", 0)
        uptime = (operational / total_assets_val * 100) if total_assets_val > 0 else 100.0

        return DashboardSummary(
            total_assets=total_assets_val,
            active_incidents=active_incidents,
            critical_assets=critical,
            open_reports=open_reports or 0,
            uptime_rate=round(uptime, 1),
            incidents_today=incidents_today,
            assets_by_status=asset_statuses,
            incidents_by_severity=incident_severities,
        )
