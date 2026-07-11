from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.asset_repository import AssetRepository
from app.repositories.incident_repository import IncidentRepository


class RiskService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.asset_repo = AssetRepository(db)
        self.incident_repo = IncidentRepository(db)

    async def calculate_asset_risk(self, asset_id: UUID) -> float:
        asset = await self.asset_repo.get(asset_id)
        if not asset:
            return 0.0
        incidents = await self.incident_repo.get_by_asset(asset_id)
        if not incidents:
            return 0.1
        severity_weights = {"critical": 1.0, "high": 0.7, "medium": 0.4, "low": 0.2}
        scores = [severity_weights.get(i.severity, 0.3) for i in incidents]
        return round(sum(scores) / len(scores), 2)
