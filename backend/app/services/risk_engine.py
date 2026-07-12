"""
Predictive Risk Intelligence Engine.

Combines asset health, incident history, maintenance records,
asset age, type, criticality, location, and previous recommendations
to produce comprehensive risk predictions with full explainability.

Every prediction includes:
  - Risk Score (0-100)
  - Failure Probability
  - Incident Probability
  - Maintenance Priority
  - Compliance Risk
  - Overall Health Score
  - Confidence Score
  - Contributing Factors (positive/negative)
  - Supporting Evidence
  - Suggested Actions
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.incident import Incident, IncidentUpdate
from app.schemas.risk_engine import (
    AssetRiskPrediction,
    ContributingFactor,
    RiskOverview,
)

logger = logging.getLogger(__name__)

# Severity to numeric weight
SEVERITY_WEIGHTS = {"critical": 1.0, "high": 0.7, "medium": 0.4, "low": 0.2}

# Status to base health (0-100)
STATUS_HEALTH = {"operational": 90, "warning": 55, "maintenance": 40, "offline": 15, "critical": 5}

# Asset type failure risk multipliers (higher = more prone to failure)
TYPE_RISK_MULTIPLIER = {
    "pump": 1.3,
    "turbine": 1.4,
    "compressor": 1.2,
    "conveyor": 1.1,
    "motor": 1.2,
    "generator": 1.3,
    "transformer": 1.1,
    "valve": 0.9,
    "sensor": 0.8,
    "controller": 0.9,
    "server": 1.0,
    "switch": 0.9,
}

# Maintenance history decay (days)
MAINTENANCE_DECAY_DAYS = 90


def _normalize_100(value: float) -> float:
    return max(0.0, min(100.0, value))


class RiskEngine:
    """Core predictive risk engine."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_asset(self, asset: Asset) -> AssetRiskPrediction:
        """Evaluate a single asset and return comprehensive risk prediction."""

        # Gather data
        incidents = await self._get_incidents(asset.id)
        incident_updates = await self._get_incident_updates(asset.id)
        total_incidents = len(incidents)
        active_incidents = [i for i in incidents if i.status in ("open", "investigating")]
        resolved_incidents = [i for i in incidents if i.status in ("resolved", "closed")]

        # Compute age factor (older assets have higher risk)
        age_days = self._compute_age_days(asset)
        age_factor = min(age_days / 3650, 1.0)  # 10 years = max age factor

        # ---- Core Score Calculations ----

        # 1. Failure Probability (0-100)
        failure_prob = self._compute_failure_probability(
            asset, active_incidents, total_incidents, age_factor
        )

        # 2. Incident Probability (0-100)
        incident_prob = self._compute_incident_probability(
            total_incidents, len(active_incidents), age_factor, asset
        )

        # 3. Maintenance Priority (0-100)
        maint_priority = self._compute_maintenance_priority(
            asset, total_incidents, resolved_incidents, incident_updates, age_days
        )

        # 4. Compliance Risk (0-100)
        compliance_risk = self._compute_compliance_risk(
            asset, active_incidents, total_incidents
        )

        # 5. Overall Health (0-100, higher = healthier)
        overall_health = self._compute_overall_health(
            asset, failure_prob, incident_prob, maint_priority, compliance_risk
        )

        # 6. Composite Risk Score (0-100)
        risk_score = self._compute_risk_score(
            failure_prob, incident_prob, maint_priority, compliance_risk, overall_health
        )

        # 7. Confidence
        confidence = self._compute_confidence(total_incidents, has_updates=len(incident_updates) > 0)

        # Risk level
        risk_level = self._risk_level(risk_score)

        # Explainability
        contributing_factors = self._compute_factors(
            asset, failure_prob, incident_prob, maint_priority, compliance_risk,
            active_incidents, total_incidents, age_factor, risk_score
        )
        positive_factors = [f.description for f in contributing_factors if f.type == "positive"]
        negative_factors = [f.description for f in contributing_factors if f.type == "negative"]

        # Evidence
        evidence = self._build_evidence(asset, incidents, incident_updates, total_incidents)

        # Actions
        actions = self._build_actions(asset, risk_score, risk_level, active_incidents, maint_priority)

        return AssetRiskPrediction(
            asset_id=str(asset.id),
            asset_name=asset.name,
            asset_type=asset.type,
            asset_status=asset.status,
            location=asset.location,
            risk_score=round(risk_score, 1),
            failure_probability=round(failure_prob, 1),
            incident_probability=round(incident_prob, 1),
            maintenance_priority=round(maint_priority, 1),
            compliance_risk=round(compliance_risk, 1),
            overall_health=round(overall_health, 1),
            confidence=round(confidence, 1),
            risk_level=risk_level,
            contributing_factors=contributing_factors,
            positive_factors=positive_factors,
            negative_factors=negative_factors,
            supporting_evidence=evidence,
            suggested_actions=actions,
        )

    # ---- Data helpers ----

    async def _get_incidents(self, asset_id) -> list[Incident]:
        result = await self.db.execute(
            select(Incident).where(Incident.asset_id == asset_id)
        )
        return list(result.scalars().all())

    async def _get_incident_updates(self, asset_id) -> list[IncidentUpdate]:
        """Get all updates for incidents associated with this asset."""
        result = await self.db.execute(
            select(IncidentUpdate)
            .join(Incident, IncidentUpdate.incident_id == Incident.id)
            .where(Incident.asset_id == asset_id)
        )
        return list(result.scalars().all())

    def _compute_age_days(self, asset: Asset) -> float:
        created_at = asset.created_at
        if not created_at:
            return 0.0
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - created_at
        return max(0.0, delta.total_seconds() / 86400)

    # ---- Score computations ----

    def _compute_failure_probability(self, asset: Asset,
                                     active: list, total: int, age: float) -> float:
        """Failure probability based on status, incidents, age, and type."""
        base = 100 - STATUS_HEALTH.get(asset.status, 70)
        incident_impact = min(total * 8, 40)
        age_impact = age * 30
        type_mult = TYPE_RISK_MULTIPLIER.get(asset.type.lower(), 1.0)
        active_mult = 1.0 + (len(active) * 0.15)
        raw = (base + incident_impact + age_impact) * type_mult * active_mult
        return _normalize_100(raw)

    def _compute_incident_probability(self, total: int, active_count: int,
                                      age: float, asset: Asset) -> float:
        """Probability of new incidents occurring."""
        incident_rate = total / max(age * 30, 1) * 100  # incidents per 100 days
        active_bonus = active_count * 12
        status_bonus = 0.0
        if asset.status in ("critical", "warning"):
            status_bonus = 25.0
        age_penalty = age * 15
        raw = min(incident_rate * 5, 30) + active_bonus + status_bonus + age_penalty
        return _normalize_100(raw)

    def _compute_maintenance_priority(self, asset: Asset, total: int,
                                      resolved: list, updates: list,
                                      age_days: float) -> float:
        """Maintenance priority based on incident resolution patterns and asset age."""
        open_incidents = total - len(resolved)
        if total == 0:
            resolution_rate = 1.0
        else:
            resolution_rate = len(resolved) / total

        # Low resolution rate = higher maintenance priority
        resolve_factor = (1.0 - resolution_rate) * 40
        open_penalty = open_incidents * 15
        age_penalty = min(age_days / 365 * 15, 30)

        # Frequent incidents suggest maintenance issues
        if total > 0:
            freq_penalty = min(total * 5, 20)
        else:
            freq_penalty = 0

        status_base = 100 - STATUS_HEALTH.get(asset.status, 70)

        raw = status_base + resolve_factor + open_penalty + age_penalty + freq_penalty
        return _normalize_100(raw)

    def _compute_compliance_risk(self, asset: Asset, active: list, total: int) -> float:
        """Compliance risk based on unresolved incidents and critical alerts."""
        if total == 0:
            return 5.0  # minimal baseline

        # Active critical/high incidents = high compliance risk
        total_severity = sum(
            SEVERITY_WEIGHTS.get(i.severity, 0.0) for i in active
        ) / max(len(active), 1)
        if not active:
            total_severity = 0.0

        status_penalty = 0.0
        if asset.status == "critical":
            status_penalty = 35.0
        elif asset.status == "offline":
            status_penalty = 25.0

        raw = total_severity * 40 + status_penalty + min(total * 3, 15)
        return _normalize_100(raw)

    def _compute_overall_health(self, asset: Asset, failure_prob: float,
                                incident_prob: float, maint_priority: float,
                                compliance_risk: float) -> float:
        """Overall health score (100 = perfect health)."""
        deductions = (failure_prob * 0.35 + incident_prob * 0.25 +
                      maint_priority * 0.20 + compliance_risk * 0.20)
        health = 100 - deductions
        return _normalize_100(health)

    def _compute_risk_score(self, failure_prob: float, incident_prob: float,
                            maint_priority: float, compliance_risk: float,
                            overall_health: float) -> float:
        """Composite risk score combining all dimensions."""
        risk = (failure_prob * 0.30 + incident_prob * 0.20 +
                maint_priority * 0.15 + compliance_risk * 0.15 +
                (100 - overall_health) * 0.20)
        return _normalize_100(risk)

    def _compute_confidence(self, total_incidents: int, has_updates: bool) -> float:
        """Confidence in the prediction based on data quantity."""
        base = 70.0
        if total_incidents > 0:
            base += min(total_incidents * 2, 15)
        if has_updates:
            base += 10
        return _normalize_100(base)

    def _risk_level(self, score: float) -> str:
        if score >= 70:
            return "critical"
        elif score >= 45:
            return "high"
        elif score >= 20:
            return "medium"
        return "low"

    # ---- Explainability ----

    def _compute_factors(self, asset: Asset, failure_prob: float,
                         incident_prob: float, maint_priority: float,
                         compliance_risk: float, active: list, total: int,
                         age: float, risk_score: float) -> list[ContributingFactor]:
        """Identify positive and negative contributing factors."""
        factors: list[ContributingFactor] = []

        # Asset status
        if asset.status == "operational":
            factors.append(ContributingFactor(
                name="Asset Status", impact=0.3, type="positive",
                description="Asset is operational with no active issues",
            ))
        elif asset.status == "critical":
            factors.append(ContributingFactor(
                name="Asset Status", impact=-0.9, type="negative",
                description="Asset is in critical condition requiring immediate attention",
            ))
        elif asset.status == "offline":
            factors.append(ContributingFactor(
                name="Asset Status", impact=-0.7, type="negative",
                description="Asset is offline and unavailable",
            ))

        # Active incidents
        if active:
            severities = [i.severity for i in active]
            critical_count = severities.count("critical")
            high_count = severities.count("high")
            if critical_count > 0:
                factors.append(ContributingFactor(
                    name="Active Critical Incidents", impact=-0.8, type="negative",
                    description=f"{critical_count} critical incident(s) currently active",
                ))
            if high_count > 0:
                factors.append(ContributingFactor(
                    name="Active High-Severity Incidents", impact=-0.5, type="negative",
                    description=f"{high_count} high-severity incident(s) unresolved",
                ))
        else:
            factors.append(ContributingFactor(
                name="Active Incidents", impact=0.2, type="positive",
                description="No active incidents reported",
            ))

        # Failure probability
        if failure_prob < 20:
            factors.append(ContributingFactor(
                name="Failure Risk", impact=0.25, type="positive",
                description="Low probability of failure based on current indicators",
            ))
        elif failure_prob > 60:
            factors.append(ContributingFactor(
                name="Failure Risk", impact=-0.5, type="negative",
                description=f"High failure probability ({failure_prob:.0f}%)",
            ))

        # Age
        if age > 0.5:  # Older than 6 months
            years = age * 365 / 365
            if years > 5:
                factors.append(ContributingFactor(
                    name="Asset Age", impact=-0.3, type="negative",
                    description=f"Asset is {years:.0f}+ years old, increasing failure risk",
                ))

        # Type-specific risk
        type_mult = TYPE_RISK_MULTIPLIER.get(asset.type.lower(), 1.0)
        if type_mult > 1.2:
            factors.append(ContributingFactor(
                name="Asset Type Risk", impact=-0.2, type="negative",
                description=f"Asset type '{asset.type}' has above-average failure rate",
            ))

        # Incident count
        if total == 0:
            factors.append(ContributingFactor(
                name="Incident History", impact=0.2, type="positive",
                description="No incident history for this asset",
            ))
        elif total > 5:
            factors.append(ContributingFactor(
                name="Incident Frequency", impact=-0.3, type="negative",
                description=f"{total} incidents recorded, indicating recurring issues",
            ))

        # Maintenance priority
        if maint_priority < 20:
            factors.append(ContributingFactor(
                name="Maintenance Status", impact=0.2, type="positive",
                description="Maintenance is up to date",
            ))
        elif maint_priority > 60:
            factors.append(ContributingFactor(
                name="Maintenance Status", impact=-0.35, type="negative",
                description="Maintenance is overdue or frequently required",
            ))

        return factors

    def _build_evidence(self, asset: Asset, incidents: list,
                        updates: list, total: int) -> list[str]:
        """Build supporting evidence from available data."""
        evidence = []
        evidence.append(f"Current status: {asset.status}")
        if asset.location:
            evidence.append(f"Location: {asset.location}")
        evidence.append(f"Asset type: {asset.type}")
        evidence.append(f"Total incident count: {total}")

        if incidents:
            severities = [i.severity for i in incidents]
            evidence.append(f"Incidents by severity: {severities.count('critical')} critical, {severities.count('high')} high, {severities.count('medium')} medium, {severities.count('low')} low")
            active = [i for i in incidents if i.status in ("open", "investigating")]
            if active:
                evidence.append(f"Active unresolved incidents: {len(active)}")
            resolved = [i for i in incidents if i.status in ("resolved", "closed")]
            evidence.append(f"Resolved incidents: {len(resolved)}")
            if updates:
                evidence.append(f"Total incident activity records: {len(updates)}")

        return evidence

    def _build_actions(self, asset: Asset, risk_score: float,
                       risk_level: str, active: list,
                       maint_priority: float) -> list[str]:
        """Generate suggested actions based on risk profile."""
        actions: list[str] = []

        if risk_level == "critical":
            actions.append("IMMEDIATE: Initiate emergency response protocol for this asset")
            actions.append("PRIORITY: Dispatch senior technician for on-site inspection")
            if active:
                actions.append("URGENT: Resolve all active critical incidents before proceeding")
        elif risk_level == "high":
            actions.append("HIGH PRIORITY: Schedule inspection within 24 hours")
            actions.append("Review and address active incidents")
            actions.append("Consider temporary operational restrictions")

        if maint_priority > 60:
            actions.append("Schedule comprehensive maintenance review")
            actions.append("Check maintenance logs for overdue items")
        elif maint_priority > 30:
            actions.append("Include in next routine maintenance cycle")

        if asset.status == "operational" and risk_score < 20:
            actions.append("Continue routine monitoring — no action required")

        if not actions:
            actions.append("Asset is within normal risk parameters — continue standard monitoring")

        return actions


