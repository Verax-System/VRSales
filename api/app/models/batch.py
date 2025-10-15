from sqlalchemy import Integer, Float, ForeignKey, DateTime, func, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base

class ProductBatch(Base):
    """ Modelo para Lotes de Produto com controle de validade. """
    __tablename__ = "product_batches"
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    expiration_date: Mapped[datetime] = mapped_column(Date, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Chave Estrangeira
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))

    # Relação
    product: Mapped["Product"] = relationship(back_populates="batches")