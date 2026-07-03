import logging
from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger(__name__)

_embedding_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is not None:
        return _embedding_model

    model_name = settings.embedding_model
    try:
        logger.info("Loading embedding model: %s", model_name)
        _embedding_model = SentenceTransformer(model_name)
    except Exception:
        fallback = "all-MiniLM-L6-v2"
        logger.warning("Failed to load %s, falling back to %s", model_name, fallback)
        _embedding_model = SentenceTransformer(fallback)

    return _embedding_model


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    embeddings = model.encode(texts, show_progress_bar=False).tolist()
    return embeddings
