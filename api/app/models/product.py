from sqlalchemy import String, Float, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List

from app.db.base import Base

class Product(Base):
    """
    Modelo ORM que representa a tabela 'products' no banco de dados.
    """
    __tablename__ = "products"

    # Colunas da tabela
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    barcode: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)

    # Campos de data e hora com valores padrão automáticos
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    batches: Mapped[List["ProductBatch"]] = relationship(back_populates="product", cascade="all, delete-orphan")

    # Relação: Um produto pode ter vários itens em sua ficha técnica
    recipe_items: Mapped[List["RecipeItem"]] = relationship()