from sqlalchemy import Integer, Float, DateTime, String, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, Optional

from app.db.base import Base
from app.schemas.sale_item import SaleItem
from .customer import Customer
from .user import User
from .cash_register import CashRegister # Importação do modelo corrigido
from .payment import Payment # Importação do modelo Payment

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id"), nullable=True)
    cash_register_id: Mapped[Optional[int]] = mapped_column(ForeignKey("cash_registers.id"), nullable=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Relacionamentos
    items: Mapped[List["SaleItem"]] = relationship(cascade="all, delete-orphan")
    customer: Mapped[Optional["Customer"]] = relationship(back_populates="sales")
    user: Mapped["User"] = relationship()
    cash_register: Mapped[Optional["CashRegister"]] = relationship()
    
    # --- INÍCIO DA CORREÇÃO ---
    # Adicionando o relacionamento 'payments' que estava em falta,
    # correspondendo ao 'back_populates' no modelo Payment.
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")
    # --- FIM DA CORREÇÃO ---

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