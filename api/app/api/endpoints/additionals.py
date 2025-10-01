from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente
from app.schemas.additional import Additional, AdditionalCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/", response_model=Additional)
async def create_additional(
    additional_in: AdditionalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.create_additional(db=db, additional=additional_in)

@router.get("/", response_model=List[Additional])
async def read_additionals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido para consistência
):
    return await crud.get_additionals(db)