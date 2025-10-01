from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Additional(Base):
    """ Modelo para cadastrar os adicionais disponíveis (ex: Extra Bacon, Borda Recheada). """
    __tablename__ = "additionals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

class OrderItemAdditional(Base):
    """ Tabela de associação entre um item de pedido e um adicional. """
    __tablename__ = "order_item_additionals"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))
    additional_id: Mapped[int] = mapped_column(ForeignKey("additionals.id"))