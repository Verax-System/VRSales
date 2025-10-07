from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# --- CORREÇÃO AQUI ---
from app.crud import crud_sale
from app.schemas.sale import Sale, SaleCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=Sale)
async def create_sale(
    sale_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_sale.create_sale(db=db, sale_in=sale_in, user_id=current_user.id)