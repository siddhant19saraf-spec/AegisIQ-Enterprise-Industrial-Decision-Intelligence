from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse, PaginationParams


class AuditLogService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.repo = AuditLogRepository(db)

    async def list(
        self, params: PaginationParams, filters: dict | None = None
    ) -> PaginatedResponse[AuditLogResponse]:
        items, total = await self.repo.list(
            skip=(params.page - 1) * params.page_size,
            limit=params.page_size,
            sort_by=params.sort_by or "created_at",
            sort_order=params.sort_order,
            filters=filters,
        )
        return PaginatedResponse.build(
            items=[AuditLogResponse.model_validate(i) for i in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )
