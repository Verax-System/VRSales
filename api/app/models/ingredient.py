from sqlalchemy import String, Float, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

# --- INÍCIO DA CORREÇÃO ---
from app.schemas.enums import UnitOfMeasure # Importa do novo arquivo
from app.db.base import Base
# --- FIM DA CORREÇÃO ---


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    stock: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    unit_of_measure: Mapped[UnitOfMeasure] = mapped_column(SQLAlchemyEnum(UnitOfMeasure), nullable=False)