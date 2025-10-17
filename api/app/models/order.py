# api/app/models/order.py
from sqlalchemy import (
    String, Integer, Float, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, Optional

from app.db.base import Base
from app.schemas.enums import OrderStatus, OrderType, OrderItemStatus

# Importamos apenas os modelos que NÃO causam importação circular
from .table import Table
from .customer import Customer
from .user import User
from .product import Product
from .additional import Additional

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))

    status: Mapped[OrderStatus] = mapped_column(
        SQLAlchemyEnum(OrderStatus, name="orderstatus", create_type=False), 
        nullable=False, 
        default=OrderStatus.OPEN
    )
    order_type: Mapped[OrderType] = mapped_column(
        SQLAlchemyEnum(OrderType, name="ordertype", create_type=False),
        nullable=False
    )
    delivery_address: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    table_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tables.id"))
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id"))
    
    table: Mapped[Optional["Table"]] = relationship(back_populates="orders", lazy="selectin")
    customer: Mapped[Optional["Customer"]] = relationship(lazy="selectin")
    user: Mapped[Optional["User"]] = relationship(lazy="selectin")
    items: Mapped[List["OrderItem"]] = relationship(
        back_populates="order", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    payments: Mapped[List["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan", lazy="selectin")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # --- INÍCIO DA ALTERAÇÃO ---
    # Adicionamos a coluna para rastrear a quantidade já paga deste item.
    paid_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # --- FIM DA ALTERAÇÃO ---

    price_at_order: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[OrderItemStatus] = mapped_column(
        SQLAlchemyEnum(OrderItemStatus, name="orderitemstatus"),
        nullable=False,
        default=OrderItemStatus.PENDING,
    )

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(lazy="selectin") 
    additionals: Mapped[List["Additional"]] = relationship(
        secondary="order_item_additionals",
        lazy="selectin"
    )