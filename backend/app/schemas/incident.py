from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class IncidentBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    severity: str = Field(default="medium", pattern="^(critical|high|medium|low)$")
    status: str = Field(default="open", pattern="^(open|investigating|resolved|closed)$")
    asset_id: UUID | None = None
    assigned_to: UUID | None = None
    risk_score: float | None = Field(default=None, ge=0, le=1)


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    severity: str | None = Field(default=None, pattern="^(critical|high|medium|low)$")
    status: str | None = Field(default=None, pattern="^(open|investigating|resolved|closed)$")
    asset_id: UUID | None = None
    assigned_to: UUID | None = None
    risk_score: float | None = Field(default=None, ge=0, le=1)


class IncidentResponse(IncidentBase):
    id: UUID
    detected_at: datetime | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentUpdateCreate(BaseModel):
    message: str = Field(min_length=1)
    update_type: str = Field(default="update", pattern="^(created|assigned|updated|resolved|closed|update)$")


class IncidentUpdateResponse(BaseModel):
    id: UUID
    incident_id: UUID
    message: str
    user_id: UUID | None
    update_type: str
    created_at: datetime

    model_config = {"from_attributes": True}
