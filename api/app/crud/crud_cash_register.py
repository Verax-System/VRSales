# app/crud/crud_cash_register.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.base import CRUDBase
from app.models.user import User
from app.models.cash_register import CashRegister, CashRegisterTransaction, TransactionType, CashRegisterStatus
from app.schemas.cash_register import CashRegisterCreate, CashRegisterUpdate, CashRegisterOpen

class CRUDCashRegister(CRUDBase[CashRegister, CashRegisterCreate, CashRegisterUpdate]):
    
    async def get_open_register_for_store(self, db: AsyncSession, *, store_id: int) -> CashRegister | None:
        """Busca um caixa com status 'OPEN' para uma loja específica."""
        stmt = select(CashRegister).filter(
            CashRegister.store_id == store_id,
            CashRegister.status == CashRegisterStatus.OPEN
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def open_register(self, db: AsyncSession, *, user: User, open_info: CashRegisterOpen) -> CashRegister:
        """Cria um novo registro de caixa e sua transação de abertura inicial."""
        
        # 1. Cria o registro do caixa
        cash_register_obj = CashRegister(
            user_id=user.id,
            store_id=user.store_id,
            opening_balance=open_info.opening_balance,
            status=CashRegisterStatus.OPEN
        )
        db.add(cash_register_obj)
        await db.flush() # Para obter o ID do cash_register_obj
        
        # 2. Cria a transação de abertura (suprimento)
        opening_transaction = CashRegisterTransaction(
            cash_register_id=cash_register_obj.id,
            transaction_type=TransactionType.SUPPLY,
            amount=open_info.opening_balance,
            description="Saldo de abertura do caixa"
        )
        db.add(opening_transaction)
        
        await db.commit()
        await db.refresh(cash_register_obj)
        
        return cash_register_obj

cash_register = CRUDCashRegister(CashRegister)