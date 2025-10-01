from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente
from app.schemas.order import Order, OrderItemCreate, OrderCreateTable, OrderCreateDelivery
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/table", response_model=Order, summary="Abrir comanda em uma Mesa")
async def create_order_for_table_endpoint(
    order_in: OrderCreateTable,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Abre uma nova comanda para a mesa especificada e ocupa a mesa."""
    return await crud.create_order_for_table(db=db, table_id=order_in.table_id)


@router.post("/delivery", response_model=Order, summary="Criar pedido de Delivery")
async def create_delivery_order_endpoint(
    order_in: OrderCreateDelivery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova comanda para entrega (delivery)."""
    return await crud.create_delivery_order(
        db=db,
        customer_id=order_in.customer_id,
        address=order_in.delivery_address
    )


@router.get("/table/{table_id}/open", response_model=Order)
async def get_open_order(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Busca a comanda que está aberta na mesa especificada."""
    order = await crud.get_open_order_by_table(db, table_id=table_id)
    if not order:
        raise HTTPException(status_code=404, detail="Nenhuma comanda aberta encontrada para esta mesa")
    # Precisamos carregar o objeto ORM Order para que o Pydantic possa usá-lo
    # A função get_open_order_by_table já faz isso com os relacionamentos.
    return order


@router.post("/{order_id}/items", response_model=Order)
async def add_item_to_order_endpoint( # Renomeado para evitar conflito
    order_id: int,
    item_in: OrderItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona um produto a uma comanda existente."""
    order = await db.get(crud.Order, order_id) # Usando o modelo ORM diretamente
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    return await crud.add_item_to_order(db=db, order=order, item_in=item_in)


@router.post("/{order_id}/pay", response_model=Order)
async def pay_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Finaliza e paga uma comanda, registrando-a como uma venda."""
    order = await db.get(crud.Order, order_id) # Usando o modelo ORM diretamente
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    return await crud.finalize_order_payment(db=db, order=order, user_id=current_user.id)