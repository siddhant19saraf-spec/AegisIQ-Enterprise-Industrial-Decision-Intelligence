"""
Vector store for Enterprise RAG.

Supports Qdrant as primary backend with an in-memory fallback
when Qdrant server is not available.
"""

from __future__ import annotations

import hashlib
import logging
import math
from typing import Any

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 384


def generate_embedding(text: str) -> list[float]:
    """
    Generate a pseudo-embedding for text using character n-gram hashing.
    Produces consistent vectors for the same text (deterministic).
    Falls back to this when no real embedding model is available.
    """
    dim = EMBEDDING_DIMENSION
    vec = [0.0] * dim

    text_lower = text.lower()
    for n in range(1, 4):
        for i in range(len(text_lower) - n + 1):
            gram = text_lower[i:i + n]
            h = int(hashlib.md5(gram.encode()).hexdigest(), 16)
            idx = h % dim
            val = (h >> 16) & 0xFF
            vec[idx] += val / 256.0

    mag = math.sqrt(sum(v * v for v in vec))
    if mag > 0:
        vec = [v / mag for v in vec]

    return vec


class ChunkData:
    """Represents a single document chunk with its embedding."""

    def __init__(self, chunk_id: str, document_id: str, content: str,
                 chunk_index: int, embedding: list[float],
                 metadata: dict | None = None):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.content = content
        self.chunk_index = chunk_index
        self.embedding = embedding
        self.metadata = metadata or {}


class InMemoryVectorStore:
    """In-memory vector store with cosine similarity search."""

    def __init__(self):
        self.chunks: dict[str, ChunkData] = {}

    def upsert(self, chunk: ChunkData) -> None:
        self.chunks[chunk.chunk_id] = chunk

    def search(self, query_embedding: list[float], top_k: int = 5,
               metadata_filter: dict | None = None) -> list[dict[str, Any]]:
        scored: list[tuple[float, ChunkData]] = []

        for chunk in self.chunks.values():
            if metadata_filter:
                match = True
                for k, v in metadata_filter.items():
                    if chunk.metadata.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            score = self._cosine_similarity(query_embedding, chunk.embedding)
            scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = scored[:top_k]

        return [
            {
                "chunk_id": chunk.chunk_id,
                "document_id": chunk.document_id,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "relevance": round(score, 4),
                "metadata": chunk.metadata,
            }
            for score, chunk in results
        ]

    def delete_document(self, document_id: str) -> int:
        ids_to_delete = [
            cid for cid, chunk in self.chunks.items()
            if chunk.document_id == document_id
        ]
        for cid in ids_to_delete:
            del self.chunks[cid]
        return len(ids_to_delete)

    def count(self) -> int:
        return len(self.chunks)

    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)


class VectorStore:
    """
    Vector store abstraction. Attempts Qdrant first, falls back to in-memory.
    """

    def __init__(self):
        self._memory = InMemoryVectorStore()
        self._use_qdrant = False
        self._qdrant_client = None
        self._collection_name = "aegisiq_rag"

        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http.exceptions import UnexpectedResponse

            client = QdrantClient(host="localhost", port=6333, timeout=2.0)
            client.get_collections()
            self._qdrant_client = client
            self._use_qdrant = True

            try:
                client.get_collection(self._collection_name)
            except UnexpectedResponse:
                from qdrant_client.http import models as qmodels
                client.create_collection(
                    collection_name=self._collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=EMBEDDING_DIMENSION,
                        distance=qmodels.Distance.COSINE,
                    ),
                )
            logger.info("Connected to Qdrant at localhost:6333")
        except Exception as e:
            logger.warning("Qdrant not available at localhost:6333 (%s), using in-memory store", e)
            self._use_qdrant = False

    def _get_qdrant(self):
        if self._use_qdrant and self._qdrant_client:
            return self._qdrant_client
        return None

    def upsert(self, chunk: ChunkData) -> None:
        qdrant = self._get_qdrant()
        if qdrant:
            try:
                from qdrant_client.http import models as qmodels
                qdrant.upsert(
                    collection_name=self._collection_name,
                    points=[qmodels.PointStruct(
                        id=hash(chunk.chunk_id) % (2**63),
                        vector=chunk.embedding,
                        payload={
                            "chunk_id": chunk.chunk_id,
                            "document_id": chunk.document_id,
                            "content": chunk.content[:2000],
                            "chunk_index": chunk.chunk_index,
                            **chunk.metadata,
                        },
                    )],
                )
                return
            except Exception as e:
                logger.warning("Qdrant upsert failed, falling back: %s", e)
                self._use_qdrant = False
        self._memory.upsert(chunk)

    def search(self, query_embedding: list[float], top_k: int = 5,
               metadata_filter: dict | None = None) -> list[dict[str, Any]]:
        qdrant = self._get_qdrant()
        if qdrant:
            try:
                from qdrant_client.http import models as qmodels
                qfilter = None
                if metadata_filter:
                    conditions = [
                        qmodels.FieldCondition(
                            key=k,
                            match=qmodels.MatchValue(value=v),
                        )
                        for k, v in metadata_filter.items()
                    ]
                    qfilter = qmodels.Filter(must=conditions) if conditions else None

                results = qdrant.search(
                    collection_name=self._collection_name,
                    query_vector=query_embedding,
                    limit=top_k,
                    query_filter=qfilter,
                )
                return [
                    {
                        "chunk_id": r.payload.get("chunk_id", ""),
                        "document_id": r.payload.get("document_id", ""),
                        "content": r.payload.get("content", ""),
                        "chunk_index": r.payload.get("chunk_index", 0),
                        "relevance": round(r.score, 4),
                        "metadata": {k: v for k, v in r.payload.items()
                                     if k not in ("chunk_id", "document_id", "content", "chunk_index")},
                    }
                    for r in results
                ]
            except Exception as e:
                logger.warning("Qdrant search failed, falling back: %s", e)
                self._use_qdrant = False
        return self._memory.search(query_embedding, top_k, metadata_filter)

    def delete_document(self, document_id: str) -> int:
        qdrant = self._get_qdrant()
        if qdrant:
            try:
                from qdrant_client.http import models as qmodels
                qdrant.delete(
                    collection_name=self._collection_name,
                    points_selector=qmodels.FilterSelector(
                        filter=qmodels.Filter(
                            must=[
                                qmodels.FieldCondition(
                                    key="document_id",
                                    match=qmodels.MatchValue(value=document_id),
                                )
                            ]
                        )
                    ),
                )
            except Exception as e:
                logger.warning("Qdrant delete failed: %s", e)
        return self._memory.delete_document(document_id)

    def count(self) -> int:
        qdrant = self._get_qdrant()
        if qdrant:
            try:
                count_result = qdrant.count(self._collection_name)
                return count_result.count
            except Exception:
                pass
        return self._memory.count()


vector_store = VectorStore()
