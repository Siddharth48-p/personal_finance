from pydantic import BaseModel
from datetime import date
from typing import Optional


class CategoryBase(BaseModel):
    name: str
    budget_limit: Optional[float] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    date: date
    merchant: str
    amount: float
    note: Optional[str] = None
    category_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


class BudgetStatus(BaseModel):
    category_id: int
    category_name: str
    budget_limit: Optional[float]
    spent: float
    percent_used: Optional[float]


class RecurringItem(BaseModel):
    merchant: str
    average_amount: float
    occurrences: int
    category_name: Optional[str]
    last_date: date
