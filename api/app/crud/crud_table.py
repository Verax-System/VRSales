from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate

async def get_table(db: AsyncSession, table_id: int) -> Optional[Table]:
    return await db.get(Table, table_id)

async def get_tables(db: AsyncSession) -> List[Table]:
    result = await db.execute(select(Table).order_by(Table.number))
    return result.scalars().all()

async def create_table(db: AsyncSession, table: TableCreate) -> Table:
    db_table = Table(**table.model_dump())
    db.add(db_table)
    await db.commit()
    await db.refresh(db_table)
    return db_table

async def update_table(db: AsyncSession, db_table: Table, table_in: TableUpdate) -> Table:
    update_data = table_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_table, key, value)
    await db.commit()
    await db.refresh(db_table)
    return db_table