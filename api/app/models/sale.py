from sqlalchemy import Integer, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List
from app.models.sale import Sale
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.cash_register import CashRegisterSession
from app.db.base import Base

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    
    # Chaves estrangeiras
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # --- INÍCIO DA NOVA LINHA ---
    cash_register_session_id: Mapped[int] = mapped_column(ForeignKey("cash_register_sessions.id"))
    # --- FIM DA NOVA LINHA ---

    # Relações
    customer: Mapped["Customer"] = relationship(back_populates="sales")
    user: Mapped["User"] = relationship()
    items: Mapped[List["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan")
    # --- INÍCIO DA NOVA LINHA ---
    cash_register_session: Mapped["CashRegisterSession"] = relationship(back_populates="sales")
    # --- FIM DA NOVA LINHA ---
class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_sale: Mapped[float] = mapped_column(Float, nullable=False)

    # Chaves estrangeiras
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))

    # Relações
    sale: Mapped["Sale"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()