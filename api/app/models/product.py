# /api/app/models/product.py
from sqlalchemy import String, Float, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship, selectinload # Verifique se 'relationship' está importado
from datetime import datetime
from typing import List

from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # --- NOVO CAMPO ---
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")
    # --- FIM DO NOVO CAMPO ---

    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    barcode: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"), nullable=True)
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("product_subcategories.id"), nullable=True)
    
    variations: Mapped[List["ProductVariation"]] = relationship(
        back_populates="product", 
        cascade="all, delete-orphan",
        lazy="selectin"  # Adicione esta linha
    )
    category: Mapped["ProductCategory"] = relationship()
    subcategory: Mapped["ProductSubcategory"] = relationship()
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    batches: Mapped[List["ProductBatch"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    recipe_items: Mapped[List["RecipeItem"]] = relationship()