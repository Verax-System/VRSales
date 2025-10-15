from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    
    # Relação para aceder a todas as subcategorias de uma categoria principal
    subcategories: Mapped[List["ProductSubcategory"]] = relationship(
        back_populates="parent_category", 
        cascade="all, delete-orphan"
        # --- CORREÇÃO ---
        # A linha abaixo foi removida pois não é necessária aqui, a ambiguidade
        # é resolvida no outro lado da relação. O back_populates já é suficiente.
    )
    
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)


class ProductSubcategory(Base):
    __tablename__ = "product_subcategories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Chave estrangeira para a categoria principal
    parent_category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"))
    
    # Relação inversa para aceder à categoria principal
    parent_category: Mapped["ProductCategory"] = relationship(
        back_populates="subcategories",
        # --- INÍCIO DA CORREÇÃO ---
        # Explicitamente dizemos ao SQLAlchemy para usar a coluna 'parent_category_id'
        # para este relacionamento, resolvendo a ambiguidade.
        foreign_keys=[parent_category_id]
        # --- FIM DA CORREÇÃO ---
    )
    
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)