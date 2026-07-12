"""Pydantic schemas for the Enterprise Digital Twin."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FacilitySummary(BaseModel):
    id: str
    name: str
    location: str | None = None
    asset_count: int
    critical_count: int
    health_score: float = Field(..., ge=0, le=100)
    risk_score: float = Field(..., ge=0, le=100)
    active_incident_count: int


class DigitalTwinNode(BaseModel):
    id: str
    label: str
    type: str
    status: str
    health_score: float = Field(..., ge=0, le=100)
    risk_score: float = Field(..., ge=0, le=100)
    risk_level: str
    location: str | None = None
    facility_id: str | None = None
    parent_id: str | None = None
    active_incidents: int = 0
    incident_severities: list[str] = []
    maintenance_due: bool = False
    children_count: int = 0


class DigitalTwinEdge(BaseModel):
    source: str
    target: str
    relationship: str
    label: str = ""
    weight: float = 1.0


class DigitalTwinTopology(BaseModel):
    nodes: list[DigitalTwinNode]
    edges: list[DigitalTwinEdge]


class DigitalTwinOverview(BaseModel):
    total_assets: int
    total_facilities: int
    total_nodes: int
    total_edges: int
    critical_count: int
    at_risk_count: int
    active_incidents: int
    average_health: float
    facilities: list[FacilitySummary]
