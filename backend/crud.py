from sqlalchemy.orm import Session
from sqlalchemy import extract
from collections import defaultdict
from datetime import date
import models
import schemas

# --- Simple keyword-based auto-categorization ---
KEYWORD_MAP = {
    "amazon": "Shopping",
    "flipkart": "Shopping",
    "swiggy": "Food & Dining",
    "zomato": "Food & Dining",
    "uber": "Transport",
    "ola": "Transport",
    "netflix": "Subscriptions",
    "spotify": "Subscriptions",
    "prime video": "Subscriptions",
    "electricity": "Utilities",
    "bescom": "Utilities",
    "airtel": "Utilities",
    "jio": "Utilities",
    "rent": "Housing",
    "salary": "Income",
    "grocery": "Groceries",
    "bigbasket": "Groceries",
    "dmart": "Groceries",
}


def guess_category_name(merchant: str) -> str:
    merchant_lower = merchant.lower()
    for keyword, category in KEYWORD_MAP.items():
        if keyword in merchant_lower:
            return category
    return "Uncategorized"


def get_or_create_category(db: Session, name: str) -> models.Category:
    category = db.query(models.Category).filter(models.Category.name == name).first()
    if category:
        return category
    category = models.Category(name=name, budget_limit=None)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# --- Category CRUD ---
def get_categories(db: Session):
    return db.query(models.Category).all()


def create_category(db: Session, category: schemas.CategoryCreate):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        existing.budget_limit = category.budget_limit
        db.commit()
        db.refresh(existing)
        return existing
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category


# --- Transaction CRUD ---
def get_transactions(db: Session, month: int = None, year: int = None):
    query = db.query(models.Transaction)
    if month and year:
        query = query.filter(
            extract("month", models.Transaction.date) == month,
            extract("year", models.Transaction.date) == year,
        )
    return query.order_by(models.Transaction.date.desc()).all()


def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    data = transaction.model_dump()
    if not data.get("category_id"):
        guessed_name = guess_category_name(data["merchant"])
        category = get_or_create_category(db, guessed_name)
        data["category_id"] = category.id
    db_transaction = models.Transaction(**data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_transaction(db: Session, transaction_id: int):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
    return db_transaction


def bulk_create_transactions(db: Session, transactions: list[schemas.TransactionCreate]):
    created = []
    for t in transactions:
        created.append(create_transaction(db, t))
    return created


# --- Budget status ---
def get_budget_status(db: Session, month: int, year: int):
    categories = db.query(models.Category).all()
    results = []
    for cat in categories:
        if cat.budget_limit is None:
            continue
        txns = (
            db.query(models.Transaction)
            .filter(
                models.Transaction.category_id == cat.id,
                extract("month", models.Transaction.date) == month,
                extract("year", models.Transaction.date) == year,
                models.Transaction.amount > 0,
            )
            .all()
        )
        spent = sum(t.amount for t in txns)
        percent = (spent / cat.budget_limit * 100) if cat.budget_limit else None
        results.append(
            schemas.BudgetStatus(
                category_id=cat.id,
                category_name=cat.name,
                budget_limit=cat.budget_limit,
                spent=spent,
                percent_used=round(percent, 1) if percent is not None else None,
            )
        )
    return results


# --- Recurring transaction detection ---
def detect_recurring(db: Session):
    """
    Groups transactions by merchant. Flags as recurring if the merchant
    appears in >=2 distinct months with amounts within 10% of the average.
    """
    all_txns = db.query(models.Transaction).filter(models.Transaction.amount > 0).all()
    by_merchant = defaultdict(list)
    for t in all_txns:
        by_merchant[t.merchant.strip().lower()].append(t)

    recurring = []
    for merchant, txns in by_merchant.items():
        months = set((t.date.year, t.date.month) for t in txns)
        if len(months) < 2:
            continue
        amounts = [t.amount for t in txns]
        avg = sum(amounts) / len(amounts)
        if avg == 0:
            continue
        within_tolerance = all(abs(a - avg) / avg <= 0.10 for a in amounts)
        if within_tolerance:
            last_date = max(t.date for t in txns)
            category_name = txns[0].category.name if txns[0].category else None
            recurring.append(
                schemas.RecurringItem(
                    merchant=txns[0].merchant,
                    average_amount=round(avg, 2),
                    occurrences=len(txns),
                    category_name=category_name,
                    last_date=last_date,
                )
            )
    return sorted(recurring, key=lambda r: r.last_date, reverse=True)
