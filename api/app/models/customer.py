from sqlalchemy import String, DateTime, func, Float, Integer, ForeignKey  # Adicionar Float e Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List

from app.db.base import Base

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True, unique=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True, unique=True, index=True)
    document_number: Mapped[str] = mapped_column(String(18), nullable=True, unique=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    # --- INÍCIO DOS NOVOS CAMPOS DE CRM ---
    
    # Data da última compra/visita do cliente. Atualizada automaticamente.
    last_seen: Mapped[datetime] = mapped_column(DateTime, nullable=True, onupdate=func.now())
    
    # Valor total que o cliente já gastou na loja.
    total_spent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, server_default="0.0")
    
    # Pontos de fidelidade acumulados pelo cliente.
    loyalty_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    
    # --- FIM DOS NOVOS CAMPOS DE CRM ---

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Relacionamento com as vendas para fácil acesso ao histórico
    sales: Mapped[List["Sale"]] = relationship(back_populates="customer")