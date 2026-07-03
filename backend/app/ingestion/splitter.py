import logging
from typing import Any

from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


def split_documents(documents: list[dict]) -> list[dict]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    all_chunks = []
    for doc in documents:
        text = doc["text"]
        base_metadata = doc["metadata"]
        chunks = text_splitter.split_text(text)

        for idx, chunk_text in enumerate(chunks):
            all_chunks.append({
                "text": chunk_text,
                "metadata": {
                    **base_metadata,
                    "chunk_id": idx,
                },
            })

    logger.info("Split %d documents into %d chunks", len(documents), len(all_chunks))
    return all_chunks
