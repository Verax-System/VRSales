from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.models.additional import Additional
from app.schemas.additional import AdditionalCreate

async def get_additionals(db: AsyncSession) -> List[Additional]:
    result = await db.execute(select(Additional))
    return result.scalars().all()

async def create_additional(db: AsyncSession, additional: AdditionalCreate) -> Additional:
    db_additional = Additional(**additional.model_dump())
    db.add(db_additional)
    await db.commit()
    await db.refresh(db_additional)
    return db_additional