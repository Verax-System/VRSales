from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.payment import Payment
from app.schemas.sale import SaleCreate
from app.crud.crud_cash_register import get_open_session_by_user

async def create_sale(db: AsyncSession, sale_in: SaleCreate, user_id: int) -> Sale:
    """
    Processa uma nova venda, exigindo uma sessão de caixa aberta.
    """
    # 1. --- VERIFICAÇÃO REATIVADA ---
    active_session = await get_open_session_by_user(db, user_id=user_id)
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma sessão de caixa aberta para este usuário. Abra o caixa para iniciar as vendas."
        )

    async with db.begin_nested():
        total_amount = 0.0
        
        for item in sale_in.items:
            product = await db.get(Product, item.product_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"Produto com ID {item.product_id} não encontrado.")
            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Estoque insuficiente para '{product.name}'")
            
            product.stock -= item.quantity
            total_amount += product.price * item.quantity

        total_paid = sum(p.amount for p in sale_in.payments)
        if total_paid < total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Valor pago (R$ {total_paid:.2f}) é menor que o total da venda (R$ {total_amount:.2f})."
            )
        
        db_sale = Sale(
            total_amount=total_amount,
            customer_id=sale_in.customer_id,
            user_id=user_id,
            cash_register_session_id=active_session.id, # Usa o ID da sessão ativa
            items=[SaleItem(
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_sale=(await db.get(Product, item.product_id)).price
            ) for item in sale_in.items],
            payments=[Payment(**p.model_dump()) for p in sale_in.payments]
        )
        db.add(db_sale)

    await db.refresh(db_sale, ["items", "payments"])
    return db_sale