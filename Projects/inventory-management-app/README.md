# Inventory Management Web App

Web-based inventory manager with CSV persistence and UPC-focused workflows.

## Features

- Premium, responsive dashboard UI
- Add inventory by UPC, category, retail price, cost, and quantity
- Cost entry options:
  - Leave cost blank on add to auto-calculate from category margin
  - Enter cost manually on add
  - Edit cost directly on existing items
- Duplicate UPC merge behavior:
  - Quantity is added to existing record
  - Optional checkbox updates category and retail price too
- Search by UPC
- Edit existing items inline
- Delete items with confirmation
- Live totals:
  - Item count
  - Unit count
  - Total retail value
  - Total estimated cost value
- Persistent storage in `inventory.csv`

## Setup

From `Projects/inventory-management-app`:

```bash
python -m pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Then open:

`http://127.0.0.1:5000`

## One-click Windows launch

Double-click:

`start_inventory_app.bat`
