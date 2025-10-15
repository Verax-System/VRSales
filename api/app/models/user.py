from sqlalchemy import String, DateTime, func, Boolean, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, Optional # Adicionar Optional

from app.db.base import Base
from app.schemas.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.CASHIER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # --- INÍCIO DA CORREÇÃO ---
    # Tornamos o store_id opcional (nullable=True) para permitir a existência de Super Admins
    # que não pertencem a nenhuma loja específica.
    store_id: Mapped[Optional[int]] = mapped_column(ForeignKey("stores.id"), nullable=True)
    store: Mapped[Optional["Store"]] = relationship(back_populates="users")
    # --- FIM DA CORREÇÃO ---

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())