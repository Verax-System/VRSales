# app/crud/crud_order.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from fastapi import HTTPException

from app.crud.base import CRUDBase
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.table import Table
from app.schemas.enums import TableStatus, OrderStatus, OrderType
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate

class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
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
            (item for item in order.items if item.product_id == item_in.product_id and item.notes == item_in.notes),
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
        updated_order = result.scalars().one_or_none()

        if not updated_order:
             raise HTTPException(status_code=404, detail="Comanda não encontrada após adicionar o item.")
        
        return updated_order

order = CRUDOrder(Order)