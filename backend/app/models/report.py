from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.types import JSONType
from app.models.base import Base, TimestampMixin, UUIDMixin


class Report(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reports"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    params: Mapped[dict] = mapped_column(JSONType, nullable=False, default=dict)
    created_by: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    schedule_cron: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_run_at: Mapped[str | None] = mapped_column(Text, nullable=True)
