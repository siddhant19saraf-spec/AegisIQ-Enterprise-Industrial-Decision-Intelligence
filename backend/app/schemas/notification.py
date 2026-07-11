from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    user_id: UUID | None = None
    type: str = Field(default="info", pattern="^(alert|info|warning|success)$")
    title: str = Field(min_length=1, max_length=255)
    body: str | None = None
    data: dict = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    type: str
    title: str
    body: str | None
    data: dict
    read: bool
    read_at: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
