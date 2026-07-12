"""
Query processing for Enterprise RAG.

Combines vector search with AI response generation.
Every answer includes supporting citations, confidence, and chunk references.
"""

from __future__ import annotations

import logging
from typing import Any

from app.rag.schemas import Citation, RAGQueryResponse
from app.rag.vector_store import generate_embedding, vector_store

logger = logging.getLogger(__name__)


def build_answer(results: list[dict[str, Any]], query: str) -> RAGQueryResponse:
    """Build a response from retrieved chunks with citations."""
    if not results:
        return RAGQueryResponse(
            answer="I could not find any relevant information in the knowledge base to answer your question.",
            citations=[],
            confidence=0.0,
            total_chunks_retrieved=0,
        )

    citations_list: list[Citation] = []
    seen_docs: set[str] = set()
    total_relevance = 0.0

    for r in results:
        doc_id = r.get("document_id", "")
        if doc_id:
            seen_docs.add(doc_id)
        total_relevance += r.get("relevance", 0)

        citations_list.append(Citation(
            source=r.get("metadata", {}).get("source", "unknown"),
            title=r.get("metadata", {}).get("title", "Untitled"),
            document_id=doc_id,
            chunk_index=r.get("chunk_index", 0),
            content=r.get("content", ""),
            relevance=r.get("relevance", 0),
            chunk_id=r.get("chunk_id", ""),
        ))

    avg_relevance = total_relevance / len(results) if results else 0
    confidence = min(avg_relevance + 0.3, 1.0)

    # Build answer from chunks
    answer_parts: list[str] = []
    query_lower = query.lower()

    # Check if this looks like a question about procedures or facts
    best_chunks = sorted(results, key=lambda r: r.get("relevance", 0), reverse=True)

    if any(w in query_lower for w in ["what", "how", "why", "when", "where", "who", "explain", "describe"]):
        # Question-answering mode
        top = best_chunks[0]
        answer_parts.append(f"Based on the document '{top.get('metadata', {}).get('title', 'Untitled')}':")
        answer_parts.append("")
        answer_parts.append(top.get("content", ""))
        if len(best_chunks) > 1:
            answer_parts.append("")
            answer_parts.append("Additional context:")
            for chunk in best_chunks[1:3]:
                answer_parts.append(f"- {chunk.get('content', '')[:200]}...")
    else:
        # Summary mode
        answer_parts.append(f"I found {len(results)} relevant passages from {len(seen_docs)} document(s):")
        answer_parts.append("")
        for i, chunk in enumerate(best_chunks[:3]):
            title = chunk.get("metadata", {}).get("title", "Untitled")
            content = chunk.get("content", "")
            answer_parts.append(f"**{i + 1}. From '{title}'**")
            answer_parts.append(content)
            answer_parts.append("")

    answer = "\n".join(answer_parts)

    return RAGQueryResponse(
        answer=answer,
        citations=citations_list,
        confidence=round(confidence, 2),
        total_chunks_retrieved=len(results),
    )


def query_knowledge_base(query: str, top_k: int = 5,
                         category: str | None = None,
                         min_confidence: float = 0.0) -> RAGQueryResponse:
    """Query the enterprise knowledge base with semantic search."""
    query_embedding = generate_embedding(query)

    metadata_filter = {}
    if category:
        metadata_filter["category"] = category

    results = vector_store.search(
        query_embedding=query_embedding,
        top_k=top_k,
        metadata_filter=metadata_filter if metadata_filter else None,
    )

    response = build_answer(results, query)

    # Apply min_confidence filter
    if response.confidence < min_confidence:
        return RAGQueryResponse(
            answer=f"I found relevant information, but the confidence level ({response.confidence:.0%}) is below your "
                   f"minimum threshold ({min_confidence:.0%}). Please try a more specific query or lower the threshold.",
            citations=[],
            confidence=response.confidence,
            total_chunks_retrieved=response.total_chunks_retrieved,
        )

    return response
