"""
Knowledge Graph service.

Extracts relationships from SQL data and builds a graph structure
suitable for visualization. Supports optional Neo4j backend.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.incident import Incident

logger = logging.getLogger(__name__)

RELATIONSHIP_TYPES = {
    "PARENT_OF": "Asset hierarchy",
    "HAS_INCIDENT": "Asset incident",
    "LOCATED_IN": "Location membership",
    "DEPENDS_ON": "Equipment dependency",
    "ROOT_CAUSE_OF": "Root cause",
    "ASSIGNED_TO": "Worker assignment",
    "RELATED_TO": "Related entity",
}


class GraphNode:
    def __init__(self, id: str, label: str, type: str,
                 status: str | None = None,
                 severity: str | None = None,
                 properties: dict | None = None):
        self.id = id
        self.label = label
        self.type = type
        self.status = status
        self.severity = severity
        self.properties = properties or {}


class GraphEdge:
    def __init__(self, source: str, target: str,
                 relationship: str, label: str = "",
                 weight: float = 1.0):
        self.source = source
        self.target = target
        self.relationship = relationship
        self.label = label
        self.weight = weight


class KnowledgeGraph:
    def __init__(self):
        self.nodes: dict[str, GraphNode] = {}
        self.edges: list[GraphEdge] = []

    def add_node(self, node: GraphNode) -> None:
        if node.id not in self.nodes:
            self.nodes[node.id] = node

    def add_edge(self, edge: GraphEdge) -> None:
        self.edges.append(edge)

    def to_dict(self) -> dict[str, Any]:
        return {
            "nodes": [
                {
                    "id": n.id,
                    "label": n.label,
                    "type": n.type,
                    "status": n.status,
                    "severity": n.severity,
                    "properties": n.properties,
                }
                for n in self.nodes.values()
            ],
            "edges": [
                {
                    "source": e.source,
                    "target": e.target,
                    "relationship": e.relationship,
                    "label": e.label,
                    "weight": e.weight,
                }
                for e in self.edges
            ],
            "stats": {
                "node_count": len(self.nodes),
                "edge_count": len(self.edges),
                "relationship_types": list(set(e.relationship for e in self.edges)),
                "node_types": list(set(n.type for n in self.nodes.values())),
            },
        }


class GraphService:
    """Builds knowledge graphs from enterprise data."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def build_full_graph(self) -> KnowledgeGraph:
        """Build the complete enterprise knowledge graph."""
        kg = KnowledgeGraph()

        # Add asset nodes and parent-child relationships
        result = await self.db.execute(
            select(Asset).order_by(Asset.name)
        )
        assets = result.scalars().all()

        for asset in assets:
            kg.add_node(GraphNode(
                id=str(asset.id),
                label=asset.name,
                type="asset",
                status=asset.status,
                properties={
                    "type": asset.type,
                    "location": asset.location or "",
                },
            ))
            # Parent relationship
            if asset.parent_id:
                kg.add_edge(GraphEdge(
                    source=str(asset.parent_id),
                    target=str(asset.id),
                    relationship="PARENT_OF",
                    label="contains",
                ))

        # Location hierarchy from asset locations
        locations: set[str] = set()
        for asset in assets:
            if asset.location and asset.location.strip():
                loc = asset.location.strip()
                if loc not in locations:
                    locations.add(loc)
                    loc_id = f"loc_{loc}"
                    kg.add_node(GraphNode(
                        id=loc_id,
                        label=loc,
                        type="location",
                        properties={"location": loc},
                    ))
                loc_id = f"loc_{asset.location.strip()}"
                kg.add_edge(GraphEdge(
                    source=loc_id,
                    target=str(asset.id),
                    relationship="LOCATED_IN",
                    label="located in",
                ))

        # Incident nodes and relationships
        result = await self.db.execute(
            select(Incident).order_by(Incident.created_at.desc()).limit(50)
        )
        incidents = result.scalars().all()

        for incident in incidents:
            inc_id = f"inc_{incident.id}"
            kg.add_node(GraphNode(
                id=inc_id,
                label=incident.title[:40],
                type="incident",
                status=incident.status,
                severity=incident.severity,
                properties={
                    "severity": incident.severity,
                    "status": incident.status,
                },
            ))
            if incident.asset_id:
                kg.add_edge(GraphEdge(
                    source=str(incident.asset_id),
                    target=inc_id,
                    relationship="HAS_INCIDENT",
                    label=incident.severity,
                    weight={
                        "critical": 1.0,
                        "high": 0.7,
                        "medium": 0.4,
                        "low": 0.2,
                    }.get(incident.severity, 0.3),
                ))

        # Equipment dependencies - assets sharing the same location
        location_groups: dict[str, list[str]] = {}
        for asset in assets:
            if asset.location:
                loc = asset.location.strip()
                if loc not in location_groups:
                    location_groups[loc] = []
                location_groups[loc].append(str(asset.id))

        for loc, asset_ids in location_groups.items():
            for i in range(len(asset_ids)):
                for j in range(i + 1, len(asset_ids)):
                    kg.add_edge(GraphEdge(
                        source=asset_ids[i],
                        target=asset_ids[j],
                        relationship="DEPENDS_ON",
                        label="co-located",
                        weight=0.3,
                    ))

        return kg

    async def get_impact_analysis(self, asset_id: str) -> dict[str, Any]:
        """Analyze the impact of a specific asset."""
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = result.scalar_one_or_none()
        if not asset:
            return {"error": "Asset not found", "impact": []}

        impact = {
            "asset": {"id": str(asset.id), "name": asset.name, "type": asset.type, "status": asset.status},
            "location": asset.location,
            "parent": None,
            "children": [],
            "incidents": [],
            "affected_assets": [],
        }

        if asset.parent_id:
            result = await self.db.execute(
                select(Asset).where(Asset.id == asset.parent_id)
            )
            parent = result.scalar_one_or_none()
            if parent:
                impact["parent"] = {"id": str(parent.id), "name": parent.name}

        # Children
        result = await self.db.execute(
            select(Asset).where(Asset.parent_id == asset.id)
        )
        children = result.scalars().all()
        impact["children"] = [{"id": str(c.id), "name": c.name, "status": c.status} for c in children]

        # Incidents
        result = await self.db.execute(
            select(Incident).where(Incident.asset_id == asset.id)
            .order_by(Incident.created_at.desc()).limit(10)
        )
        incidents = result.scalars().all()
        impact["incidents"] = [
            {"id": str(i.id), "title": i.title, "severity": i.severity, "status": i.status}
            for i in incidents
        ]

        # Affected assets (co-located)
        if asset.location:
            result = await self.db.execute(
                select(Asset).where(
                    Asset.location == asset.location,
                    Asset.id != asset.id,
                )
            )
            affected = result.scalars().all()
            impact["affected_assets"] = [
                {"id": str(a.id), "name": a.name, "type": a.type, "status": a.status}
                for a in affected
            ]

        return impact

    async def search_relationships(self, query: str) -> list[dict[str, Any]]:
        """Search for nodes and relationships matching a query."""
        results = []
        query_lower = query.lower()

        # Search assets
        result = await self.db.execute(
            select(Asset).where(
                Asset.name.ilike(f"%{query_lower}%")
            ).limit(10)
        )
        assets = result.scalars().all()
        for a in assets:
            results.append({
                "id": str(a.id),
                "label": a.name,
                "type": "asset",
                "status": a.status,
                "match": f"Asset: {a.name} ({a.type})",
            })

        # Search incidents
        result = await self.db.execute(
            select(Incident).where(
                Incident.title.ilike(f"%{query_lower}%")
            ).limit(10)
        )
        incidents = result.scalars().all()
        for inc in incidents:
            results.append({
                "id": f"inc_{inc.id}",
                "label": inc.title[:60],
                "type": "incident",
                "severity": inc.severity,
                "match": f"Incident: {inc.title}",
            })

        return results
