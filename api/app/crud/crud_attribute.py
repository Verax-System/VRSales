from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.models.variation import Attribute, AttributeOption
from app.schemas.variation import AttributeCreate, AttributeOptionCreate

# --- Atributos (ex: Cor, Tamanho) ---
async def create_attribute(db: AsyncSession, attribute: AttributeCreate) -> Attribute:
    db_attribute = Attribute(**attribute.model_dump())
    db.add(db_attribute)
    await db.commit()
    await db.refresh(db_attribute)
    return db_attribute

async def get_attributes(db: AsyncSession) -> List[Attribute]:
    result = await db.execute(select(Attribute).options(selectinload(Attribute.options)))
    return result.scalars().all()

# --- Opções de Atributo (ex: Azul, P, M) ---
async def create_attribute_option(db: AsyncSession, option: AttributeOptionCreate, attribute_id: int) -> AttributeOption:
    db_option = AttributeOption(**option.model_dump(), attribute_id=attribute_id)
    db.add(db_option)
    await db.commit()
    await db.refresh(db_option)
    return db_option