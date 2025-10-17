# /api/app/models/product.py
from sqlalchemy import String, Float, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, Optional

from app.db.base import Base
# Importar todos os modelos relacionados para que o SQLAlchemy os reconheça
from .category import ProductCategory, ProductSubcategory
from .batch import ProductBatch
from .variation import ProductVariation
from .recipe import RecipeItem

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")

    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    barcode: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True)
    
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_categories.id"))
    subcategory_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_subcategories.id"))
    
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    # Relações
    category: Mapped[Optional["ProductCategory"]] = relationship(lazy="selectin")
    subcategory: Mapped[Optional["ProductSubcategory"]] = relationship(lazy="selectin")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    
    batches: Mapped[List["ProductBatch"]] = relationship(back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    variations: Mapped[List["ProductVariation"]] = relationship(back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    recipe_items: Mapped[List["RecipeItem"]] = relationship(lazy="selectin")