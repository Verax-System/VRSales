# api/app/crud/crud_sale.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import Session, selectinload, joinedload
from typing import List, Optional
from fastapi import HTTPException, status
from decimal import Decimal, ROUND_HALF_UP
from loguru import logger

from app.crud.base import CRUDBase
from app.models.sale import Sale, SaleItem as SaleItemModel
from app.models.payment import Payment
from app.models.product import Product
from app.schemas.sale import SaleCreate, SaleUpdate
from app.models.user import User

from app.crud.crud_order import get_full_order

from app.services.crm_service import crm_service
from app.services.stock_service import stock_service
from app.services.cash_register_service import cash_register_service


async def get_full_sale(db: AsyncSession, *, id: int) -> Optional[Sale]:
    """
    Função auxiliar para carregar uma Venda (Sale) com todos os seus relacionamentos.
    """
    stmt = select(Sale).where(Sale.id == id).options(
        selectinload(Sale.items).options(
            joinedload(SaleItemModel.product)
        ),
        selectinload(Sale.payments),
        selectinload(Sale.customer),
        selectinload(Sale.user)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


def _run_sync_post_sale_services(db_session: Session, *, sale: Sale):
    """
    Executa os serviços síncronos de forma segura e atômica.
    """
    sync_sale = db_session.merge(sale)
    
    cash_register_service.add_sale_transaction(db_session, sale=sync_sale)
    crm_service.update_customer_stats_from_sale(db_session, sale=sync_sale)
    stock_service.deduct_stock_from_sale(db_session, sale=sync_sale)
    
    db_session.commit()


class CRUDSale(CRUDBase[Sale, SaleCreate, SaleUpdate]):
    
    async def get_multi_detailed(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, current_user: User
    ) -> List[Sale]:
        """
        Busca uma lista de vendas com detalhes do cliente e usuário para a loja atual.
        """
        stmt = (
            select(self.model)
            .where(self.model.store_id == current_user.store_id)
            .options(
                selectinload(self.model.items).options(selectinload(SaleItemModel.product)),
                selectinload(self.model.customer),
                selectinload(self.model.user),
                # --- CORREÇÃO PRINCIPAL AQUI ---
                # Adiciona o carregamento antecipado (eager loading) dos pagamentos.
                # Isso evita o erro de "MissingGreenlet" ao carregar a relação de forma preguiçosa (lazy loading).
                selectinload(self.model.payments)
                # --- FIM DA CORREÇÃO ---
            )
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_with_items(self, db: AsyncSession, *, obj_in: SaleCreate, current_user: User) -> Sale:
        sale_data = obj_in.model_dump()
        items_data = sale_data.pop("items", [])
        payments_data = sale_data.pop("payments", [])

        if not items_data or not payments_data:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A venda deve conter pelo menos um item e um método de pagamento.")

        total_amount = sum(Decimal(str(item['price_at_sale'])) * Decimal(item['quantity']) for item in items_data)
        total_amount = float(total_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

        total_paid = sum(p['amount'] for p in payments_data)
        if total_paid < total_amount:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O valor pago é menor que o total da venda.")

        primary_payment_method = payments_data[0]['payment_method'] if payments_data else "other"

        db_sale = Sale(
            total_amount=total_amount,
            payment_method=primary_payment_method,
            user_id=current_user.id,
            store_id=current_user.store_id,
            customer_id=obj_in.customer_id,
            items=[SaleItemModel(**item) for item in items_data],
            payments=[Payment(**p) for p in payments_data]
        )
        
        db.add(db_sale)
        await db.commit()
        await db.refresh(db_sale)

        await db.run_sync(_run_sync_post_sale_services, sale=db_sale)
        
        refreshed_sale = await get_full_sale(db, id=db_sale.id)
        
        return refreshed_sale

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