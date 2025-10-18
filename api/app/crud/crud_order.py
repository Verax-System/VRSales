# api/app/crud/crud_order.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import Session, selectinload, joinedload
from typing import List, Optional
from fastapi import HTTPException, status
from decimal import Decimal, ROUND_HALF_UP
from loguru import logger

from app.crud.base import CRUDBase
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.table import Table
from app.models.sale import Sale, SaleItem as SaleItemModel
from app.models.payment import Payment
from app.schemas.enums import TableStatus, OrderStatus, OrderType
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate, PartialPaymentRequest, OrderMerge, OrderTransfer
from app.services.cash_register_service import cash_register_service
from app.services.crm_service import crm_service
from app.services.stock_service import stock_service

async def get_full_order(db: AsyncSession, *, id: int) -> Optional[Order]:
    """ Carrega uma comanda com todos os seus relacionamentos. """
    stmt = select(Order).where(Order.id == id).options(
        selectinload(Order.items).options(
            joinedload(OrderItem.product)
        ),
        selectinload(Order.table),
        selectinload(Order.user)
    )
    result = await db.execute(stmt)
    return result.scalars().first()

def _run_sync_post_sale_services(db_session: Session, *, sale: Sale):
    """
    Executa os serviços síncronos (caixa, crm, stock) usando uma sessão síncrona.
    """
    sync_sale = db_session.merge(sale)
    
    cash_register_service.add_sale_transaction(db_session, sale=sync_sale)
    crm_service.update_customer_stats_from_sale(db_session, sale=sync_sale)
    stock_service.deduct_stock_from_sale(db_session, sale=sync_sale)


