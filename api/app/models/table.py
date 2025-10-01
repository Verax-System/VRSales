import enum
from sqlalchemy import String, Integer, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base

class TableStatus(enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"

class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    status: Mapped[TableStatus] = mapped_column(
        SQLAlchemyEnum(TableStatus), 
        nullable=False, 
        default=TableStatus.AVAILABLE
    )

    # Relação: Uma mesa pode ter várias comandas/pedidos
    orders: Mapped[List["Order"]] = relationship(back_populates="table")