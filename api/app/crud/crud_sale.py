from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, asc
from fastapi import HTTPException, status

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.batch import ProductBatch
from app.schemas.sale import SaleCreate
from app.crud.crud_cash_register import get_open_session_by_user

async def _deduct_stock_from_batches(db: AsyncSession, item_id: int, quantity_to_deduct: float, is_product: bool):
    """
    Função auxiliar para dar baixa no estoque de lotes (PEPS/FEFO).
    Funciona tanto para Produtos quanto para Insumos.
    """
    model = Product if is_product else Ingredient
    
    # Carrega os lotes ordenados por data de validade (nulos por último)
    query = select(ProductBatch).where(ProductBatch.product_id == item_id if is_product else False) # Ajustar para insumos se necessário
    if not is_product:
        # Esta parte precisa ser ajustada se insumos também tiverem lotes.
        # Por enquanto, focamos em produtos com lotes.
        # Para um sistema completo, Insumos também teriam um campo `batches`.
        # Vamos assumir que apenas produtos finais têm lotes por agora.
        target_item = await db.get(Ingredient, item_id)
        if target_item.stock < quantity_to_deduct:
             raise HTTPException(status_code=400, detail=f"Estoque insuficiente para o insumo ID {item_id}")
        target_item.stock -= quantity_to_deduct
        return

    # Lógica FEFO para produtos
    target_item = await db.get(Product, item_id)
    if not target_item:
        raise HTTPException(status_code=404, detail=f"Item com ID {item_id} não encontrado")

    if target_item.stock < quantity_to_deduct:
        raise HTTPException(status_code=400, detail=f"Estoque consolidado insuficiente para '{target_item.name}'")

    batches_result = await db.execute(
        select(ProductBatch)
        .where(ProductBatch.product_id == item_id, ProductBatch.quantity > 0)
        .order_by(asc(ProductBatch.expiration_date).nulls_last())
    )
    batches = batches_result.scalars().all()

    remaining_quantity = quantity_to_deduct
    for batch in batches:
        if remaining_quantity <= 0:
            break
        
        quantity_from_this_batch = min(batch.quantity, remaining_quantity)
        batch.quantity -= quantity_from_this_batch
        remaining_quantity -= quantity_from_this_batch

    if remaining_quantity > 0:
        raise HTTPException(status_code=400, detail=f"Não foi possível alocar o estoque de '{target_item.name}' dos lotes existentes.")

    # Atualiza o estoque consolidado
    target_item.stock -= quantity_to_deduct


async def create_sale(db: AsyncSession, sale_in: SaleCreate, user_id: int) -> Sale:
    active_session = await get_open_session_by_user(db, user_id=user_id)
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma sessão de caixa aberta para este usuário."
        )

    total_amount = 0.0
    db_sale_items = []
    
    for item in sale_in.items:
        product_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
            .options(selectinload(Product.recipe_items).selectinload("ingredient"))
        )
        product = product_result.scalars().first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Produto com ID {item.product_id} não encontrado.")

        # Lógica de baixa de estoque
        if product.recipe_items:
            # Produto com Ficha Técnica: baixa estoque dos INSUMOS
            for recipe_item in product.recipe_items:
                quantity_needed = recipe_item.quantity_needed * item.quantity
                # A função auxiliar _deduct_stock_from_batches precisa ser adaptada para Insumos
                # ou Insumos precisam ter sua própria lógica de baixa.
                # Simplificando por agora para a lógica de estoque simples de insumo.
                ingredient = recipe_item.ingredient
                if ingredient.stock < quantity_needed:
                     raise HTTPException(status_code=400, detail=f"Estoque insuficiente para o insumo '{ingredient.name}'")
                ingredient.stock -= quantity_needed
        else:
            # Produto sem Ficha Técnica (venda direta): baixa estoque dos LOTES do PRODUTO
            await _deduct_stock_from_batches(db, item_id=product.id, quantity_to_deduct=item.quantity, is_product=True)

        subtotal = product.price * item.quantity
        total_amount += subtotal

        db_sale_items.append(
            SaleItem(
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_sale=product.price
            )
        )

    db_sale = Sale(
        total_amount=total_amount,
        customer_id=sale_in.customer_id,
        user_id=user_id,
        items=db_sale_items,
        cash_register_session_id=active_session.id
    )
    db.add(db_sale)
    
    try:
        await db.commit()
        await db.refresh(db_sale)
        return db_sale
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao processar a venda: {e}")