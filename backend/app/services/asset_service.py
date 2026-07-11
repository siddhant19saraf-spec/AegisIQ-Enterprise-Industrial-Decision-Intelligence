from __future__ import annotations
from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.asset_repository import AssetRepository
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.schemas.common import PaginatedResponse, PaginationParams


class AssetService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.repo = AssetRepository(db)

    async def create(self, schema: AssetCreate) -> AssetResponse:
        instance = await self.repo.create(schema)
        return AssetResponse.model_validate(instance)

    async def get(self, id: UUID) -> AssetResponse | None:
        instance = await self.repo.get(id)
        return AssetResponse.model_validate(instance) if instance else None

    async def list(
        self, params: PaginationParams, search: str | None = None, filters: dict | None = None
    ) -> PaginatedResponse[AssetResponse]:
        items, total = await self.repo.list(
            skip=(params.page - 1) * params.page_size,
            limit=params.page_size,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
            filters=filters,
            search=search,
            search_fields=["name", "type", "location", "description"],
        )
        return PaginatedResponse.build(
            items=[AssetResponse.model_validate(i) for i in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def update(self, id: UUID, schema: AssetUpdate) -> AssetResponse | None:
        instance = await self.repo.update(id, schema)
        return AssetResponse.model_validate(instance) if instance else None

    async def delete(self, id: UUID) -> bool:
        return await self.repo.delete(id)

    async def get_tree(self) -> list[dict]:
        items = await self.repo.get_tree()
        return [AssetResponse.model_validate(i).model_dump() for i in items]
