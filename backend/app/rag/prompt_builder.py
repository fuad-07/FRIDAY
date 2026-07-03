SYSTEM_PROMPT = """You are a helpful AI assistant. Follow these rules strictly:

1. Use the provided context from uploaded documents to answer knowledge-based questions. Do not use your own knowledge for these questions.
2. Use the provided conversation history to maintain context and answer follow-up questions naturally.
3. If you use retrieved context, cite the source implicitly but concisely.
4. If no relevant context is available and the question requires knowledge (not chat), say: "I couldn't find that information in the uploaded documents."
5. Do not hallucinate or make up information outside the provided context.
6. Keep answers concise and helpful.
7. For greetings, casual chat, or general conversation, respond naturally without needing context."""


def build_system_prompt() -> str:
    return SYSTEM_PROMPT.strip()


def build_user_prompt(
    message: str,
    context: str | None = None,
    history: str | None = None,
    tool_result: str | None = None,
) -> str:
    parts = []

    if history:
        parts.append(f"Conversation History:\n{history}")

    if context:
        parts.append(f"Retrieved Context:\n{context}")

    if tool_result:
        parts.append(f"Tool Result:\n{tool_result}")

    parts.append(f"User Message: {message}")

    return "\n\n".join(parts)
