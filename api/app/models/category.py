from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    subcategories: Mapped[List["ProductSubcategory"]] = relationship(
        back_populates="parent_category", 
        cascade="all, delete-orphan"
    )

class ProductSubcategory(Base):
    __tablename__ = "product_subcategories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"))
    category: Mapped["ProductCategory"] = relationship(back_populates="subcategories")
    parent_category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"))
    
    # Relação inversa para aceder à categoria principal
    parent_category: Mapped["ProductCategory"] = relationship(back_populates="subcategories")
    
    # Adicionando o campo store_id para a arquitetura multi-loja
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)