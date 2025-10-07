from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app.crud import crud_order  # Importa o módulo específico 'crud_order'
# Importa os schemas e dependências necessários diretamente
from app.schemas.order import Order, OrderItemCreate, OrderCreateTable, OrderCreateDelivery
from app.schemas.user import User
from app.schemas.payment import OrderPaymentRequest
from app.schemas.sale import Sale
from app.models.order import Order as OrderModel # Importa o modelo ORM com um alias
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---
from app.schemas.enums import OrderItemStatus # Adicione
from app.schemas.order import OrderItem # Adicione



router = APIRouter()

@router.post("/table", response_model=Order, summary="Abrir comanda em uma Mesa")
async def create_order_for_table_endpoint(
    order_in: OrderCreateTable,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Abre uma nova comanda para a mesa especificada e ocupa a mesa."""
    # CORREÇÃO: Usa 'crud_order' para chamar a função
    return await crud_order.create_order_for_table(db=db, table_id=order_in.table_id)



@router.post("/delivery", response_model=Order, summary="Criar pedido de Delivery")
async def create_delivery_order_endpoint(
    order_in: OrderCreateDelivery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova comanda para entrega (delivery)."""
    # CORREÇÃO: Usa 'crud_order' para chamar a função
    return await crud_order.create_delivery_order(
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
    # CORREÇÃO: Usa 'crud_order' para chamar a função
    order = await crud_order.get_open_order_by_table(db, table_id=table_id)
    if not order:
        raise HTTPException(status_code=404, detail="Nenhuma comanda aberta encontrada para esta mesa")
    return order



@router.post("/{order_id}/items", response_model=Order)
async def add_item_to_order_endpoint(
    order_id: int,
    item_in: OrderItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona um produto a uma comanda existente."""
    order = await db.get(OrderModel, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    # CORREÇÃO: Usa 'crud_order' para chamar a função
    return await crud_order.add_item_to_order(db=db, order=order, item_in=item_in)


@router.post("/{order_id}/pay", response_model=Sale)
async def pay_order(
    order_id: int,
    payment_in: OrderPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finaliza e paga uma comanda com múltiplos métodos de pagamento,
    registrando-a como uma venda.
    """
    order = await db.get(OrderModel, order_id, options=[selectinload(OrderModel.items)])
    if not order:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    
    # CORREÇÃO: Usa 'crud_order' para chamar a função
    result = await crud_order.finalize_order_payment(db=db, order=order, payment_in=payment_in, user_id=current_user.id)
    
    final_sale = result["sale"]
    final_sale.change_amount = result["change_amount"]
    
    return final_sale

@router.get("/kitchen/", response_model=List[Order])
async def get_kitchen_orders_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna uma lista de pedidos ativos para o painel da cozinha (KDS).
    """
    return await crud.get_kitchen_orders(db)

@router.put("/items/{item_id}/status", response_model=OrderItem)
async def update_item_status_endpoint(
    item_id: int,
    status: OrderItemStatus, # Recebe o status diretamente no corpo da requisição
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza o status de um item de pedido (pending -> preparing -> ready).
    """
    return await crud.update_order_item_status(db=db, item_id=item_id, status=status)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order_endpoint(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancela uma comanda aberta, liberando a mesa associada.
    Ideal para comandas abertas por engano.
    """
    await crud_order.cancel_open_order(db=db, order_id=order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)