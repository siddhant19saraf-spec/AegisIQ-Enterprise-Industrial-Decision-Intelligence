from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.notification_repository import NotificationRepository
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.notification import NotificationCreate, NotificationResponse


class NotificationService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.repo = NotificationRepository(db)

    async def create(self, schema: NotificationCreate) -> NotificationResponse:
        instance = await self.repo.create(schema)
        return NotificationResponse.model_validate(instance)

    async def list(
        self, params: PaginationParams, user_id: UUID | None = None
    ) -> PaginatedResponse[NotificationResponse]:
        filters = {"user_id": user_id} if user_id else None
        items, total = await self.repo.list(
            skip=(params.page - 1) * params.page_size,
            limit=params.page_size,
            sort_by=params.sort_by or "created_at",
            sort_order=params.sort_order,
            filters=filters,
        )
        return PaginatedResponse.build(
            items=[NotificationResponse.model_validate(i) for i in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def get_unread_count(self, user_id: UUID) -> int:
        return await self.repo.get_unread_count(user_id)

    async def mark_read(self, notification_id: UUID) -> None:
        await self.repo.mark_read(notification_id)

    async def mark_all_read(self, user_id: UUID) -> None:
        await self.repo.mark_all_read(user_id)
