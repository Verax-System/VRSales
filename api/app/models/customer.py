from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from app.models.sale import Sale

from app.db.base import Base

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True)

    # Relação: Um cliente pode ter várias vendas
    sales: Mapped[List["Sale"]] = relationship(back_populates="customer")