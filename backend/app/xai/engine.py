"""
AI Copilot Engine — enterprise decision intelligence with explainable recommendations.

Combines asset data, incidents, RAG knowledge, and business rules to provide
contextual, citable answers and recommendations.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.incident import Incident
from app.rag import rag_service
from app.schemas.copilot import Citation, CopilotResponse, ThinkingStep
from app.services.risk_service import RiskService

logger = logging.getLogger(__name__)

# In-memory conversation store (no DB persistence for MVP)
_conversations: dict[str, dict[str, Any]] = {}

SUGGESTED_PROMPTS = [
    "What is the current status of all assets?",
    "Show me critical incidents that need attention",
    "What maintenance is overdue?",
    "Analyze the risk of asset failures in Building A",
    "Show me the root cause of recent incidents",
    "What SOP documents cover emergency shutdown?",
]


class CopilotEngine:
    """Core engine that processes user queries and generates responses."""

    def __init__(self, db: AsyncSession | None = None):
        self.db = db

    async def process(
        self,
        message: str,
        conversation_id: str | None = None,
        context: dict | None = None,
    ) -> CopilotResponse:
        thinking: list[ThinkingStep] = []
        conv_id = conversation_id or str(uuid.uuid4())

        # Step 1: Understand intent
        thinking.append(ThinkingStep(phase="analyze", detail="Analyzing query intent..."))
        intent = self._classify_intent(message)

        # Step 2: Retrieve knowledge
        thinking.append(ThinkingStep(phase="retrieve", detail=f"Searching enterprise knowledge for: {intent}"))
        rag_results = rag_service.retrieve(message, top_k=3)
        citations = [
            Citation(source=r["source"], title=r["title"],
                     snippet=r["snippet"], relevance=r["relevance"])
            for r in rag_results
        ]

        # Step 3: Query enterprise data
        thinking.append(ThinkingStep(phase="query", detail="Querying operational data..."))
        enterprise_data = await self._query_enterprise_data(message, intent)

        # Step 4: Generate response
        thinking.append(ThinkingStep(phase="reason", detail="Generating response with evidence..."))
        response_text, confidence = self._generate_response(message, intent, enterprise_data, rag_results)

        # Step 5: Prepare suggestions
        thinking.append(ThinkingStep(phase="complete", detail="Finalizing recommendations..."))
        suggestions = self._get_suggested_prompts(intent, enterprise_data)

        # Store conversation
        if conv_id not in _conversations:
            _conversations[conv_id] = {
                "id": conv_id,
                "title": message[:60],
                "messages": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        _conversations[conv_id]["messages"].append({"role": "user", "content": message})
        _conversations[conv_id]["messages"].append({"role": "assistant", "content": response_text})
        _conversations[conv_id]["updated_at"] = datetime.now(timezone.utc)

        return CopilotResponse(
            conversation_id=conv_id,
            response=response_text,
            citations=citations,
            thinking=thinking,
            confidence=confidence,
            suggested_prompts=suggestions,
        )

    def _classify_intent(self, message: str) -> str:
        msg = message.lower()
        if "asset" in msg or "equipment" in msg or "machine" in msg:
            return "assets"
        if "incident" in msg or "alert" in msg or "issue" in msg or "problem" in msg:
            return "incidents"
        if "maintenance" in msg or "overdue" in msg or "schedule" in msg:
            return "maintenance"
        if "risk" in msg or "failure" in msg or "danger" in msg or "threat" in msg:
            return "risk"
        if "document" in msg or "sop" in msg or "manual" in msg or "guide" in msg or "procedure" in msg:
            return "documents"
        if "dash" in msg or "summary" in msg or "overview" in msg or "status" in msg:
            return "summary"
        if "root cause" in msg or "why" in msg or "cause" in msg:
            return "root_cause"
        return "general"

    async def _query_enterprise_data(self, message: str, intent: str) -> dict[str, Any]:
        """Query database for relevant enterprise data."""
        if not self.db:
            return {"note": "Database not available", "data": []}

        data: dict[str, Any] = {}

        try:
            if intent in ("assets", "summary", "general"):
                result = await self.db.execute(
                    select(Asset.id, Asset.name, Asset.type, Asset.status, Asset.location)
                )
                assets = result.all()
                data["assets"] = [
                    {"id": str(a[0]), "name": a[1], "type": a[2], "status": a[3], "location": a[4]}
                    for a in assets
                ]
                data["total_assets"] = len(assets)
                data["critical_count"] = sum(1 for a in assets if a[3] == "critical")

            if intent in ("incidents", "summary", "general", "root_cause"):
                result = await self.db.execute(
                    select(Incident.id, Incident.title, Incident.severity, Incident.status, Incident.asset_id)
                    .order_by(Incident.created_at.desc())
                    .limit(20)
                )
                incidents = result.all()
                data["incidents"] = [
                    {"id": str(i[0]), "title": i[1], "severity": i[2], "status": i[3], "asset_id": str(i[4]) if i[4] else None}
                    for i in incidents
                ]
                data["active_incidents"] = sum(1 for i in incidents if i[3] in ("open", "investigating"))
                data["critical_incidents"] = sum(1 for i in incidents if i[2] == "critical" and i[3] in ("open", "investigating"))

            if intent == "maintenance":
                result = await self.db.execute(
                    select(Asset).where(Asset.status.in_(["maintenance", "offline"]))
                )
                maint_assets = result.scalars().all()
                data["maintenance_assets"] = [
                    {"name": a.name, "type": a.type, "status": a.status, "location": a.location}
                    for a in maint_assets
                ]

            if intent == "risk":
                risk_svc = RiskService(self.db)
                result = await self.db.execute(select(Asset))
                all_assets = result.scalars().all()
                risk_data = []
                for asset in all_assets:
                    try:
                        score = await risk_svc.calculate_asset_risk(asset.id)
                        risk_data.append({"asset": asset.name, "risk_score": score})
                    except Exception:
                        pass
                data["risk_scores"] = sorted(risk_data, key=lambda x: x["risk_score"], reverse=True)

        except Exception as e:
            logger.warning("Error querying enterprise data: %s", e)
            data["error"] = str(e)

        return data

    def _generate_response(
        self,
        message: str,
        intent: str,
        enterprise_data: dict[str, Any],
        rag_results: list[dict[str, Any]],
    ) -> tuple[str, float]:
        """Generate an explainable response based on enterprise data and RAG results."""
        lines: list[str] = []
        confidence = 0.7  # base confidence

        if intent == "summary":
            lines.append("## Enterprise Status Summary\n")
            total = enterprise_data.get("total_assets", 0)
            critical = enterprise_data.get("critical_count", 0)
            active_inc = enterprise_data.get("active_incidents", 0)
            critical_inc = enterprise_data.get("critical_incidents", 0)
            assets = enterprise_data.get("assets", [])

            lines.append(f"- **Total Assets:** {total}")
            lines.append(f"- **Critical Assets:** {critical}")
            lines.append(f"- **Active Incidents:** {active_inc}")
            lines.append(f"- **Critical Incidents:** {critical_inc}")
            lines.append("")

            if assets:
                by_status: dict[str, int] = {}
                for a in assets:
                    by_status[a["status"]] = by_status.get(a["status"], 0) + 1
                lines.append("### Asset Distribution by Status")
                for status, count in sorted(by_status.items()):
                    lines.append(f"- **{status.capitalize()}:** {count}")
                lines.append("")

            confidence = 0.95

        elif intent == "incidents":
            incidents = enterprise_data.get("incidents", [])
            if not incidents:
                lines.append("## Incident Report\n")
                lines.append("No incidents found in the system.")
                confidence = 0.5
            else:
                lines.append("## Active Incidents\n")
                active = [i for i in incidents if i["status"] in ("open", "investigating")]
                if active:
                    lines.append(f"**{len(active)}** incidents currently active:\n")
                    for inc in active[:10]:
                        lines.append(f"- **[{inc['severity'].upper()}]** {inc['title']} ({inc['status']})")
                else:
                    lines.append("No active incidents. All clear.")
                lines.append("")
                lines.append(f"Total incidents in record: {len(incidents)}")
            confidence = 0.9

        elif intent == "maintenance":
            maint = enterprise_data.get("maintenance_assets", [])
            if maint:
                lines.append("## Maintenance Status\n")
                lines.append(f"**{len(maint)}** assets currently in maintenance or offline:\n")
                for a in maint:
                    lines.append(f"- **{a['name']}** ({a['type']}) — {a['status']} — {a.get('location', 'N/A')}")
            else:
                lines.append("## Maintenance Status\n")
                lines.append("No assets currently in maintenance. All equipment appears operational.")
            confidence = 0.85

        elif intent == "risk":
            risk_scores = enterprise_data.get("risk_scores", [])
            if risk_scores:
                lines.append("## Risk Analysis\n")
                lines.append("Assets ranked by risk score (highest risk first):\n")
                for r in risk_scores[:10]:
                    level = "CRITICAL" if r["risk_score"] >= 0.7 else "HIGH" if r["risk_score"] >= 0.4 else "MODERATE" if r["risk_score"] >= 0.2 else "LOW"
                    lines.append(f"- **{r['asset']}** — Score: {r['risk_score']:.2f} ({level})")
            else:
                lines.append("## Risk Analysis\n")
                lines.append("Risk data is not yet available. Ensure assets and incidents are configured.")
            confidence = 0.8

        elif intent == "documents":
            if rag_results:
                lines.append("## Relevant Documents\n")
                for r in rag_results:
                    lines.append(f"- **{r['title']}** (from {r['source']})")
                    lines.append(f"  > {r['snippet']}")
                    lines.append("")
            else:
                lines.append("## Knowledge Base\n")
                lines.append("No directly relevant documents found. Try a different query.")
            confidence = 0.75

        elif intent == "root_cause":
            incidents = enterprise_data.get("incidents", [])
            critical_or_high = [i for i in incidents if i.get("severity") in ("critical", "high")]
            if critical_or_high:
                lines.append("## Root Cause Analysis\n")
                lines.append("Recent critical and high-severity incidents:\n")
                for inc in critical_or_high[:5]:
                    lines.append(f"- **{inc['title']}** ({inc['severity']}) — {inc['status']}")
                lines.append("\n### Recommended Actions\n")
                lines.append("1. Investigate each critical incident for common patterns")
                lines.append("2. Check if multiple incidents share the same asset or location")
                lines.append("3. Review recent maintenance activities for contributing factors")
            else:
                lines.append("## Root Cause Analysis\n")
                lines.append("No critical or high-severity incidents found for analysis.")
            confidence = 0.7

        else:
            # General intent — combine enterprise summary with RAG
            lines.append("## AI Analysis\n")
            lines.append("Based on available enterprise data and knowledge base, here is what I found:\n")

            total = enterprise_data.get("total_assets", 0)
            active_inc = enterprise_data.get("active_incidents", 0)
            if total:
                lines.append(f"- The system is tracking **{total}** assets with **{active_inc}** active incidents.\n")

            if rag_results:
                lines.append("### Relevant Knowledge\n")
                for r in rag_results[:2]:
                    lines.append(f"- **{r['title']}** — {r['snippet'][:100]}...\n")

            if enterprise_data.get("critical_count", 0) > 0:
                lines.append("⚠️ **Alert**: There are critical assets requiring immediate attention.\n")

            lines.append("How can I help you further? Try asking about specific assets, incidents, or documents.")

            confidence = 0.65

        return "\n".join(lines), min(confidence, 1.0)

    def _get_suggested_prompts(self, intent: str, data: dict[str, Any]) -> list[str]:
        """Generate context-aware suggested prompts."""
        prompts = list(SUGGESTED_PROMPTS)

        if data.get("critical_count", 0) > 0:
            prompts.insert(0, f"Why are {data['critical_count']} assets in critical status?")

        if data.get("active_incidents", 0) > 0:
            prompts.insert(1, "How do I resolve the active incidents?")

        return prompts[:5]

    @staticmethod
    def get_conversations() -> list[dict[str, Any]]:
        return sorted(
            _conversations.values(),
            key=lambda c: c["updated_at"],
            reverse=True,
        )

    @staticmethod
    def get_conversation(conv_id: str) -> dict[str, Any] | None:
        return _conversations.get(conv_id)

    @staticmethod
    def record_feedback(conv_id: str, message_index: int, feedback: str) -> None:
        conv = _conversations.get(conv_id)
        if conv and message_index < len(conv["messages"]):
            msg = conv["messages"][message_index]
            if "feedback" not in msg:
                msg["feedback"] = feedback
