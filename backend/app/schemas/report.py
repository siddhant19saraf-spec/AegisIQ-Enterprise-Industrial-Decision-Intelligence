from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReportBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=50)
    params: dict = Field(default_factory=dict)
    schedule_cron: str | None = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    params: dict | None = None
    schedule_cron: str | None = None


class ReportResponse(ReportBase):
    id: UUID
    status: str
    created_by: UUID | None
    file_url: str | None
    last_run_at: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
