from sqlalchemy import (
    Float, DateTime, String, ForeignKey, func, Integer
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.db.base import Base

class Payment(Base):
    __tablename__ = 'payments'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey('orders.id'))
    sale_id: Mapped[Optional[int]] = mapped_column(ForeignKey('sales.id'))

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="completed")
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos usando strings para evitar importação circular
    order: Mapped[Optional["Order"]] = relationship("Order", back_populates="payments")
    sale: Mapped[Optional["Sale"]] = relationship("Sale", back_populates="payments")