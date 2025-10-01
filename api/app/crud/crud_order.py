from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem, OrderStatus, OrderType # <-- Adiciona OrderType
from app.models.additional import Additional, OrderItemAdditional # <-- ADICIONE

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
    
    # --- LÓGICA DE ADICIONAIS ---
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

    # O preço total do item é o preço base + a soma dos adicionais
    total_item_price = product.price + total_additionals_price

    new_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=item_in.quantity,
        price_at_order=total_item_price, # <-- Preço atualizado
        notes=item_in.notes # <-- Adiciona as observações
    )
    
    # Associa os adicionais ao novo item
    new_item.additionals.extend(additionals_to_associate)
    
    db.add(new_item)
    
    await db.commit()
    # Recarrega a comanda com os novos itens e seus detalhes
    await db.refresh(order, ['items.additionals'])
    
    return order

async def finalize_order_payment(db: AsyncSession, order: Order, user_id: int) -> Order:
    """
    Finaliza o pagamento de uma comanda, transformando-a em uma Venda (Sale),
    dando baixa no estoque e liberando a mesa.
    """
    if order.status == OrderStatus.PAID:
        raise HTTPException(status_code=400, detail="Esta comanda já foi paga")

    # 1. Monta o schema de criação de venda a partir da comanda
    sale_items_create = [
        SaleItemCreate(product_id=item.product_id, quantity=item.quantity)
        for item in order.items
    ]
    sale_create = SaleCreate(items=sale_items_create) # Customer ID pode ser adicionado aqui futuramente

    # 2. Chama a função de criar venda (que já é transacional e baixa o estoque)
    await crud_sale.create_sale(db=db, sale_in=sale_create, user_id=user_id)

    # 3. Atualiza o status da comanda e da mesa
    order.status = OrderStatus.PAID
    order.closed_at = func.now()
    
    table = await db.get(Table, order.table_id)
    if table:
        table.status = TableStatus.AVAILABLE

    await db.commit()
    await db.refresh(order)
    return order