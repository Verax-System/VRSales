import enum
from sqlalchemy import Integer, Float, DateTime, func, ForeignKey, String, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base

class TransactionType(enum.Enum):
    OPENING = "opening"    # Aporte inicial
    PAYOUT = "payout"      # Sangria / Retirada
    CLOSING = "closing"    # Fechamento

class CashRegisterTransaction(Base):
    __tablename__ = "cash_register_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("cash_register_sessions.id"))
    transaction_type: Mapped[TransactionType] = mapped_column(SQLAlchemyEnum(TransactionType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    session: Mapped["CashRegisterSession"] = relationship(back_populates="transactions")