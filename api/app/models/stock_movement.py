from sqlalchemy import String, Integer, DateTime, func, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base import Base

class MovementType(str, enum.Enum):
    SALE = "SALE"          # Saída por venda
    PURCHASE = "PURCHASE"    # Entrada por compra/recebimento
    ADJUSTMENT = "ADJUSTMENT"  # Ajuste manual de inventário
    RETURN = "RETURN"        # Devolução de cliente

class StockMovement(Base):
    __tablename__ = "stock_movements"
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    movement_type: Mapped[MovementType] = mapped_column(SQLAlchemyEnum(MovementType), nullable=False)
    
    # Quantidade movimentada. Positivo para entradas, negativo para saídas.
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Estoque do produto *após* a movimentação, para auditoria.
    stock_after_movement: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Um campo de texto para justificativas em ajustes manuais.
    reason: Mapped[str] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    product: Mapped["Product"] = relationship()
    user: Mapped["User"] = relationship()