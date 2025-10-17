# api/app/models/reservation.py
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.db.base import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))
    reservation_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    number_of_people: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(50), default="confirmed")

    # Chaves Estrangeiras
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"), nullable=False)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    
    # Relacionamentos
    table: Mapped["Table"] = relationship(lazy="selectin")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())