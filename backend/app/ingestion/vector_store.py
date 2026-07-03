import logging
import uuid
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "documents"


def get_chroma_client() -> chromadb.PersistentClient:
    chroma_path = Path(settings.chroma_path)
    chroma_path.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(
        path=str(chroma_path),
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    return client


def store_chunks(chunks: list[dict], session_id: str = "") -> int:
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    ids = []
    texts = []
    metadatas = []

    from app.ingestion.embeddings import generate_embeddings

    for chunk in chunks:
        chunk_id = str(uuid.uuid4())
        ids.append(chunk_id)
        texts.append(chunk["text"])
        meta = {**chunk["metadata"]}
        if session_id:
            meta["session_id"] = session_id
        metadatas.append(meta)

    embeddings = generate_embeddings(texts)

    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    logger.info("Stored %d chunks in ChromaDB", len(chunks))
    return len(chunks)


def get_collection() -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(name=COLLECTION_NAME)
