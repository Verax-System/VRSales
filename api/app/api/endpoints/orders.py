from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.crud import crud_order
from app.models.user import User as UserModel
from app.schemas.order import Order as OrderSchema, OrderCreate, OrderUpdate, OrderItem, OrderItemCreate
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.enums import UserRole, OrderStatus, OrderItemStatus, OrderType

router = APIRouter()

manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN])
full_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.SUPER_ADMIN])

@router.post(
    "/",
    response_model=OrderSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(full_permissions)],
    summary="Criar uma nova comanda"
)
async def create_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_in: OrderCreate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Cria uma nova comanda, seja para uma mesa (DINE_IN) ou para delivery.
    """
    return await crud_order.order.create(db=db, obj_in=order_in, current_user=current_user)

@router.get(
    "/table/{table_id}/open",
    response_model=OrderSchema,
    dependencies=[Depends(full_permissions)],
    summary="Obter ou criar comanda para uma mesa"
)
async def get_or_create_order_for_table(
    *,
    db: AsyncSession = Depends(get_db),
    table_id: int,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Verifica se já existe uma comanda aberta para a mesa.
    - Se existir, retorna a comanda existente.
    - Se não, cria uma nova.
    """
    existing_order = await crud_order.order.get_open_order_by_table(db, table_id=table_id, current_user=current_user)
    if existing_order:
        return existing_order

    order_in = OrderCreate(table_id=table_id, order_type=OrderType.DINE_IN)
    return await crud_order.order.create(db=db, obj_in=order_in, current_user=current_user)

@router.get(
    "/kitchen/",
    response_model=List[OrderSchema],
    dependencies=[Depends(manager_permissions)],
    summary="Obter comandas ativas para a cozinha (KDS)"
)
async def get_kitchen_orders(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """Retorna uma lista de comandas com status 'OPEN'."""
    return await crud_order.order.get_multi_by_status(db, statuses=[OrderStatus.OPEN], current_user=current_user)

@router.post("/{order_id}/items", response_model=OrderSchema, dependencies=[Depends(full_permissions)])
async def add_item_to_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_id: int,
    item_in: OrderItemCreate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """Adiciona um item a uma comanda existente."""
    return await crud_order.order.add_item_to_order(db, order_id=order_id, item_in=item_in, current_user=current_user)

@router.put(
    "/items/{item_id}/status",
    response_model=OrderItem,
    dependencies=[Depends(manager_permissions)],
    summary="Atualizar o status de um item da comanda (KDS)"
)
async def update_order_item_status(
    *,
    db: AsyncSession = Depends(get_db),
    item_id: int,
    new_status: OrderItemStatus = Body(..., embed=True),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """Atualiza o status de um item (ex: PENDING -> PREPARING -> READY)."""
    # Supondo que crud_order.order.update_order_item_status também foi convertido para async
    updated_item = await crud_order.order.update_order_item_status(db, item_id=item_id, new_status=new_status, current_user=current_user)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Item da comanda não encontrado.")
    return updated_item

@router.delete(
    "/{order_id}",
    response_model=OrderSchema,
    dependencies=[Depends(full_permissions)],
    summary="Cancelar uma comanda aberta"
)
async def cancel_open_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_id: int,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """Cancela (apaga) uma comanda se ela ainda estiver no status 'OPEN'."""
    # Supondo que crud_order.order.cancel_order também foi convertido para async
    order = await crud_order.order.cancel_order(db=db, order_id=order_id, current_user=current_user)
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada para cancelamento.")
    return order