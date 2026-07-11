from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.report_repository import ReportRepository
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate


class ReportService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.repo = ReportRepository(db)

    async def create(self, schema: ReportCreate) -> ReportResponse:
        instance = await self.repo.create(schema)
        return ReportResponse.model_validate(instance)

    async def get(self, id: UUID) -> ReportResponse | None:
        instance = await self.repo.get(id)
        return ReportResponse.model_validate(instance) if instance else None

    async def list(
        self, params: PaginationParams, search: str | None = None
    ) -> PaginatedResponse[ReportResponse]:
        items, total = await self.repo.list(
            skip=(params.page - 1) * params.page_size,
            limit=params.page_size,
            sort_by=params.sort_by or "created_at",
            sort_order=params.sort_order,
            search=search,
            search_fields=["name", "type"],
        )
        return PaginatedResponse.build(
            items=[ReportResponse.model_validate(i) for i in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def update(self, id: UUID, schema: ReportUpdate) -> ReportResponse | None:
        instance = await self.repo.update(id, schema)
        return ReportResponse.model_validate(instance) if instance else None

    async def delete(self, id: UUID) -> bool:
        return await self.repo.delete(id)
