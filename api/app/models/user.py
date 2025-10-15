# /api/app/models/user.py
from sqlalchemy import ForeignKey, String, Integer, DateTime, func, Boolean, Enum as SQLAlchemyEnum # Adicione Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base import Base
from app.schemas.enums import UserRole # <-- Adicione esta importação

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    store: Mapped["Store"] = relationship(back_populates="users")
    # --- NOVA COLUNA ---
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.ADMIN)
    # --- FIM DA NOVA COLUNA ---

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())