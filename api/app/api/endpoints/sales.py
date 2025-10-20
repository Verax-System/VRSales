# api/app/api/endpoints/sales.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any # Adicione List e Any

from app import crud
from app.models.user import User as UserModel
from app.schemas.sale import Sale, SaleCreate
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.post("/", response_model=Sale, status_code=201)
async def create_sale(
    sale_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Cria uma nova venda (usado pelo POS).
    """
    return await crud.sale.create_with_items(db=db, obj_in=sale_in, current_user=current_user)

# --- INÍCIO DO NOVO ENDPOINT ---
@router.get("/", response_model=List[Sale])
async def read_sales(
    *,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Retorna uma lista de vendas da loja do usuário, da mais recente para a mais antiga.
    """
    return await crud.sale.get_multi_detailed(db, skip=skip, limit=limit, current_user=current_user)
# --- FIM DO NOVO ENDPOINT ---