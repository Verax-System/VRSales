from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from fastapi import HTTPException, status

from app.crud.base import CRUDBase
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.table import Table
from app.schemas.enums import TableStatus
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate
from app.schemas.enums import OrderStatus, OrderType, OrderItemStatus

class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    """
    Operações CRUD assíncronas para Comandas (Orders).
    """

    async def create(self, db: AsyncSession, *, obj_in: OrderCreate, current_user: User) -> Order:
        """
        Cria uma nova comanda, tratando a lógica para DINE_IN e DELIVERY de forma assíncrona.
        """
        if obj_in.order_type == OrderType.DINE_IN:
            stmt = select(Table).filter(Table.id == obj_in.table_id, Table.store_id == current_user.store_id)
            result = await db.execute(stmt)
            table = result.scalars().first()
            
            if not table:
                raise HTTPException(status_code=404, detail="Mesa não encontrada.")
            if table.status == TableStatus.OCCUPIED:
                raise HTTPException(status_code=400, detail="Mesa já está ocupada.")
            
            table.status = TableStatus.OCCUPIED
            db.add(table)

        if obj_in.order_type == OrderType.DELIVERY:
             if not obj_in.customer_id or not obj_in.delivery_address:
                 raise HTTPException(status_code=400, detail="Cliente e endereço são obrigatórios para delivery.")

        # Chama o método 'create' assíncrono da CRUDBase
        return await super().create(db, obj_in=obj_in, current_user=current_user)

    async def get_open_order_by_table(self, db: AsyncSession, *, table_id: int, current_user: User) -> Optional[Order]:
        """
        Busca uma comanda aberta para uma mesa específica de forma assíncrona.
        """
        stmt = select(Order).filter(
            Order.store_id == current_user.store_id,
            Order.table_id == table_id,
            Order.status == OrderStatus.OPEN
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def add_item_to_order(
        self, db: AsyncSession, *, order_id: int, item_in: OrderItemCreate, current_user: User
    ) -> Optional[Order]:
        """
        Adiciona um novo item a uma comanda existente de forma assíncrona.
        """
        order = await self.get(db, id=order_id, current_user=current_user)
        if not order or order.status != OrderStatus.OPEN:
            raise HTTPException(status_code=400, detail="Comanda não encontrada ou não está aberta.")

        product_stmt = select(Product).filter(Product.id == item_in.product_id, Product.store_id == current_user.store_id)
        product_result = await db.execute(product_stmt)
        product = product_result.scalars().first()

        if not product:
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
        await db.refresh(order)
        return order

    async def get_multi_by_status(
        self, db: AsyncSession, *, statuses: List[OrderStatus], current_user: User
    ) -> List[Order]:
        """
        Busca múltiplas comandas por status de forma assíncrona.
        """
        stmt = select(self.model).filter(
            self.model.store_id == current_user.store_id,
            self.model.status.in_(statuses)
        ).order_by(self.model.created_at.asc())
        
        result = await db.execute(stmt)
        return result.scalars().all()

# Instância única para ser usada na aplicação
order = CRUDOrder(Order)