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
    OPENING_BALANCE = "OPENING_BALANCE" # Saldo inicial
    SALE_PAYMENT = "SALE_PAYMENT"      # Pagamento de venda
    SUPPLY = "SUPPLY"                  # Suprimento (adição de dinheiro)
    WITHDRAWAL = "WITHDRAWAL"          # Sangria (retirada de dinheiro)
    CLOSING_BALANCE = "CLOSING_BALANCE" # Saldo final

class CashRegister(Base):
    __tablename__ = "cash_registers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    status: Mapped[CashRegisterStatus] = mapped_column(
        SQLAlchemyEnum(CashRegisterStatus), 
        nullable=False, 
        default=CashRegisterStatus.OPEN
    )
    
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False)
    closing_balance: Mapped[float] = mapped_column(Float, nullable=True) # Pode ser nulo enquanto o caixa está aberto
    
    # Valores calculados ao fechar o caixa
    expected_balance: Mapped[float] = mapped_column(Float, nullable=True) 
    balance_difference: Mapped[float] = mapped_column(Float, nullable=True) # Diferença (sobra/falta)

    opened_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    closed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship()
    transactions: Mapped[List["CashRegisterTransaction"]] = relationship(
        back_populates="cash_register",
        cascade="all, delete-orphan"
    )

class CashRegisterTransaction(Base):
    __tablename__ = "cash_register_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    cash_register_id: Mapped[int] = mapped_column(ForeignKey("cash_registers.id"), nullable=False)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"), nullable=True) # Associado a uma venda
    
    transaction_type: Mapped[TransactionType] = mapped_column(SQLAlchemyEnum(TransactionType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    
    cash_register: Mapped["CashRegister"] = relationship(back_populates="transactions")
    sale: Mapped["Sale"] = relationship()