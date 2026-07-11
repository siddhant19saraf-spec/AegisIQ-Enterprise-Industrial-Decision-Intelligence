from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog, None, None]):
    def __init__(self, db):
        super().__init__(AuditLog, db)
