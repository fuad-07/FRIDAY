import logging
from typing import Optional

from google import genai
from google.genai import types as genai_types

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self) -> None:
        api_key = settings.gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in environment or .env file")
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash-lite"

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        contents = [
            genai_types.Content(
                role="user",
                parts=[genai_types.Part.from_text(text=user_prompt)],
            )
        ]
        system_instruction = genai_types.Content(
            role="user",
            parts=[genai_types.Part.from_text(text=system_prompt)],
        )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=1024,
                    temperature=0.3,
                ),
            )
            return response.text
        except Exception as e:
            logger.error("Gemini API call failed: %s", str(e))
            raise
