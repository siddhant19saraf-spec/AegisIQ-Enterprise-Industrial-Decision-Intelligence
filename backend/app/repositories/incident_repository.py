from sqlalchemy import func, select

from app.models.incident import Incident, IncidentUpdate
from app.repositories.base import BaseRepository


class IncidentRepository(BaseRepository[Incident, None, None]):
    def __init__(self, db):
        super().__init__(Incident, db)

    async def get_by_asset(self, asset_id) -> list[Incident]:
        result = await self.db.execute(
            select(Incident).where(Incident.asset_id == asset_id).order_by(Incident.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_by_severity(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Incident.severity, func.count(Incident.id)).group_by(Incident.severity)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_by_status(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Incident.status, func.count(Incident.id)).group_by(Incident.status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_active(self) -> int:
        result = await self.db.execute(
            select(func.count(Incident.id)).where(Incident.status.in_(["open", "investigating"]))
        )
        return result.scalar() or 0

    async def count_today(self) -> int:
        result = await self.db.execute(
            select(func.count(Incident.id)).where(
                func.date(Incident.created_at) == func.current_date()
            )
        )
        return result.scalar() or 0


class IncidentUpdateRepository(BaseRepository[IncidentUpdate, None, None]):
    def __init__(self, db):
        super().__init__(IncidentUpdate, db)

    async def get_by_incident(self, incident_id) -> list[IncidentUpdate]:
        result = await self.db.execute(
            select(IncidentUpdate)
            .where(IncidentUpdate.incident_id == incident_id)
            .order_by(IncidentUpdate.created_at.asc())
        )
        return list(result.scalars().all())
