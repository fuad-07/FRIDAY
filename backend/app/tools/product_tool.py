import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

PRODUCTS_PATH = Path(__file__).resolve().parents[2] / "data" / "products.json"


def _load_products() -> list[dict]:
    if not PRODUCTS_PATH.exists():
        logger.warning("Products file not found at %s", PRODUCTS_PATH)
        return []
    with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def search_product(product_name: str) -> Optional[dict]:
    products = _load_products()
    query = product_name.lower()
    best_match = None
    best_score = 0

    query_words = set(query.split())

    for product in products:
        name = product["name"].lower()

        if query not in name and name not in query:
            continue

        name_words = set(name.split())
        token_score = len(query_words & name_words)

        score = token_score * 10
        if name == query:
            score += 100
        elif query in name:
            score += 5

        if score > best_score:
            best_score = score
            best_match = product

    if best_match:
        return {
            "name": best_match["name"],
            "price": best_match["price"],
            "stock": best_match["stock"],
            "category": best_match.get("category", ""),
            "description": best_match["description"],
        }

    return None
