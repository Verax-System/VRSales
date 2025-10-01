from sqlalchemy import Integer, Float, DateTime, func, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List
from app.models.sale import Sale
from app.models.user import User
from app.db.base import Base

class CashRegisterSession(Base):
    __tablename__ = "cash_register_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False)
    closing_balance: Mapped[float] = mapped_column(Float, nullable=True) # Preenchido no fechamento
    opened_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    closed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Chave estrangeira para o usuário que abriu/fechou o caixa
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    # Relações
    user: Mapped["User"] = relationship()
    sales: Mapped[List["Sale"]] = relationship(back_populates="cash_register_session")