from sqlalchemy import func, select, update

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification, None, None]):
    def __init__(self, db):
        super().__init__(Notification, db)

    async def get_unread_count(self, user_id) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.read.is_(False)
            )
        )
        return result.scalar() or 0

    async def mark_read(self, notification_id: str) -> None:
        await self.db.execute(
            update(Notification).where(Notification.id == notification_id).values(read=True)
        )
        await self.db.flush()

    async def mark_all_read(self, user_id) -> None:
        await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read.is_(False))
            .values(read=True)
        )
        await self.db.flush()
