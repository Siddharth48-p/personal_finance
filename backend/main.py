import csv
import io
from datetime import datetime, date
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import crud
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ledger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "Ledger API running"}


# --- Categories ---
@app.get("/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@app.post("/categories", response_model=schemas.CategoryOut)
def add_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, category)


@app.delete("/categories/{category_id}")
def remove_category(category_id: int, db: Session = Depends(get_db)):
    result = crud.delete_category(db, category_id)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}


# --- Transactions ---
@app.get("/transactions", response_model=List[schemas.TransactionOut])
def list_transactions(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_transactions(db, month, year)


@app.post("/transactions", response_model=schemas.TransactionOut)
def add_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db, transaction)


@app.delete("/transactions/{transaction_id}")
def remove_transaction(transaction_id: int, db: Session = Depends(get_db)):
    result = crud.delete_transaction(db, transaction_id)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"ok": True}


@app.post("/transactions/upload-csv", response_model=List[schemas.TransactionOut])
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Expects CSV with columns: date, merchant, amount, [note]
    date format: YYYY-MM-DD. amount: positive = expense, negative = income.
    """
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    required_cols = {"date", "merchant", "amount"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {required_cols}. Found: {reader.fieldnames}",
        )

    parsed = []
    for row in reader:
        try:
            txn_date = datetime.strptime(row["date"].strip(), "%Y-%m-%d").date()
        except ValueError:
            continue  # skip malformed rows
        try:
            amount = float(row["amount"])
        except (ValueError, KeyError):
            continue
        parsed.append(
            schemas.TransactionCreate(
                date=txn_date,
                merchant=row["merchant"].strip(),
                amount=amount,
                note=row.get("note", "").strip() if row.get("note") else None,
            )
        )

    return crud.bulk_create_transactions(db, parsed)


# --- Budgets ---
@app.get("/budgets/status", response_model=List[schemas.BudgetStatus])
def budget_status(month: int = None, year: int = None, db: Session = Depends(get_db)):
    if not month or not year:
        today = date.today()
        month, year = today.month, today.year
    return crud.get_budget_status(db, month, year)


# --- Recurring ---
@app.get("/recurring", response_model=List[schemas.RecurringItem])
def recurring_transactions(db: Session = Depends(get_db)):
    return crud.detect_recurring(db)
