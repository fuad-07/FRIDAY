import logging
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, TextLoader

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md"}


def load_document(file_path: str) -> list[dict]:
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}")

    logger.info("Loading document: %s", file_path)

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        docs = []
        for page in pages:
            docs.append({
                "text": page.page_content,
                "metadata": {
                    "filename": path.name,
                    "page_number": page.metadata.get("page", 1),
                },
            })
        return docs

    if ext in (".txt", ".md"):
        loader = TextLoader(file_path, encoding="utf-8")
        documents = loader.load()
        return [
            {
                "text": documents[0].page_content,
                "metadata": {
                    "filename": path.name,
                },
            }
        ]

    return []
