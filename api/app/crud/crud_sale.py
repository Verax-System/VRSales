from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.schemas.sale import SaleCreate
from app.crud.crud_cash_register import get_open_session_by_user

async def create_sale(db: AsyncSession, sale_in: SaleCreate, user_id: int) -> Sale:
    """
    Cria uma nova venda de forma transacional com lógica de ficha técnica.
    1. Valida se há um caixa aberto.
    2. Para cada item da venda:
       - Se o produto tem ficha técnica, valida e baixa o estoque dos insumos.
       - Se não tem, valida e baixa o estoque do próprio produto.
    3. Calcula o valor total.
    4. Cria a venda e seus itens.
    Se qualquer passo falhar, nada é salvo no banco.
    """
    # 1. Valida a sessão de caixa
    active_session = await get_open_session_by_user(db, user_id=user_id)
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma sessão de caixa aberta para este usuário. Abra o caixa para registrar vendas."
        )

    total_amount = 0.0
    db_sale_items = []
    
    # Itera sobre os itens do pedido para validação
    for item in sale_in.items:
        # Carrega o produto e sua receita (se houver) de forma otimizada
        product_result = await db.execute(
            select(Product)
            .where(Product.id == item.product_id)
            .options(selectinload(Product.recipe_items).selectinload("ingredient"))
        )
        product = product_result.scalars().first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto com ID {item.product_id} não encontrado."
            )

        # Lógica de baixa de estoque
        if product.recipe_items:
            # Produto TEM ficha técnica: baixa o estoque dos insumos
            for recipe_item in product.recipe_items:
                ingredient = recipe_item.ingredient
                quantity_needed = recipe_item.quantity_needed * item.quantity
                
                if ingredient.stock < quantity_needed:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Estoque insuficiente para o insumo '{ingredient.name}' necessário para o produto '{product.name}'."
                    )
                ingredient.stock -= quantity_needed
        else:
            # Produto NÃO TEM ficha técnica: baixa o estoque do produto
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente para o produto '{product.name}'. Disponível: {product.stock}"
                )
            product.stock -= item.quantity

        # Calcula o subtotal e o total geral
        subtotal = product.price * item.quantity
        total_amount += subtotal

        # Prepara o objeto SaleItem para ser criado
        db_sale_items.append(
            SaleItem(
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_sale=product.price
            )
        )

    # Cria o objeto principal da Venda
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro ao processar a venda: {e}"
        )