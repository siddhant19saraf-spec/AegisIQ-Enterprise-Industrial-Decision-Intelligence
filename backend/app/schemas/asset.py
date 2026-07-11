from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AssetBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=100)
    status: str = Field(default="operational", pattern="^(operational|maintenance|offline|critical)$")
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None)
    attributes: dict = Field(default_factory=dict)
    parent_id: UUID | None = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, min_length=1, max_length=100)
    status: str | None = Field(default=None, pattern="^(operational|maintenance|offline|critical)$")
    location: str | None = None
    description: str | None = None
    attributes: dict | None = None
    parent_id: UUID | None = None


class AssetResponse(BaseModel):
    id: UUID
    name: str
    type: str
    status: str
    location: str | None
    description: str | None
    attributes: dict
    parent_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
