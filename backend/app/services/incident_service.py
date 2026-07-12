from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.incident_repository import (
    IncidentRepository,
    IncidentUpdateRepository,
)
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentUpdate,
    IncidentUpdateCreate,
    IncidentUpdateResponse,
)


class IncidentService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.repo = IncidentRepository(db)
        self.update_repo = IncidentUpdateRepository(db)

    async def create(self, schema: IncidentCreate) -> IncidentResponse:
        instance = await self.repo.create(schema)
        return IncidentResponse.model_validate(instance)

    async def get(self, id: UUID) -> IncidentResponse | None:
        instance = await self.repo.get(id)
        return IncidentResponse.model_validate(instance) if instance else None

    async def list(
        self, params: PaginationParams, search: str | None = None, filters: dict | None = None
    ) -> PaginatedResponse[IncidentResponse]:
        items, total = await self.repo.list(
            skip=(params.page - 1) * params.page_size,
            limit=params.page_size,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
            filters=filters,
            search=search,
            search_fields=["title", "description"],
        )
        return PaginatedResponse.build(
            items=[IncidentResponse.model_validate(i) for i in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def update(self, id: UUID, schema: IncidentUpdate) -> IncidentResponse | None:
        instance = await self.repo.update(id, schema)
        return IncidentResponse.model_validate(instance) if instance else None

    async def delete(self, id: UUID) -> bool:
        return await self.repo.delete(id)

    async def add_update(self, incident_id: UUID, schema: IncidentUpdateCreate) -> IncidentUpdateResponse:
        instance = self.update_repo.model(incident_id=incident_id, **schema.model_dump())
        self.update_repo.db.add(instance)
        await self.update_repo.db.flush()
        await self.update_repo.db.refresh(instance)
        return IncidentUpdateResponse.model_validate(instance)
