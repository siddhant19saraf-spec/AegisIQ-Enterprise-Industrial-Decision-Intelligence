"""
Enterprise Digital Twin Service.

Builds facility hierarchy, asset topology, and integrates live status
from Assets, Incidents, Risk Engine, Decision Intelligence, and Knowledge Graph.
"""

from __future__ import annotations

import logging
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.incident import Incident
from app.schemas.digital_twin import (
    DigitalTwinEdge,
    DigitalTwinNode,
    DigitalTwinOverview,
    DigitalTwinTopology,
    FacilitySummary,
)
from app.services.risk_engine import RiskEngine

logger = logging.getLogger(__name__)


class DigitalTwinService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.risk_engine = RiskEngine(db)

    async def get_facilities(self) -> list[FacilitySummary]:
        """Group assets by location to derive facility summaries."""
        result = await self.db.execute(select(Asset))
        assets = result.scalars().all()

        # Group by location (null location becomes "unzoned")
        groups: dict[str, list[Asset]] = defaultdict(list)
        for a in assets:
            loc = a.location or "Unzoned"
            groups[loc].append(a)

        # Fetch active incidents
        inc_result = await self.db.execute(
            select(Incident).where(Incident.status.in_(["open", "investigating"]))
        )
        active_incidents = list(inc_result.scalars().all())
        incident_counts: dict[str, int] = defaultdict(int)
        for inc in active_incidents:
            if inc.asset_id:
                incident_counts[str(inc.asset_id)] += 1

        # Compute per-asset health scores
        predictions_map: dict[str, tuple[float, float]] = {}
        for a in assets:
            pred = await self.risk_engine.evaluate_asset(a)
            predictions_map[str(a.id)] = (pred.overall_health, pred.risk_score)

        facilities: list[FacilitySummary] = []
        for loc, group in sorted(groups.items()):
            total = len(group)
            critical = sum(1 for a in group if a.status == "critical")
            active = sum(
                incident_counts.get(str(a.id), 0) for a in group
            )
            avg_health = sum(
                predictions_map.get(str(a.id), (100, 0))[0] for a in group
            ) / max(total, 1)
            avg_risk = sum(
                predictions_map.get(str(a.id), (100, 0))[1] for a in group
            ) / max(total, 1)

            facilities.append(FacilitySummary(
                id=loc.lower().replace(" ", "-"),
                name=loc,
                location=loc,
                asset_count=total,
                critical_count=critical,
                health_score=round(avg_health, 1),
                risk_score=round(avg_risk, 1),
                active_incident_count=active,
            ))

        return facilities

    async def get_facility_detail(self, facility_id: str) -> DigitalTwinTopology | None:
        """Return topology (nodes + edges) for a single facility."""
        # Derive location name from facility_id
        # facility_id is the slugified version (e.g. "building-a" -> "Building A")
        # We need to find the original location value.
        # Since it's slugified, try to match case-insensitively against assets
        result = await self.db.execute(select(Asset))
        all_assets = list(result.scalars().all())

        # Find the location value matching this facility_id
        location_value: str | None = None
        for a in all_assets:
            loc = a.location or "Unzoned"
            if loc.lower().replace(" ", "-") == facility_id.lower():
                location_value = a.location
                break

        if not location_value and facility_id.lower() != "unzoned":
            return None

        assets = [a for a in all_assets if (a.location or "Unzoned") == (location_value or "Unzoned")]
        if not assets:
            return None

        return await self._build_topology(assets)

    async def get_asset_topology(self) -> DigitalTwinTopology:
        """Full asset topology (all assets)."""
        result = await self.db.execute(select(Asset))
        assets = list(result.scalars().all())
        return await self._build_topology(assets)

    async def get_overview(self) -> DigitalTwinOverview:
        """Aggregate digital twin overview."""
        facilities = await self.get_facilities()
        topology = await self.get_asset_topology()

        total_assets = sum(f.asset_count for f in facilities)
        total_facilities = len(facilities)
        critical_count = sum(f.critical_count for f in facilities)
        at_risk_count = sum(1 for f in facilities if f.risk_score >= 45)
        active_incidents = sum(f.active_incident_count for f in facilities)
        avg_health = (
            sum(f.health_score * f.asset_count for f in facilities) / max(total_assets, 1)
            if total_assets > 0
            else 0
        )

        return DigitalTwinOverview(
            total_assets=total_assets,
            total_facilities=total_facilities,
            total_nodes=len(topology.nodes),
            total_edges=len(topology.edges),
            critical_count=critical_count,
            at_risk_count=at_risk_count,
            active_incidents=active_incidents,
            average_health=round(avg_health, 1),
            facilities=facilities,
        )

    # ---- Internal helpers ----

    async def _build_topology(self, assets: list[Asset]) -> DigitalTwinTopology:
        """Build nodes and edges for a set of assets."""
        # Fetch risk predictions + active incidents in batch
        predictions_map: dict[str, tuple[float, float, str]] = {}
        for a in assets:
            pred = await self.risk_engine.evaluate_asset(a)
            risk_level = "critical" if pred.risk_score >= 70 else "high" if pred.risk_score >= 45 else "medium" if pred.risk_score >= 20 else "low"
            predictions_map[str(a.id)] = (pred.overall_health, pred.risk_score, risk_level)

        inc_result = await self.db.execute(
            select(Incident).where(
                Incident.asset_id.in_([a.id for a in assets]),
                Incident.status.in_(["open", "investigating"]),
            )
        )
        active_incidents = list(inc_result.scalars().all())
        incident_map: dict[str, list[Incident]] = defaultdict(list)
        for inc in active_incidents:
            if inc.asset_id:
                incident_map[str(inc.asset_id)].append(inc)

        asset_map = {str(a.id): a for a in assets}
        nodes: list[DigitalTwinNode] = []
        edges: list[DigitalTwinEdge] = []
        parent_ids = set()

        for a in assets:
            aid = str(a.id)
            health, risk, rlevel = predictions_map.get(aid, (100, 0, "low"))
            incs = incident_map.get(aid, [])
            children = [child for child in assets if child.parent_id and str(child.parent_id) == aid]

            # Facility id from location
            fac_id = (a.location or "Unzoned").lower().replace(" ", "-")

            node = DigitalTwinNode(
                id=aid,
                label=a.name,
                type=a.type,
                status=a.status,
                health_score=round(health, 1),
                risk_score=round(risk, 1),
                risk_level=rlevel,
                location=a.location,
                facility_id=fac_id,
                parent_id=str(a.parent_id) if a.parent_id else None,
                active_incidents=len(incs),
                incident_severities=[i.severity for i in incs],
                maintenance_due=a.status == "maintenance",
                children_count=len(children),
            )
            nodes.append(node)

            if a.parent_id and str(a.parent_id) in asset_map:
                parent_ids.add(str(a.parent_id))
                edges.append(DigitalTwinEdge(
                    source=str(a.parent_id),
                    target=aid,
                    relationship="PARENT_OF",
                    label="contains",
                    weight=1.0,
                ))

        # Add co-location edges for same-facility dependency
        facility_groups: dict[str, list[str]] = defaultdict(list)
        for a in assets:
            loc_key = a.location or "Unzoned"
            facility_groups[loc_key].append(str(a.id))

        for loc, ids in facility_groups.items():
            if len(ids) > 1:
                for i in range(len(ids) - 1):
                    edges.append(DigitalTwinEdge(
                        source=ids[i],
                        target=ids[i + 1],
                        relationship="CO_LOCATED",
                        label="co-located",
                        weight=0.3,
                    ))

        return DigitalTwinTopology(nodes=nodes, edges=edges)
