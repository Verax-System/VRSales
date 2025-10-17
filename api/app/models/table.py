from sqlalchemy import String, DateTime, func, Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List # Importar List

from app.db.base import Base

class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="available")
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))

    pos_x: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    pos_y: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    
    # Relacionamento com a loja
    store: Mapped["Store"] = relationship()

    # --- INÍCIO DA CORREÇÃO ---
    # Adicionando o relacionamento reverso que estava faltando.
    # Agora, a Mesa sabe quais Comandas (Orders) ela tem.
    orders: Mapped[List["Order"]] = relationship(back_populates="table")
    # --- FIM DA CORREÇÃO ---
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())