from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    subcategories: Mapped[List["ProductSubcategory"]] = relationship(
        back_populates="category",
        lazy="selectin"
    )

class ProductSubcategory(Base):
    __tablename__ = "product_subcategories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"))
    category: Mapped["ProductCategory"] = relationship(back_populates="subcategories")