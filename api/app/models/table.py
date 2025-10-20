from sqlalchemy import String, DateTime, func, Boolean, ForeignKey, Integer, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List

from app.db.base import Base
from app.schemas.enums import TableShape # Importa o novo Enum

class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="available")
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))

    pos_x: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    pos_y: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    
    # --- INÍCIO DAS NOVAS COLUNAS ---
    capacity: Mapped[int] = mapped_column(Integer, default=4, server_default="4")
    shape: Mapped[TableShape] = mapped_column(SQLAlchemyEnum(TableShape, name="tableshape"), default=TableShape.RECTANGLE, server_default="rectangle")
    rotation: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    # --- FIM DAS NOVAS COLUNAS ---

    store: Mapped["Store"] = relationship()
    orders: Mapped[List["Order"]] = relationship(back_populates="table")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())