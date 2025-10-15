from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List

from app.db.base import Base
# --- INÍCIO DA CORREÇÃO ---
# Importa os Enums do arquivo centralizado
from app.schemas.enums import OrderStatus, OrderType, OrderItemStatus # Adicione OrderItemStatus
# --- FIM DA CORREÇÃO ---


class Order(Base):
    __tablename__ = "orders"
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    status: Mapped[OrderStatus] = mapped_column(
        SQLAlchemyEnum(OrderStatus, name="orderstatus", create_type=False), 
        nullable=False, 
        default=OrderStatus.OPEN
    )
    order_type: Mapped[OrderType] = mapped_column(
        SQLAlchemyEnum(OrderType, name="ordertype", create_type=False),
        nullable=False,
        default=OrderType.DINE_IN
    )
    delivery_address: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    closed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"), nullable=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=True)
    
    table: Mapped["Table"] = relationship(back_populates="orders")
    customer: Mapped["Customer"] = relationship()
    items: Mapped[List["OrderItem"]] = relationship(
        back_populates="order", 
        cascade="all, delete-orphan",
        lazy="selectin"  # Garante que os itens sejam carregados junto com a comanda
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(255), nullable=True)
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