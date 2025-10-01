from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente
from app.schemas.sale import Sale, SaleCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---

router = APIRouter()

# Use 'Sale', 'SaleCreate' e 'User' diretamente
@router.post("/", response_model=Sale)
async def create_sale(
    sale_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova venda.
    - Requer autenticação.
    - É uma operação transacional:
      - Valida e baixa o estoque dos produtos.
      - Cria o registro da venda e seus itens.
      - Se qualquer passo falhar, a operação inteira é desfeita.
    """
    return await crud.create_sale(db=db, sale_in=sale_in, user_id=current_user.id)