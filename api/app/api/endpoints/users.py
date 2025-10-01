from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# --- INÍCIO DA CORREÇÃO ---
# Importa o módulo CRUD específico para usuários
from app.crud import crud_user
# Importa os schemas e dependências necessários diretamente
from app.schemas.user import User, UserCreate
from app.api.dependencies import get_db
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/", response_model=User)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Cria um novo usuário.
    """
    # A chamada agora usa crud_user
    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Um usuário com este email já existe no sistema.",
        )
    # A chamada agora usa crud_user
    user = await crud_user.create_user(db=db, user=user_in)
    return user