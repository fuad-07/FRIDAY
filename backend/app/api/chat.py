import logging

from fastapi import APIRouter, HTTPException, status

from app.memory.session_memory import get_session_memory
from app.models.request_models import ChatRequest
from app.models.response_models import ChatResponse
from app.services.chat_service import handle_chat

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/session/{session_id}/files", summary="Get files uploaded in a session")
async def get_session_files(session_id: str):
    memory = get_session_memory()
    return {"session_files": memory.get_files(session_id)}


@router.post("/chat", response_model=ChatResponse, summary="Send a message to the AI assistant")
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        answer, session_files = handle_chat(request.session_id, request.message)
        return ChatResponse(answer=answer, session_files=session_files)
    except HTTPException:
        raise
    except ValueError as e:
        logger.error("Chat error: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected chat error: %s", str(e))
        raise HTTPException(status_code=500, detail="An internal error occurred")
