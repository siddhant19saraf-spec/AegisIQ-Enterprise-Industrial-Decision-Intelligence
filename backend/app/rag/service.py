"""
Enterprise RAG — knowledge retrieval with citations.

Supports pluggable backends: Qdrant vector search, or in-memory fallback.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any

logger = logging.getLogger(__name__)


class Chunk:
    id: str
    content: str
    source: str
    title: str
    metadata: dict
    embedding: list[float] | None

    def __init__(self, content: str, source: str, title: str,
                 metadata: dict | None = None,
                 embedding: list[float] | None = None):
        self.id = hashlib.sha256(content.encode()).hexdigest()[:16]
        self.content = content
        self.source = source
        self.title = title
        self.metadata = metadata or {}
        self.embedding = embedding


_DOCUMENTS: list[dict[str, Any]] = [
    {
        "title": "Safety Manual — Emergency Shutdown Procedure",
        "source": "Safety Manual v3.2",
        "content": (
            "In the event of an emergency, immediately activate the master "
            "shutdown switch located at the main control panel. Notify all "
            "personnel via the PA system. Evacuate the affected zone and "
            "assemble at the designated emergency meeting point. Do not "
            "re-enter the area until cleared by the safety officer. "
            "Document all events in the incident reporting system."
        ),
        "category": "safety",
    },
    {
        "title": "SOP — Turbine Startup Sequence",
        "source": "Standard Operating Procedures",
        "content": (
            "Prior to startup, verify coolant levels are within normal range "
            "and all safety interlocks are engaged. Perform a visual inspection "
            "of the turbine housing. Start the auxiliary lubrication system "
            "and wait for oil pressure to stabilize at 40 PSI. Begin the "
            "startup sequence from the control panel, monitoring vibration "
            "levels throughout. Normal operating temperature is 85-95°C. "
            "If temperature exceeds 100°C, initiate emergency cooldown."
        ),
        "category": "maintenance",
    },
    {
        "title": "Maintenance Guide — Pump Overhaul",
        "source": "Maintenance Guide Rev 4",
        "content": (
            "Centrifugal pumps require overhaul every 8,000 operating hours "
            "or 12 months, whichever comes first. Replace bearings, wear "
            "rings, and mechanical seals during each overhaul. Check impeller "
            "clearance and adjust to 0.5mm. Verify shaft alignment within "
            "0.05mm tolerance. Pressure test the casing at 1.5x rated "
            "pressure after reassembly."
        ),
        "category": "maintenance",
    },
    {
        "title": "Emergency Procedure — Chemical Spill Response",
        "source": "Hazardous Materials Handbook",
        "content": (
            "For chemical spills, immediately isolate the area and restrict "
            "access to authorized response personnel only. Refer to the SDS "
            "for specific containment and neutralization procedures. Use "
            "appropriate PPE including chemical-resistant gloves, goggles, "
            "and respirator. Contain the spill using absorbent materials. "
            "Dispose of contaminated materials per hazardous waste protocols."
        ),
        "category": "safety",
    },
    {
        "title": "Internal Document — Cooling System Design Specs",
        "source": "Engineering Documentation",
        "content": (
            "The facility cooling system is designed for a maximum heat load "
            "of 500 kW. Primary cooling is provided by three 200-ton chillers "
            "in a redundant N+1 configuration. Secondary cooling uses a "
            "cooling tower with a 15°C approach temperature. The system "
            "maintains server inlet temperatures between 18-27°C per ASHRAE "
            "guidelines. Emergency backup is provided by a 100-ton chiller "
            "on UPS power."
        ),
        "category": "engineering",
    },
    {
        "title": "SOP — Incident Reporting and Documentation",
        "source": "Incident Management Manual",
        "content": (
            "All incidents must be reported within 1 hour of detection. "
            "Classify incidents by severity: Critical (immediate danger to "
            "life or critical asset), High (significant operational impact), "
            "Medium (moderate impact, containable), Low (minor issue). "
            "Assign an owner within 30 minutes for Critical/High incidents. "
            "Conduct root cause analysis within 5 business days. "
            "All resolved incidents require final documentation sign-off."
        ),
        "category": "operations",
    },
]


class RAGService:
    """Enterprise knowledge retrieval using stored documents."""

    def __init__(self):
        self._chunks: list[Chunk] = []
        self._ingest_defaults()

    def _ingest_defaults(self) -> None:
        for doc in _DOCUMENTS:
            chunk = Chunk(
                content=doc["content"],
                source=doc["source"],
                title=doc["title"],
                metadata={"category": doc["category"]},
            )
            self._chunks.append(chunk)
        logger.info("Ingested %d default document chunks", len(self._chunks))

    def retrieve(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        """Retrieve relevant document chunks using keyword scoring."""
        query_lower = query.lower()
        query_terms = set(query_lower.split())

        scored: list[tuple[int, Chunk]] = []
        for chunk in self._chunks:
            score = self._score_chunk(chunk, query_lower, query_terms)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = scored[:top_k]

        return [
            {
                "source": chunk.source,
                "title": chunk.title,
                "snippet": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                "relevance": round(score / 10, 2) if score > 0 else 0,
            }
            for score, chunk in results
        ]

    def _score_chunk(self, chunk: Chunk, query_lower: str, query_terms: set[str]) -> int:
        score = 0
        content_lower = chunk.content.lower()
        title_lower = chunk.title.lower()

        # Direct phrase match (highest weight)
        if query_lower in content_lower:
            score += 5
        if query_lower in title_lower:
            score += 3

        # Individual term matches
        for term in query_terms:
            if len(term) < 3:
                continue
            if term in content_lower:
                score += 1
            if term in title_lower:
                score += 2
            if term in chunk.metadata.get("category", "").lower():
                score += 1

        return score

    def add_document(self, title: str, content: str, source: str,
                     category: str = "general",
                     metadata: dict | None = None) -> Chunk:
        chunk = Chunk(
            content=content,
            source=source,
            title=title,
            metadata={"category": category, **(metadata or {})},
        )
        self._chunks.append(chunk)
        return chunk

    def list_documents(self) -> list[dict[str, Any]]:
        seen: dict[str, dict] = {}
        for chunk in self._chunks:
            key = chunk.source + "::" + chunk.title
            if key not in seen:
                seen[key] = {
                    "title": chunk.title,
                    "source": chunk.source,
                    "category": chunk.metadata.get("category", "general"),
                }
        return list(seen.values())

    def get_all_sources(self) -> list[str]:
        return list({chunk.source for chunk in self._chunks})


rag_service = RAGService()
