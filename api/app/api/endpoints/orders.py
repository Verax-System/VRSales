# app/api/v1/endpoints/orders.py

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_order import order as crud_order, get_full_order
from app.api import dependencies
from app.models.user import User as UserModel
from app.schemas.order import Order as OrderSchema, OrderCreate, OrderItemCreate, PartialPaymentRequest, OrderMerge, OrderTransfer
from app.schemas.enums import OrderStatus

router = APIRouter()

# ... (endpoints create_order, read_order, etc. não mudam) ...
@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def create_order(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    order_in: OrderCreate,
    current_user: UserModel = Depends(dependencies.get_current_active_user)
) -> Any:
    if order_in.order_type == "DINE_IN" and not order_in.table_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O ID da mesa é obrigatório para comandas do tipo 'DINE_IN'.",
        )
    order = await crud_order.create(db=db, obj_in=order_in, current_user=current_user)
    return order

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

@router.post("/{order_id}/partial-payment", response_model=OrderSchema)
async def process_partial_payment(
    order_id: int,
    payment_request: PartialPaymentRequest,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    updated_order = await crud_order.process_partial_payment(
        db=db,
        order_id=order_id,
        payment_request=payment_request,
        current_user=current_user
    )
    return updated_order

@router.post("/{target_order_id}/merge", response_model=OrderSchema)
async def merge_orders(
    target_order_id: int,
    merge_in: OrderMerge,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    target_order = await crud_order.get_for_user(db=db, id=target_order_id, current_user=current_user)
    if not target_order:
        raise HTTPException(status_code=404, detail="Comanda de destino não encontrada.")

    updated_order = await crud_order.merge_orders(
        db=db,
        target_order=target_order,
        source_order_id=merge_in.source_order_id,
        current_user=current_user
    )
    return updated_order

@router.patch("/{order_id}/cancel", response_model=OrderSchema)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    """
    Cancela uma comanda aberta.
    """
    # --- CORREÇÃO AQUI ---
    # Usamos a função importada diretamente.
    order_to_cancel = await get_full_order(db=db, id=order_id)
    # --- FIM DA CORREÇÃO ---

    if not order_to_cancel or order_to_cancel.store_id != current_user.store_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada.")
    
    return await crud_order.cancel_order(db=db, order=order_to_cancel, current_user=current_user)

# --- INÍCIO DO NOVO ENDPOINT ---
@router.post("/{order_id}/transfer", response_model=OrderSchema)
async def transfer_order(
    order_id: int,
    transfer_in: OrderTransfer,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_active_user),
):
    """Transfere uma comanda para uma nova mesa."""
    order_to_transfer = await crud_order.get_for_user(db=db, id=order_id, current_user=current_user)
    if not order_to_transfer:
        raise HTTPException(status_code=404, detail="Comanda a ser transferida não encontrada.")

    updated_order = await crud_order.transfer_order(
        db=db,
        order_to_transfer=order_to_transfer,
        target_table_id=transfer_in.target_table_id,
        current_user=current_user
    )
    return updated_order
# --- FIM DO NOVO ENDPOINT ---