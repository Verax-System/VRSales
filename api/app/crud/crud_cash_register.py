from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.cash_register import CashRegister, CashRegisterTransaction, TransactionType, CashRegisterStatus
from app.schemas.cash_register import CashRegisterCreate, CashRegisterUpdate

class CRUDCashRegister(CRUDBase[CashRegister, CashRegisterCreate, CashRegisterUpdate]):
    def create_with_opening_transaction(
        self, db: Session, *, user_id: int, opening_balance: float
    ) -> CashRegister:
        """Cria um novo registro de caixa e sua transação de abertura inicial."""
        
        # 1. Cria o registro do caixa
        cash_register_obj = CashRegister(
            user_id=user_id,
            opening_balance=opening_balance,
            status=CashRegisterStatus.OPEN
        )
        db.add(cash_register_obj)
        db.commit()
        db.refresh(cash_register_obj)
        
        # 2. Cria a transação de abertura
        opening_transaction = CashRegisterTransaction(
            cash_register_id=cash_register_obj.id,
            transaction_type=TransactionType.OPENING_BALANCE,
            amount=opening_balance,
            description="Saldo de abertura do caixa"
        )
        db.add(opening_transaction)
        db.commit()
        
        return cash_register_obj

cash_register = CRUDCashRegister(CashRegister)