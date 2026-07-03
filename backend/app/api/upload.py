import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query

from app.ingestion.loader import load_document, SUPPORTED_EXTENSIONS
from app.ingestion.splitter import split_documents
from app.ingestion.vector_store import store_chunks
from app.memory.session_memory import get_session_memory
from app.models.request_models import UploadResponse

logger = logging.getLogger(__name__)

router = APIRouter()
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


@router.post("/upload", response_model=UploadResponse, summary="Upload a document for ingestion")
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Query(default=""),
) -> UploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / file.filename

    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")
        file_path.write_bytes(content)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to save uploaded file: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    try:
        documents = load_document(str(file_path))
        if not documents:
            raise HTTPException(status_code=400, detail="No content could be extracted from the file")

        chunks = split_documents(documents)
        chunk_count = store_chunks(chunks, session_id=session_id)

        if session_id:
            memory = get_session_memory()
            memory.add_file(session_id, file.filename)

        logger.info("Ingested %s: %d chunks stored", file.filename, chunk_count)

        return UploadResponse(
            filename=file.filename,
            chunks=chunk_count,
            message=f"Successfully ingested '{file.filename}' ({chunk_count} chunks).",
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Ingestion pipeline failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Document processing failed")
