# /api/app/models/product.py
from sqlalchemy import String, Float, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, Optional # Adicionar Optional

from app.db.base import Base
# Importar os modelos para que o SQLAlchemy os reconheça
from .category import ProductCategory, ProductSubcategory
# A importação de outros modelos pode ser necessária dependendo das relações
# from .variation import ProductVariation
# from .batch import ProductBatch
# from .recipe import RecipeItem

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")

    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    barcode: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    
    # --- INÍCIO DA CORREÇÃO ---
    # Descomentando e garantindo que as referências estão corretas
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_categories.id"), nullable=True)
    subcategory_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_subcategories.id"), nullable=True)
    # --- FIM DA CORREÇÃO ---
    
    # Relações
    category: Mapped[Optional["ProductCategory"]] = relationship()
    subcategory: Mapped[Optional["ProductSubcategory"]] = relationship()

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    
    # Outras relações (verifique se os modelos estão importados se necessário)
    # variations: Mapped[List["ProductVariation"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    # batches: Mapped[List["ProductBatch"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    # recipe_items: Mapped[List["RecipeItem"]] = relationship()

    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)