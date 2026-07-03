import logging
import re

logger = logging.getLogger(__name__)


class Intent:
    TOOL = "TOOL"
    KNOWLEDGE_RETRIEVAL = "KNOWLEDGE_RETRIEVAL"
    DIRECT_CHAT = "DIRECT_CHAT"


_ORDER_PATTERNS = [
    re.compile(r"(?i)(?:where\s+(?:is|are)\s+my\s+order|order\s+status|track\s+(?:my\s+)?order)"),
    re.compile(r"(?i)(?:order\s+#?)([A-Za-z]{0,5}\d{2,})"),
    re.compile(r"(?i)(?:status\s+of\s+(?:order\s+)?#?)([A-Za-z]{0,5}\d{2,})"),
]

_PRODUCT_PATTERNS = [
    re.compile(r"(?i)(?:do\s+you\s+(?:have|sell)|(?:is\s+there|are\s+there)\s+(?:a|an|any))\s+.+"),
    re.compile(r"(?i)(?:looking\s+for|search(?:ing)?\s+for|find|need)\s+.+"),
    re.compile(r"(?i)(?:price|cost|how\s+much)\s+(?:of|is|for)\s+.+"),
    re.compile(r"(?i)(?:in\s+stock|available|stock\s+of)\s+.+"),
]

_GREETING_PATTERNS = [
    re.compile(r"(?i)^(?:hi|hello|hey|greetings|good\s+(?:morning|afternoon|evening))\b"),
    re.compile(r"(?i)^(?:how\s+are\s+you|what's\s+up|sup)\b"),
    re.compile(r"^(?:bye|goodbye|see\s+you)\b"),
    re.compile(r"(?i)^(?:thanks|thank\s+you|ty)\b"),
]

_SELF_INTRO_PATTERNS = [
    re.compile(r"(?i)^my\s+name\s+is\b"),
    re.compile(r"(?i)^(?:i'?m|i\s+am)\s+\w+\b"),
    re.compile(r"(?i)^call\s+me\b"),
    re.compile(r"(?i)^nice\s+to\s+meet\b"),
]


def _matches_any(text: str, patterns: list[re.Pattern]) -> bool:
    return any(p.search(text) for p in patterns)


def classify_intent(message: str, history: list[dict] | None = None) -> str:
    if _matches_any(message, _ORDER_PATTERNS):
        logger.info("Intent classified as TOOL (order)")
        return Intent.TOOL

    if _matches_any(message, _PRODUCT_PATTERNS):
        logger.info("Intent classified as TOOL (product)")
        return Intent.TOOL

    if _matches_any(message, _GREETING_PATTERNS):
        logger.info("Intent classified as DIRECT_CHAT")
        return Intent.DIRECT_CHAT

    if _matches_any(message, _SELF_INTRO_PATTERNS):
        logger.info("Intent classified as DIRECT_CHAT (self-introduction)")
        return Intent.DIRECT_CHAT

    if _is_contextual_follow_up(message, history):
        logger.info("Intent classified as DIRECT_CHAT (contextual)")
        return Intent.DIRECT_CHAT

    logger.info("Intent classified as KNOWLEDGE_RETRIEVAL")
    return Intent.KNOWLEDGE_RETRIEVAL


def _is_contextual_follow_up(message: str, history: list[dict] | None) -> bool:
    if not history:
        return False

    pronouns = {"it", "they", "them", "that", "those", "this", "these", "he", "she", "his", "her", "its", "my", "your", "our", "their"}
    words = set(message.lower().split())
    if words & pronouns:
        return True

    # Check if previous user message was a tool query (short follow-up likely continues that topic)
    last_user_msg = None
    for msg in reversed(history):
        if msg["role"] == "user":
            last_user_msg = msg["content"]
            break
    if last_user_msg and len(message.split()) < 6:
        if _matches_any(last_user_msg, _ORDER_PATTERNS + _PRODUCT_PATTERNS):
            return True

    return False
