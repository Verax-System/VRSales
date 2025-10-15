from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class Supplier(Base):
    __tablename__ = "suppliers"
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    contact_person: Mapped[str] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True)