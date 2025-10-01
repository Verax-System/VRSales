from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.cash_register import CashRegisterSession
from app.models.sale import Sale
from app.schemas.cash_register import CashRegisterOpen, CashRegisterClose

async def get_open_session_by_user(db: AsyncSession, user_id: int) -> CashRegisterSession | None:
    """Busca uma sessão de caixa aberta para um usuário específico."""
    result = await db.execute(
        select(CashRegisterSession).where(
            CashRegisterSession.user_id == user_id,
            CashRegisterSession.is_open == True
        )
    )
    return result.scalars().first()

async def open_session(db: AsyncSession, session_in: CashRegisterOpen, user_id: int) -> CashRegisterSession:
    """Abre uma nova sessão de caixa para o usuário."""
    db_session = CashRegisterSession(
        opening_balance=session_in.opening_balance,
        user_id=user_id
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

async def close_session(db: AsyncSession, db_session: CashRegisterSession) -> CashRegisterSession:
    """Fecha a sessão de caixa ativa."""
    db_session.is_open = False
    db_session.closed_at = func.now()
    # O closing_balance virá do input do usuário, mas aqui apenas fechamos a sessão.
    # A validação ocorrerá no endpoint.
    await db.commit()
    await db.refresh(db_session)
    return db_session

async def get_session_sales_total(db: AsyncSession, session_id: int) -> float:
    """Calcula o total de vendas para uma sessão de caixa."""
    result = await db.execute(
        select(func.sum(Sale.total_amount)).where(Sale.cash_register_session_id == session_id)
    )
    total = result.scalar_one_or_none()
    return total or 0.0