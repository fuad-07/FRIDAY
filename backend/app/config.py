from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    groq_api_key: str = ""
    gemini_api_key: str = ""
    llm_model: str = "llama-3.1-8b-instant"
    chroma_path: str = "./chroma_db"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    top_k: int = 8
    similarity_threshold: float = 0.25

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
