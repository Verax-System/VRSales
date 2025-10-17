# api/app/crud/crud_sale.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from typing import List
from fastapi import HTTPException, status
from decimal import Decimal, ROUND_HALF_UP

from app.crud.base import CRUDBase
from app.models.sale import Sale, SaleItem as SaleItemModel
from app.models.payment import Payment
from app.schemas.sale import SaleCreate, SaleUpdate
from app.models.user import User

from app.services.crm_service import crm_service
from app.services.stock_service import stock_service
from app.services.cash_register_service import cash_register_service

def _run_sync_post_sale_services(db_session: Session, *, sale: Sale):
    """
    Função auxiliar que executa os serviços síncronos de forma segura.
    """
    sync_sale = db_session.merge(sale)
    
    cash_register_service.add_sale_transaction(db_session, sale=sync_sale)
    crm_service.update_customer_stats_from_sale(db_session, sale=sync_sale)
    stock_service.deduct_stock_from_sale(db_session, sale=sync_sale)

class CRUDSale(CRUDBase[Sale, SaleCreate, SaleUpdate]):
    
    # --- MÉTODO CORRIGIDO E RENOMEADO ---
    async def create_with_items(self, db: AsyncSession, *, obj_in: SaleCreate, current_user: User) -> Sale:
        """
        Cria uma nova venda a partir do zero (ex: do POS) e orquestra os serviços de pós-venda.
        """
        sale_data = obj_in.model_dump()
        items_data = sale_data.pop("items", [])
        payments_data = sale_data.pop("payments", [])

        if not items_data or not payments_data:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A venda deve conter pelo menos um item e um método de pagamento.")

        # Calcula o total real a partir dos itens para segurança
        total_amount = sum(Decimal(str(item['price_at_sale'])) * Decimal(item['quantity']) for item in items_data)
        total_amount = float(total_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

        total_paid = sum(p['amount'] for p in payments_data)
        if total_paid < total_amount:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O valor pago é menor que o total da venda.")

        # Cria a instância da Venda
        db_sale = Sale(
            total_amount=total_amount,
            payment_method=payments_data[0]['payment_method'], # Pega o primeiro como principal
            user_id=current_user.id,
            store_id=current_user.store_id,
            customer_id=obj_in.customer_id,
            items=[SaleItemModel(**item) for item in items_data],
            payments=[Payment(**p) for p in payments_data]
        )
        
        db.add(db_sale)
        await db.commit()
        await db.refresh(db_sale)

        # Executa os serviços síncronos de forma segura
        await db.run_sync(_run_sync_post_sale_services, sale=db_sale)
        
        # Recarrega a venda com todos os relacionamentos para retornar ao frontend
        await db.refresh(db_sale, attribute_names=['items', 'payments'])
        
        return db_sale

    async def get_sales_by_customer(self, db: AsyncSession, *, customer_id: int, current_user: User) -> List[Sale]:
        stmt = (
            select(self.model)
            .filter(Sale.customer_id == customer_id, Sale.store_id == current_user.store_id)
            .options(selectinload(Sale.items).selectinload(SaleItemModel.product))
            .order_by(Sale.created_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

sale = CRUDSale(Sale)