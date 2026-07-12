"""Pydantic schemas for the Predictive Risk Intelligence Engine."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ContributingFactor(BaseModel):
    name: str
    impact: float = Field(..., ge=-1.0, le=1.0)
    description: str
    type: str = Field(..., pattern="^(positive|negative|neutral)$")


class AssetRiskPrediction(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    asset_status: str
    location: str | None = None

    # Core scores (0-100)
    risk_score: float = Field(..., ge=0, le=100)
    failure_probability: float = Field(..., ge=0, le=100)
    incident_probability: float = Field(..., ge=0, le=100)
    maintenance_priority: float = Field(..., ge=0, le=100)
    compliance_risk: float = Field(..., ge=0, le=100)
    overall_health: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)

    risk_level: str = Field(..., pattern="^(critical|high|medium|low)$")

    # Explainability
    contributing_factors: list[ContributingFactor]
    positive_factors: list[str] = []
    negative_factors: list[str] = []
    supporting_evidence: list[str] = []
    suggested_actions: list[str] = []


class RiskOverview(BaseModel):
    total_assets: int
    average_risk: float
    average_health: float
    at_risk_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    top_risks: list[AssetRiskPrediction]
    health_distribution: dict[str, int]
    risk_level_distribution: dict[str, int]


class RiskAssetListResponse(BaseModel):
    assets: list[AssetRiskPrediction]
    total: int
    overview: RiskOverview | None = None
