import logging
import json

from app.llm.groq_client import GroqClient
from app.memory.session_memory import get_session_memory
from app.services.intent_router import classify_intent, Intent
from app.rag.retriever import retrieve
from app.rag.prompt_builder import build_system_prompt, build_user_prompt
from app.tools.order_tool import get_order_status
from app.tools.product_tool import search_product

logger = logging.getLogger(__name__)


def _format_history(history: list[dict]) -> str:
    lines = []
    for msg in history:
        role = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


def handle_chat(session_id: str, message: str) -> tuple[str, list[str]]:
    memory = get_session_memory()
    history = memory.get_history(session_id)

    intent = classify_intent(message, history)
    logger.info("Session %s | Intent: %s | Message: %s", session_id, intent, message)

    context = None
    tool_result = None

    if intent == Intent.TOOL:
        tool_result = _execute_tool(message)
        if tool_result:
            logger.info("Tool result obtained for session %s", session_id)
    elif intent == Intent.KNOWLEDGE_RETRIEVAL:
        context = retrieve(message, session_id=session_id)
        if context:
            logger.info("Context retrieved for session %s", session_id)
    else:
        logger.info("Direct chat for session %s", session_id)

    system_prompt = build_system_prompt()
    history_text = _format_history(history) if history else None
    user_prompt = build_user_prompt(
        message=message,
        context=context,
        history=history_text,
        tool_result=tool_result,
    )

    client = GroqClient()
    try:
        answer = client.generate(system_prompt, user_prompt)
    except Exception as e:
        logger.error("LLM generation failed for session %s: %s", session_id, str(e))
        error_msg = str(e)
        if "API_KEY" in error_msg.upper() or "invalid API key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            answer = "The AI service is not configured correctly. Please check your API key in the .env file."
        elif "rate_limit" in error_msg.lower() or "too many requests" in error_msg.lower():
            answer = "The AI service rate limit has been reached. Please wait a moment and try again."
        else:
            answer = f"The AI service returned an error: {error_msg[:200]}"

    memory.add_message(session_id, "user", message)
    memory.add_message(session_id, "assistant", answer)

    return answer, memory.get_files(session_id)


def _execute_tool(message: str) -> str | None:
    import re

    order_pattern = re.compile(r"(?i)([A-Za-z]{0,5}\d{2,})")
    order_match = order_pattern.search(message)

    if order_match:
        order_id = order_match.group(1)
        result = get_order_status(order_id)
        if result:
            return json.dumps(result, indent=2)
        return json.dumps({"error": f"Order {order_id} not found."})

    product_result = search_product(message)
    if product_result:
        return json.dumps(product_result, indent=2)

    return None
