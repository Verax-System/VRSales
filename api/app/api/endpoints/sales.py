# api/app/api/endpoints/sales.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# --- INÍCIO DA CORREÇÃO ---
from app import crud # Importa o pacote crud inteiro
from app.models.user import User as UserModel
from app.schemas.sale import Sale, SaleCreate
from app.api.dependencies import get_db, get_current_active_user
# --- FIM DA CORREÇÃO ---

router = APIRouter()

@router.post("/", response_model=Sale)
async def create_sale(
    sale_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Cria uma nova venda (usado pelo POS).
    """
    # --- CORREÇÃO: Usa a referência completa a partir do pacote crud ---
    return await crud.sale.create_with_items(db=db, obj_in=sale_in, current_user=current_user)