from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.schemas.payment import OrderPaymentRequest # <-- Adicione
from app.models.payment import Payment # <-- Adicione
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem, OrderStatus, OrderType # <-- Adiciona OrderType
from app.models.additional import Additional, OrderItemAdditional # <-- ADICIONE
from app.schemas.enums import OrderItemStatus # Adicione a importação
from typing import List
from app.models.table import Table, TableStatus
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderItemCreate
from app.schemas.sale import SaleCreate, SaleItemCreate
from app.crud import crud_sale

async def create_delivery_order(db: AsyncSession, customer_id: int, address: str) -> Order:
    """Cria uma nova comanda para delivery."""
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    new_order = Order(
        order_type=OrderType.DELIVERY,
        customer_id=customer_id,
        delivery_address=address
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    return new_order
# --- FIM DA NOVA FUNÇÃO ---

async def get_open_order_by_table(db: AsyncSession, table_id: int) -> Order | None:
    """Busca uma comanda aberta para uma mesa específica."""
    result = await db.execute(
        select(Order)
        .where(Order.table_id == table_id, Order.status == OrderStatus.OPEN)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return result.scalars().first()

async def create_order_for_table(db: AsyncSession, table_id: int) -> Order:
    """Cria uma nova comanda para uma mesa e a ocupa."""
    table = await db.get(Table, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    if table.status == TableStatus.OCCUPIED:
        raise HTTPException(status_code=400, detail="Mesa já está ocupada com uma comanda aberta")

    # Cria a nova comanda
    new_order = Order(table_id=table.id)
    db.add(new_order)
    
    # Atualiza o status da mesa
    table.status = TableStatus.OCCUPIED
    
    await db.commit()
    await db.refresh(new_order)
    return new_order

async def add_item_to_order(db: AsyncSession, order: Order, item_in: OrderItemCreate) -> Order:
    """
    Adiciona um novo item a uma comanda aberta, incluindo observações e adicionais.
    """
    if order.status != OrderStatus.OPEN:
        raise HTTPException(status_code=400, detail="Não é possível adicionar itens a uma comanda fechada ou paga")

    product = await db.get(Product, item_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Produto com ID {item_in.product_id} não encontrado")
    
    total_additionals_price = 0.0
    additionals_to_associate = []
    if item_in.additional_ids:
        result = await db.execute(select(Additional).where(Additional.id.in_(item_in.additional_ids)))
        additionals = result.scalars().all()
        
        if len(additionals) != len(item_in.additional_ids):
            raise HTTPException(status_code=404, detail="Um ou mais IDs de adicionais não foram encontrados")
        
        for add_on in additionals:
            total_additionals_price += add_on.price
            additionals_to_associate.append(add_on)

    total_item_price = product.price + total_additionals_price

    new_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=item_in.quantity,
        price_at_order=total_item_price,
        notes=item_in.notes
    )
    
    new_item.additionals.extend(additionals_to_associate)
    db.add(new_item)
    await db.commit()

    # --- CORREÇÃO AQUI ---
    # Em vez de db.refresh, vamos buscar novamente a comanda completa.
    # Isso garante que todas as relações aninhadas sejam carregadas corretamente.
    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items)
            .selectinload(OrderItem.product),
            selectinload(Order.items)
            .selectinload(OrderItem.additionals)
        )
    )
    updated_order = result.scalars().first()
    return updated_order
    # --- FIM DA CORREÇÃO ---

async def finalize_order_payment(db: AsyncSession, order: Order, payment_in: OrderPaymentRequest, user_id: int) -> dict:
    """
    Finaliza o pagamento de uma comanda com múltiplos métodos de pagamento,
    transformando-a em uma Venda (Sale), dando baixa no estoque e liberando a mesa.
    """
    if order.status == OrderStatus.PAID:
        raise HTTPException(status_code=400, detail="Esta comanda já foi paga")

    # 1. Calcula o total da comanda
    order_total = sum(item.price_at_order * item.quantity for item in order.items)
    
    # 2. Calcula o total pago e valida
    total_paid = sum(p.amount for p in payment_in.payments)
    if total_paid < order_total:
        raise HTTPException(
            status_code=400,
            detail=f"Valor pago (R$ {total_paid:.2f}) é menor que o total da comanda (R$ {order_total:.2f})."
        )
    
    change_amount = total_paid - order_total

    # 3. Monta o schema de criação de venda
    sale_items_create = [
        SaleItemCreate(product_id=item.product_id, quantity=item.quantity)
        for item in order.items
    ]
    sale_create = SaleCreate(items=sale_items_create, customer_id=payment_in.customer_id)

    # 4. Chama a função de criar venda (que já baixa o estoque)
    # Precisamos ajustar create_sale para receber o total calculado e não recalcular
    # Por enquanto, vamos manter assim e refatorar create_sale depois.
    created_sale = await crud_sale.create_sale(db=db, sale_in=sale_create, user_id=user_id)

    # 5. Cria os registros de pagamento associados à nova venda
    for payment_data in payment_in.payments:
        db_payment = Payment(
            **payment_data.model_dump(),
            sale_id=created_sale.id
        )
        db.add(db_payment)

    # 6. Atualiza o status da comanda e da mesa
    order.status = OrderStatus.PAID
    order.closed_at = func.now()
    
    table = await db.get(Table, order.table_id)
    if table:
        table.status = TableStatus.AVAILABLE

    await db.commit()
    await db.refresh(created_sale, ["payments", "items"]) # Recarrega a venda com pagamentos e itens
async def get_kitchen_orders(db: AsyncSession) -> List[Order]:
    """
    Busca todas as comandas abertas que tenham itens pendentes ou em preparação.
    """
    result = await db.execute(
        select(Order)
        .join(Order.items)
        .where(
            Order.status == OrderStatus.OPEN,
            OrderItem.status.in_([OrderItemStatus.PENDING, OrderItemStatus.PREPARING])
        )
        .options(
            selectinload(Order.items)
            .selectinload(OrderItem.product) # Carrega os detalhes do produto
        )
        .distinct()
    )
    return result.scalars().all()

async def update_order_item_status(db: AsyncSession, item_id: int, status: OrderItemStatus) -> OrderItem:
    """
    Atualiza o status de um item de pedido específico.
    """
    db_item = await db.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item do pedido não encontrado")
    
    db_item.status = status
    await db.commit()
    await db.refresh(db_item)
    return db_item
    # 7. Retorna um dicionário com a venda e o troco
    return {"sale": created_sale, "change_amount": change_amount}


async def cancel_open_order(db: AsyncSession, order_id: int) -> Order | None:
    """
    Cancela uma comanda aberta, geralmente criada por engano.
    Libera a mesa associada, definindo seu status de volta para 'disponível'.
    """
    # Carrega a comanda e a mesa associada em uma única consulta
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.table))
    )
    order_to_cancel = result.scalars().first()

    if not order_to_cancel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada")

    if order_to_cancel.status != OrderStatus.OPEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Apenas comandas abertas podem ser canceladas.")

    # Se a comanda estiver associada a uma mesa, libera a mesa
    if order_to_cancel.table:
        order_to_cancel.table.status = TableStatus.AVAILABLE

    # Exclui a comanda (e seus itens, devido ao 'cascade' no modelo)
    await db.delete(order_to_cancel)
    await db.commit()

    return order_to_cancel