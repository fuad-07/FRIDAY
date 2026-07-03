import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    def __init__(self) -> None:
        api_key = settings.groq_api_key
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment or .env file")
        self.client = Groq(api_key=api_key)
        self.model = settings.llm_model

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1024,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Groq API call failed: %s", str(e))
            raise
