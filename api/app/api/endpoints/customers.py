from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, models, crud
# --- INÍCIO DA ATUALIZAÇÃO ---
from app.api.dependencies import get_db, RoleChecker, get_current_active_user
from app.schemas.enums import UserRole
from sqlalchemy.orm import selectinload # Importa para carregamento otimizado
# --- FIM DA ATUALIZAÇÃO ---


router = APIRouter()

# --- INÍCIO DA ATUALIZAÇÃO ---
# Define permissões. Gerentes e admins podem ver dados de clientes.
manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])
# --- FIM DA ATUALIZAÇÃO ---


# ... (mantenha os endpoints existentes de create_customer, read_customers, etc.)

# --- INÍCIO DO NOVO ENDPOINT ---
@router.get(
    "/{customer_id}/sales",
    response_model=List[schemas.Sale],
    dependencies=[Depends(manager_permissions)],
    summary="Obter Histórico de Vendas do Cliente"
)
def get_customer_sales_history(
    *,
    db: Session = Depends(get_db),
    customer_id: int,
    current_user: models.User = Depends(get_current_active_user) # Injeta o usuário logado
):
    """
    Recupera o histórico completo de vendas para um cliente específico.
    
    Acessível apenas para **Admins** e **Gerentes**.
    """
    customer = crud.customer.get(db, id=customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado."
        )
    
    # Acessa as vendas diretamente através do relacionamento SQLAlchemy
    # O 'back_populates' que configuramos no modelo torna isso possível.
    # O uso de options(selectinload(...)) otimiza a query, evitando o problema N+1.
    
    # Para que isso funcione, você precisa de um método no CRUD que suporte options.
    # Vamos adicionar um método get_sales_by_customer_id ao crud_sale.
    sales = crud.sale.get_sales_by_customer(db, customer_id=customer_id)
    
    return sales
# --- FIM DO NOVO ENDPOINT ---