async def compute_risk_overview(db: AsyncSession) -> RiskOverview:
    """Compute aggregate risk overview across all assets."""
    result = await db.execute(select(Asset))
    assets = list(result.scalars().all())

    engine = RiskEngine(db)
    predictions = [await engine.evaluate_asset(a) for a in assets]
    predictions.sort(key=lambda p: p.risk_score, reverse=True)

    total = len(predictions)
    avg_risk = sum(p.risk_score for p in predictions) / max(total, 1)
    avg_health = sum(p.overall_health for p in predictions) / max(total, 1)
    at_risk = sum(1 for p in predictions if p.risk_level in ("critical", "high"))

    risk_dist = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    health_dist = {"excellent": 0, "good": 0, "fair": 0, "poor": 0}

    for p in predictions:
        risk_dist[p.risk_level] = risk_dist.get(p.risk_level, 0) + 1
        if p.overall_health >= 80:
            health_dist["excellent"] += 1
        elif p.overall_health >= 60:
            health_dist["good"] += 1
        elif p.overall_health >= 40:
            health_dist["fair"] += 1
        else:
            health_dist["poor"] += 1

    return RiskOverview(
        total_assets=total,
        average_risk=round(avg_risk, 1),
        average_health=round(avg_health, 1),
        at_risk_count=at_risk,
        critical_count=risk_dist["critical"],
        high_count=risk_dist["high"],
        medium_count=risk_dist["medium"],
        low_count=risk_dist["low"],
        top_risks=predictions[:5],
        health_distribution=health_dist,
        risk_level_distribution=risk_dist,
    )
