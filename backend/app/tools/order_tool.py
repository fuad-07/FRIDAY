import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

ORDERS_PATH = Path(__file__).resolve().parents[2] / "data" / "orders.json"


def _load_orders() -> list[dict]:
    if not ORDERS_PATH.exists():
        logger.warning("Orders file not found at %s", ORDERS_PATH)
        return []
    with open(ORDERS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_order_status(order_id: str) -> Optional[dict]:
    orders = _load_orders()
    for order in orders:
        if order["order_id"].upper() == order_id.upper():
            return {
                "order_id": order["order_id"],
                "customer": order.get("customer", ""),
                "order_date": order.get("order_date", ""),
                "status": order["status"],
                "estimated_delivery": order["estimated_delivery"],
                "items": order["items"],
            }
    return None