class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    # ... (métodos get_for_user, create, etc. não mudam) ...
    async def get_for_user(self, db: AsyncSession, *, id: int, current_user: User) -> Optional[Order]:
        stmt = select(Order).filter(Order.id == id, Order.store_id == current_user.store_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: OrderCreate, current_user: User) -> Order:
        if obj_in.order_type == OrderType.DINE_IN:
            if not obj_in.table_id:
                raise HTTPException(status_code=400, detail="O ID da mesa é obrigatório para comandas de salão.")
            table = await db.get(Table, obj_in.table_id)
            if not table:
                raise HTTPException(status_code=404, detail="Mesa não encontrada.")
            if table.status == TableStatus.OCCUPIED:
                raise HTTPException(status_code=400, detail="A mesa já está ocupada.")
            table.status = TableStatus.OCCUPIED
            db.add(table)

        order_data = obj_in.model_dump()
        db_order = Order(**order_data, user_id=current_user.id, store_id=current_user.store_id, status=OrderStatus.OPEN)
        db.add(db_order)
        await db.commit()
        await db.refresh(db_order)
        return db_order

    async def cancel_order(self, db: AsyncSession, *, order: Order, current_user: User) -> Order:
        if order.status != OrderStatus.OPEN:
            raise HTTPException(status_code=400, detail="Apenas comandas abertas podem ser canceladas.")

        if order.table_id:
            table = await db.get(Table, order.table_id)
            if table and table.store_id == current_user.store_id:
                table.status = TableStatus.AVAILABLE
                db.add(table)
        
        order.status = OrderStatus.CANCELLED
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order

    async def get_open_order_by_table(self, db: AsyncSession, *, table_id: int, current_user: User) -> Optional[Order]:
        stmt = select(Order).filter(
            Order.store_id == current_user.store_id,
            Order.table_id == table_id,
            Order.status == OrderStatus.OPEN
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def add_item_to_order(
        self, db: AsyncSession, *, order: Order, item_in: OrderItemCreate, current_user: User
    ) -> Order:
        if order.status != OrderStatus.OPEN:
            raise HTTPException(status_code=400, detail="A comanda não está aberta.")

        await db.refresh(order, attribute_names=['items'])

        existing_item = next(
            (item for item in order.items if 
             item.product_id == item_in.product_id and 
             item.notes == item_in.notes and
             item.quantity > item.paid_quantity),
            None
        )

        if existing_item:
            existing_item.quantity += item_in.quantity
            db.add(existing_item)
        else:
            product = await db.get(Product, item_in.product_id)
            if not product or product.store_id != current_user.store_id:
                raise HTTPException(status_code=404, detail="Produto não encontrado.")

            new_item = OrderItem(
                order_id=order.id,
                product_id=item_in.product_id,
                quantity=item_in.quantity,
                price_at_order=product.price,
                notes=item_in.notes
            )
            db.add(new_item)

        await db.commit()
        
        stmt = select(Order).where(Order.id == order.id).options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
        result = await db.execute(stmt)
        updated_order = result.scalars().one()
        
        return updated_order
    
    async def process_partial_payment(self, db: AsyncSession, *, order_id: int, payment_request: PartialPaymentRequest, current_user: User) -> Order:
        logger.info(f"Iniciando pagamento parcial para comanda ID: {order_id} pelo usuário ID: {current_user.id}")
        order = await self.get(db, id=order_id, current_user=current_user)
        
        if not order:
            logger.error(f"FALHA: Comanda ID {order_id} não encontrada para o usuário ID {current_user.id}.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada.")
        if order.status != OrderStatus.OPEN:
            logger.error(f"FALHA: Tentativa de pagar comanda ID {order_id} com status '{order.status}'.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta comanda não está mais aberta.")

        total_to_pay = Decimal("0.0")
        items_to_update = []
        sale_items_for_record = []

        for item_to_pay in payment_request.items_to_pay:
            order_item = next((i for i in order.items if i.id == item_to_pay.order_item_id), None)
            if not order_item:
                logger.error(f"FALHA: Item de comanda ID {item_to_pay.order_item_id} não encontrado na comanda ID {order_id}.")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item com ID {item_to_pay.order_item_id} não encontrado na comanda.")

            available_quantity = order_item.quantity - order_item.paid_quantity
            if item_to_pay.quantity > available_quantity:
                logger.error(f"FALHA: Tentativa de pagar {item_to_pay.quantity} de '{order_item.product.name}', mas apenas {available_quantity} estão disponíveis.")
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Quantidade a pagar ({item_to_pay.quantity}) para o item '{order_item.product.name}' é maior que a quantidade pendente ({available_quantity}).")

            order_item.paid_quantity += item_to_pay.quantity
            items_to_update.append(order_item)

            item_total = Decimal(str(order_item.price_at_order)) * Decimal(item_to_pay.quantity)
            total_to_pay += item_total
            sale_items_for_record.append(
                SaleItemModel(
                    product_id=order_item.product_id,
                    quantity=item_to_pay.quantity,
                    price_at_sale=order_item.price_at_order
                )
            )
        
        total_to_pay = total_to_pay.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_paid_amount = sum(Decimal(str(p.amount)) for p in payment_request.payments)

        if total_paid_amount < total_to_pay:
            logger.error(f"FALHA: Valor pago (R$ {total_paid_amount}) é menor que o total dos itens (R$ {total_to_pay}).")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Valor pago (R$ {total_paid_amount}) é menor que o total dos itens selecionados (R$ {total_to_pay}).")

        primary_payment_method = "other"
        if payment_request.payments:
            primary_payment_method = payment_request.payments[0].payment_method

        db_sale = Sale(
            total_amount=float(total_to_pay),
            payment_method=primary_payment_method,
            user_id=current_user.id,
            store_id=current_user.store_id,
            customer_id=payment_request.customer_id or order.customer_id,
            items=sale_items_for_record,
            payments=[Payment(**p.model_dump()) for p in payment_request.payments]
        )
        db.add(db_sale)
        db.add_all(items_to_update)

        all_items_paid = all((item.quantity == item.paid_quantity) for item in order.items)
        if all_items_paid:
            order.status = OrderStatus.PAID
            if order.table:
                order.table.status = TableStatus.AVAILABLE
                db.add(order.table)

        await db.commit()
        await db.refresh(db_sale)
        await db.refresh(order)

        logger.info(f"Venda parcial ID {db_sale.id} criada. Executando serviços síncronos...")
        await db.run_sync(_run_sync_post_sale_services, sale=db_sale)
        logger.info("Serviços síncronos concluídos com sucesso.")
        
        stmt = select(Order).where(Order.id == order.id).options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
        result = await db.execute(stmt)
        refreshed_order = result.scalars().one()

        return refreshed_order

    async def merge_orders(self, db: AsyncSession, *, target_order: Order, source_order_id: int, current_user: User) -> Order:
        """Junta os itens de uma comanda de origem na comanda de destino."""
        if target_order.status != OrderStatus.OPEN:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A comanda de destino não está aberta.")

        source_order = await self.get_for_user(db, id=source_order_id, current_user=current_user)
        if not source_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda de origem não encontrada.")
        if source_order.status != OrderStatus.OPEN:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A comanda de origem não está aberta.")
        if source_order.id == target_order.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível juntar uma comanda com ela mesma.")

        # Move os itens da comanda de origem para a de destino
        for item in source_order.items:
            item.order_id = target_order.id
            db.add(item)
        
        # Libera a mesa da comanda de origem
        if source_order.table:
            source_order.table.status = TableStatus.AVAILABLE
            db.add(source_order.table)

        # Apaga a comanda de origem
        await db.delete(source_order)
        await db.commit()
        await db.refresh(target_order)

        return target_order

    # --- INÍCIO DA NOVA FUNÇÃO ---
    async def transfer_order(self, db: AsyncSession, *, order_to_transfer: Order, target_table_id: int, current_user: User) -> Order:
        """Transfere uma comanda de uma mesa para outra."""
        if order_to_transfer.status != OrderStatus.OPEN:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Apenas comandas abertas podem ser transferidas.")

        target_table = await db.get(Table, target_table_id)
        if not target_table or target_table.store_id != current_user.store_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mesa de destino não encontrada.")
        if target_table.status != TableStatus.AVAILABLE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A mesa de destino não está livre.")

        # Libera a mesa antiga
        old_table = await db.get(Table, order_to_transfer.table_id)
        if old_table:
            old_table.status = TableStatus.AVAILABLE
            db.add(old_table)

        # Associa a comanda à nova mesa e ocupa a nova mesa
        order_to_transfer.table_id = target_table.id
        target_table.status = TableStatus.OCCUPIED
        db.add(order_to_transfer)
        db.add(target_table)

        await db.commit()
        await db.refresh(order_to_transfer)
        
        return order_to_transfer
    # --- FIM DA NOVA FUNÇÃO ---

order = CRUDOrder(Order)