# api/app/api/endpoints/orders.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_order import order as crud_order, get_full_order
from app.api import dependencies
from app.models.user import User as UserModel
from app.schemas.order import Order as OrderSchema, OrderCreate, OrderItemCreate, PartialPaymentRequest, OrderMerge, OrderTransfer
from app.schemas.enums import OrderStatus, OrderType

router = APIRouter()

@router.get("/pos/active", response_model=OrderSchema)
async def get_active_pos_order(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user)
):
    """Busca a comanda de POS (takeout) atualmente aberta para o usuário."""
    active_order = await crud_order.get_open_pos_order(db=db, current_user=current_user)
    if not active_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma venda de POS ativa encontrada.")
    return active_order

@router.patch("/{order_id}/close", response_model=OrderSchema)
async def close_order(
    order_id: int,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    """Fecha uma comanda após o pagamento ser concluído."""
    order_to_close = await crud_order.get_for_user(db=db, id=order_id, current_user=current_user)
    if not order_to_close:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada.")
    
    return await crud_order.close_order(db=db, order=order_to_close)


@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def create_order(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    order_in: OrderCreate,
    current_user: UserModel = Depends(dependencies.get_current_active_user)
) -> Any:
    if order_in.order_type == OrderType.DINE_IN and not order_in.table_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O ID da mesa é obrigatório para comandas do tipo 'DINE_IN'.",
        )
    order = await crud_order.create(db=db, obj_in=order_in, current_user=current_user)
    return order


@router.post("/{order_id}/items", response_model=OrderSchema)
async def add_item_to_order(
    order_id: int,
    item_in: OrderItemCreate,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    order = await crud_order.get_for_user(db=db, id=order_id, current_user=current_user)
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    if order.status != OrderStatus.OPEN:
        raise HTTPException(status_code=400, detail="A comanda não está aberta")
        
    updated_order = await crud_order.add_item_to_order(
        db=db, order=order, item_in=item_in, current_user=current_user
    )
    return updated_order


@router.patch("/{order_id}/cancel", response_model=OrderSchema)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    """Cancela uma comanda aberta."""
    order_to_cancel = await get_full_order(db=db, id=order_id)
    if not order_to_cancel or order_to_cancel.store_id != current_user.store_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada.")
    
    return await crud_order.cancel_order(db=db, order=order_to_cancel, current_user=current_user)


@router.get("/{order_id}", response_model=OrderSchema)
async def read_order(
    order_id: int,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    order = await crud_order.get_for_user(db=db, id=order_id, current_user=current_user)
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    return order

@router.get("/table/{table_id}/open", response_model=OrderSchema)
async def get_open_order_by_table(
    table_id: int,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user)
):
    order = await crud_order.get_open_order_by_table(db=db, table_id=table_id, current_user=current_user)
    if not order:
        raise HTTPException(status_code=404, detail="Nenhuma comanda aberta encontrada para esta mesa")
    return order