from sqlalchemy import Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class RecipeItem(Base):
    __tablename__ = "recipe_items"
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    id: Mapped[int] = mapped_column(primary_key=True)
    quantity_needed: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Chaves Estrangeiras
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"))
    
    # Relações
    ingredient: Mapped["Ingredient"] = relationship()