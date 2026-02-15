from __future__ import annotations

import csv
import os
import threading
import webbrowser
from dataclasses import dataclass
from typing import Any

from flask import Flask, flash, redirect, render_template, request, url_for


CATEGORIES = {
    1: {"name": "Firearms", "margin": 0.18},
    2: {"name": "Ammunition", "margin": 0.28},
    3: {"name": "Merchandise", "margin": 0.38},
}

INVENTORY_FILE = "inventory.csv"


@dataclass
class InventoryTotals:
    total_qty: int
    total_retail_value: float
    total_cost_value: float


def load_inventory() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    if not os.path.exists(INVENTORY_FILE):
        return items

    with open(INVENTORY_FILE, mode="r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if not row.get("upc"):
                continue
            items.append(
                {
                    "upc": row["upc"],
                    "category": int(row["category"]),
                    "retail_price": float(row["retail_price"]),
                    "quantity": int(row["quantity"]),
                    "estimated_cost": float(row["estimated_cost"]),
                }
            )
    return items


def save_inventory() -> None:
    with open(INVENTORY_FILE, mode="w", newline="", encoding="utf-8") as file:
        fieldnames = ["upc", "category", "retail_price", "quantity", "estimated_cost"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for item in inventory:
            writer.writerow(item)


def find_item_by_upc(upc: str) -> dict[str, Any] | None:
    for item in inventory:
        if item["upc"] == upc:
            return item
    return None


def recalculate_cost(item: dict[str, Any]) -> None:
    margin = CATEGORIES[item["category"]]["margin"]
    item["estimated_cost"] = item["retail_price"] * (1 - margin)


def compute_totals(items: list[dict[str, Any]]) -> InventoryTotals:
    total_qty = 0
    total_retail_value = 0.0
    total_cost_value = 0.0
    for item in items:
        qty = item["quantity"]
        total_qty += qty
        total_retail_value += item["retail_price"] * qty
        total_cost_value += item["estimated_cost"] * qty
    return InventoryTotals(
        total_qty=total_qty,
        total_retail_value=total_retail_value,
        total_cost_value=total_cost_value,
    )


def parse_category(raw: str) -> int | None:
    try:
        category = int(raw)
    except (TypeError, ValueError):
        return None
    if category not in CATEGORIES:
        return None
    return category


def parse_positive_float(raw: str) -> float | None:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if value <= 0:
        return None
    return value


def parse_optional_non_negative_float(raw: str) -> float | None:
    raw = (raw or "").strip()
    if raw == "":
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if value < 0:
        return None
    return value


def parse_non_negative_int(raw: str) -> int | None:
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return None
    if value < 0:
        return None
    return value


app = Flask(__name__)
app.secret_key = "inventory-management-dev-key"

inventory = load_inventory()


@app.get("/")
def index():
    upc = request.args.get("upc", "").strip()
    search_item = find_item_by_upc(upc) if upc else None
    totals = compute_totals(inventory)
    return render_template(
        "index.html",
        categories=CATEGORIES,
        inventory=inventory,
        totals=totals,
        search_query=upc,
        search_item=search_item,
    )


@app.post("/add")
def add_item():
    upc = request.form.get("upc", "").strip()
    category = parse_category(request.form.get("category", ""))
    retail = parse_positive_float(request.form.get("retail_price", ""))
    cost = parse_optional_non_negative_float(request.form.get("estimated_cost", ""))
    qty = parse_non_negative_int(request.form.get("quantity", ""))
    sync_details = request.form.get("sync_details") == "on"

    if not upc:
        flash("UPC is required.", "error")
        return redirect(url_for("index"))
    if category is None:
        flash("Select a valid category.", "error")
        return redirect(url_for("index"))
    if retail is None:
        flash("Retail price must be a positive number.", "error")
        return redirect(url_for("index"))
    if request.form.get("estimated_cost", "").strip() and cost is None:
        flash("Cost must be a non-negative number.", "error")
        return redirect(url_for("index"))
    if qty is None:
        flash("Quantity must be a non-negative integer.", "error")
        return redirect(url_for("index"))

    existing = find_item_by_upc(upc)
    if existing:
        existing["quantity"] += qty
        if sync_details:
            existing["category"] = category
            existing["retail_price"] = retail
            if cost is not None:
                existing["estimated_cost"] = cost
            else:
                recalculate_cost(existing)
        save_inventory()
        flash("Existing UPC updated: quantity added.", "success")
        return redirect(url_for("index"))

    estimated_cost = cost if cost is not None else retail * (1 - CATEGORIES[category]["margin"])
    inventory.append(
        {
            "upc": upc,
            "category": category,
            "retail_price": retail,
            "quantity": qty,
            "estimated_cost": estimated_cost,
        }
    )
    save_inventory()
    flash("Item added.", "success")
    return redirect(url_for("index"))


@app.post("/edit/<upc>")
def edit_item(upc: str):
    item = find_item_by_upc(upc)
    if not item:
        flash("Item not found.", "error")
        return redirect(url_for("index"))

    category = parse_category(request.form.get("category", ""))
    retail = parse_positive_float(request.form.get("retail_price", ""))
    cost = parse_optional_non_negative_float(request.form.get("estimated_cost", ""))
    qty = parse_non_negative_int(request.form.get("quantity", ""))

    if category is None or retail is None or qty is None or cost is None:
        flash("Edit failed. Check category, retail price, cost, and quantity values.", "error")
        return redirect(url_for("index"))

    item["category"] = category
    item["retail_price"] = retail
    item["estimated_cost"] = cost
    item["quantity"] = qty
    save_inventory()
    flash(f"UPC {upc} updated.", "success")
    return redirect(url_for("index"))


@app.post("/delete/<upc>")
def delete_item(upc: str):
    item = find_item_by_upc(upc)
    if not item:
        flash("Item not found.", "error")
        return redirect(url_for("index"))
    inventory.remove(item)
    save_inventory()
    flash(f"UPC {upc} deleted.", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    threading.Timer(0.7, lambda: webbrowser.open("http://127.0.0.1:5000")).start()
    app.run(host="127.0.0.1", port=5000, debug=False)
