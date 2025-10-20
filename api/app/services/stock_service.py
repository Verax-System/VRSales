# api/app/services/stock_service.py
from sqlalchemy.orm import Session
from loguru import logger

from app.models.sale import Sale
from app.models.product import Product
from app.models.user import User
from app.models.stock_movement import StockMovement, MovementType

class StockService:
    def _create_stock_movement(
        self,
        db: Session,
        *,
        product: Product,
        user_id: int,
        quantity_change: int,
        movement_type: MovementType,
        reason: str = None
    ) -> StockMovement:
        """
        Método privado central para criar um registro de movimentação de estoque
        e atualizar o estoque do produto.
        """
        product.stock += quantity_change
        
        # --- CORREÇÃO AQUI ---
        # A trava que impedia o estoque de ficar negativo foi removida.
        # if product.stock < 0:
        #     product.stock = 0
            
        db.add(product)
        # O commit será feito pela função que chama o serviço

        movement = StockMovement(
            product_id=product.id,
            user_id=user_id,
            movement_type=movement_type,
            quantity=quantity_change,
            stock_after_movement=product.stock,
            reason=reason,
            store_id=product.store_id # Garante que o store_id seja salvo
        )
        db.add(movement)
        
        if product.stock <= product.low_stock_threshold:
            logger.warning(
                f"Estoque baixo para o produto ID {product.id} ('{product.name}'). "
                f"Estoque atual: {product.stock}, Limite: {product.low_stock_threshold}."
            )
            
        return movement

    def deduct_stock_from_sale(self, db: Session, *, sale: Sale) -> None:
        """Refatorado para usar o método central _create_stock_movement."""
        for item in sale.items:
            product = db.get(Product, item.product_id)

            if product:
                if product.store_id != sale.store_id:
                    logger.error(f"Tentativa de dedução de estoque para o produto ID {item.product_id} que não pertence à loja da venda ID {sale.id}.")
                    continue 

                self._create_stock_movement(
                    db=db,
                    product=product,
                    user_id=sale.user_id,
                    quantity_change=-item.quantity,
                    movement_type=MovementType.SALE,
                    reason=f"Venda ID: {sale.id}"
                )
            else:
                logger.error(f"Produto com ID {item.product_id} não encontrado para dedução de estoque na venda {sale.id}.")

    def adjust_stock(
        self, db: Session, *, product_id: int, new_stock_level: int, user: User, reason: str
    ) -> StockMovement:
        """
        Ajusta o estoque de um produto para um valor específico (para inventário).
        """
        product = db.get(Product, product_id)
        if not product:
            return None
            
        quantity_change = new_stock_level - product.stock

        return self._create_stock_movement(
            db=db,
            product=product,
            user_id=user.id,
            quantity_change=quantity_change,
            movement_type=MovementType.ADJUSTMENT,
            reason=reason
        )

stock_service = StockService()