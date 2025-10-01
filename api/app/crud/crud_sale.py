from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.crud.crud_cash_register import get_open_session_by_user # <-- ADICIONE

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.sale import SaleCreate

async def create_sale(db: AsyncSession, sale_in: SaleCreate, user_id: int) -> Sale:
    total_amount = 0.0
    db_sale_items = []
    
    # Itera sobre os itens do pedido para validação
    for item in sale_in.items:
        # Pega o produto do banco de dados
        product = await db.get(Product, item.product_id)

        # Validações
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto com ID {item.product_id} não encontrado."
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estoque insuficiente para o produto '{product.name}'. Disponível: {product.stock}"
            )
            active_session = await get_open_session_by_user(db, user_id=user_id)
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma sessão de caixa aberta para este usuário. Abra o caixa para registrar vendas."
        )

        # Baixa o estoque
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
        cash_register_session_id=active_session.id # <-- Associa a venda à sessão ativa
    )
    # Adiciona tudo à sessão. O SQLAlchemy gerencia a transação.
    db.add(db_sale)
    
    try:
        # Commita a transação. Se algo der errado aqui, tudo é desfeito (rollback).
        await db.commit()
        await db.refresh(db_sale)
        return db_sale
    except Exception as e:
        # Em caso de erro no commit, desfaz tudo
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro ao processar a venda: {e}"
        )