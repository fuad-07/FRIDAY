from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    message: str = Field(..., min_length=1, description="User message")


class UploadResponse(BaseModel):
    filename: str
    chunks: int
    message: str


class ErrorResponse(BaseModel):
    detail: str
