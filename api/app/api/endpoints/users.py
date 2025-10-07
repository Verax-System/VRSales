from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# Importa o módulo CRUD específico para usuários
from app.crud import crud_user
# Importa os schemas e dependências necessários diretamente
from app.schemas.user import User, UserCreate
# --- CORREÇÃO: Adiciona a importação do 'get_current_user' ---
from app.api.dependencies import get_db, get_current_user


router = APIRouter()

@router.post("/", response_model=User)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Cria um novo usuário.
    """
    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Um usuário com este email já existe no sistema.",
        )
    user = await crud_user.create_user(db=db, user=user_in)
    return user

# --- CÓDIGO NOVO ADICIONADO ---
@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do usuário atualmente autenticado.
    """
    return current_user