from sqlalchemy import String, Float, Integer, DateTime, func, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List
import enum

from app.db.base import Base

class CashRegisterStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class TransactionType(str, enum.Enum):
    OPENING_BALANCE = "OPENING_BALANCE"
    SALE_PAYMENT = "SALE_PAYMENT"
    SUPPLY = "SUPPLY"
    WITHDRAWAL = "WITHDRAWAL"
    CLOSING_BALANCE = "CLOSING_BALANCE"

class CashRegister(Base):
    __tablename__ = "cash_registers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # --- CORREÇÃO APLICADA AQUI ---
    # Adicionamos a referência para qual loja este caixa pertence.
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    # -----------------------------
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    status: Mapped[CashRegisterStatus] = mapped_column(
        SQLAlchemyEnum(CashRegisterStatus), 
        nullable=False, 
        default=CashRegisterStatus.OPEN
    )
    
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False)
    closing_balance: Mapped[float] = mapped_column(Float, nullable=True)
    
    expected_balance: Mapped[float] = mapped_column(Float, nullable=True) 
    balance_difference: Mapped[float] = mapped_column(Float, nullable=True)

    opened_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    closed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(lazy="selectin") # Adicionado lazy="selectin" para consistência
    transactions: Mapped[List["CashRegisterTransaction"]] = relationship(
        back_populates="cash_register",
        cascade="all, delete-orphan",
        lazy="selectin" # Adicionado lazy="selectin" para consistência
    )

class CashRegisterTransaction(Base):
    __tablename__ = "cash_register_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    cash_register_id: Mapped[int] = mapped_column(ForeignKey("cash_registers.id"), nullable=False)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"), nullable=True)
    
    transaction_type: Mapped[TransactionType] = mapped_column(SQLAlchemyEnum(TransactionType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    
    cash_register: Mapped["CashRegister"] = relationship(back_populates="transactions")
    sale: Mapped["Sale"] = relationship(lazy="selectin") # Adicionado lazy="selectin"