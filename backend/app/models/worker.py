from sqlalchemy import Boolean, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Worker(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "workers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="operator")
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    facility: Mapped[str] = mapped_column(String(255), nullable=True)
    emergency_contact: Mapped[str] = mapped_column(String(20), nullable=True)
    medical_conditions: Mapped[str] = mapped_column(String(500), nullable=True)
    blood_group: Mapped[str] = mapped_column(String(5), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_on_duty: Mapped[bool] = mapped_column(Boolean, default=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)


class EmergencyAlert(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "emergency_alerts"

    type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="critical")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    facility: Mapped[str] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    worker_id: Mapped[str] = mapped_column(String(36), ForeignKey("workers.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    auto_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    ambulance_dispatched: Mapped[bool] = mapped_column(Boolean, default=False)
    ambulance_eta_minutes: Mapped[int] = mapped_column(default=0)
    resolved_at: Mapped[str] = mapped_column(String(50), nullable=True)
