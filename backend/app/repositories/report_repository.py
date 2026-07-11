from app.models.report import Report
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[Report, None, None]):
    def __init__(self, db):
        super().__init__(Report, db)
