from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# --- INÍCIO DA CORREÇÃO ---
from app import crud
from app.schemas.user import User, UserCreate # Importa as classes diretamente
from app.db.session import SessionLocal
# --- FIM DA CORREÇÃO ---


router = APIRouter()

async def get_db():
    async with SessionLocal() as session:
        yield session

# Use "User" e "UserCreate" diretamente, sem o prefixo "schemas."
@router.post("/", response_model=User)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Cria um novo usuário.
    """
    user = await crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Um usuário com este email já existe no sistema.",
        )
    user = await crud.create_user(db=db, user=user_in)
    return user