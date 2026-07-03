import logging
from typing import Optional

from app.config import settings
from app.ingestion.vector_store import get_collection
from app.ingestion.embeddings import generate_embeddings

logger = logging.getLogger(__name__)


def retrieve(query: str, session_id: str = "") -> Optional[str]:
    collection = get_collection()
    count = collection.count()
    if count == 0:
        logger.warning("Vector database is empty")
        return None

    query_embedding = generate_embeddings([query])[0]

    where_filter = {"session_id": session_id} if session_id else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=settings.top_k,
        include=["documents", "distances", "metadatas"],
        where=where_filter,
    )

    if not results["documents"] or not results["documents"][0]:
        if session_id:
            logger.info("No results in session %s, falling back to all documents", session_id)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=settings.top_k,
                include=["documents", "distances", "metadatas"],
            )
        else:
            return None

    if not results["documents"] or not results["documents"][0]:
        return None

    documents = results["documents"][0]
    distances = results["distances"][0]

    scored_chunks = []
    for doc, dist in zip(documents, distances):
        similarity = 1 - dist
        scored_chunks.append((doc, similarity))

    passed = [(doc, sim) for doc, sim in scored_chunks if sim >= settings.similarity_threshold]

    if passed:
        context = "\n\n".join(doc for doc, _ in passed)
        logger.info("Retrieved %d relevant chunks for query (threshold=%.2f)", len(passed), settings.similarity_threshold)
        return context

    if scored_chunks:
        best_doc, best_sim = scored_chunks[0]
        logger.info("No chunks above threshold (best=%.4f), returning top chunk as fallback", best_sim)
        return best_doc

    return None
