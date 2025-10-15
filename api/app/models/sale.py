from sqlalchemy import Integer, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List

from app.db.base import Base

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cash_register_id: Mapped[int] = mapped_column(ForeignKey("cash_registers.id"), nullable=True)
    # Relações usando strings para evitar importações circulares
    customer: Mapped["Customer"] = relationship(back_populates="sales")
    user: Mapped["User"] = relationship()
    items: Mapped[List["SaleItem"]] = relationship(
        back_populates="sale", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )
    cash_register_session: Mapped["CashRegisterSession"] = relationship(back_populates="sales")
    payments: Mapped[List["Payment"]] = relationship(
        back_populates="sale", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )


class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_sale: Mapped[float] = mapped_column(Float, nullable=False)

    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))

    # Relações usando strings
    sale: Mapped["Sale"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()