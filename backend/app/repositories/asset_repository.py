from sqlalchemy import func, select

from app.models.asset import Asset
from app.repositories.base import BaseRepository


class AssetRepository(BaseRepository[Asset, None, None]):
    def __init__(self, db):
        super().__init__(Asset, db)

    async def get_by_status(self, status: str) -> list[Asset]:
        result = await self.db.execute(select(Asset).where(Asset.status == status))
        return list(result.scalars().all())

    async def count_by_status(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Asset.status, func.count(Asset.id)).group_by(Asset.status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def get_tree(self) -> list[Asset]:
        result = await self.db.execute(select(Asset).order_by(Asset.parent_id.nulls_first(), Asset.name))
        return list(result.scalars().all())
