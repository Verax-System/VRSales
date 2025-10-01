from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.crud import crud_attribute
from app.schemas.variation import Attribute, AttributeCreate, AttributeOption, AttributeOptionCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=Attribute)
async def create_attribute(
    attribute_in: AttributeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo Atributo (ex: Cor, Tamanho)."""
    return await crud_attribute.create_attribute(db=db, attribute=attribute_in)

@router.get("/", response_model=List[Attribute])
async def read_attributes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os Atributos e suas Opções."""
    return await crud_attribute.get_attributes(db)

@router.post("/{attribute_id}/options", response_model=AttributeOption)
async def create_attribute_option(
    attribute_id: int,
    option_in: AttributeOptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova Opção para um Atributo (ex: Adicionar 'Verde' à 'Cor')."""
    return await crud_attribute.create_attribute_option(db=db, option=option_in, attribute_id=attribute_id)