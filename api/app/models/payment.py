import enum
from sqlalchemy import Integer, Float, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class PaymentMethod(enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PIX = "pix"
    OTHER = "other"

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLAlchemyEnum(PaymentMethod, name="paymentmethod"),
        nullable=False
    )

    # Chave Estrangeira
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"))

    # Relação
    sale: Mapped["Sale"] = relationship(back_populates="payments")