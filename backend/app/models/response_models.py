from pydantic import BaseModel, Field


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Assistant response")
    session_files: list[str] = Field(default=[], description="Files uploaded in this session")
