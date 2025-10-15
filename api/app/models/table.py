import enum
from sqlalchemy import String, Integer, Enum as SQLAlchemyEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base

class TableStatus(enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"

class Table(Base):
    __tablename__ = "tables"
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[TableStatus] = mapped_column(
        SQLAlchemyEnum(TableStatus), 
        nullable=False, 
        default=TableStatus.AVAILABLE
    )
    # --- NOVOS CAMPOS ---
    pos_x: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    pos_y: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    # --- FIM DOS NOVOS CAMPOS ---

    # Relação: Uma mesa pode ter várias comandas/pedidos
    orders: Mapped[List["Order"]] = relationship(back_populates="table")