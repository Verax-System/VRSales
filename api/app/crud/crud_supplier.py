from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate

async def get_supplier(db: AsyncSession, supplier_id: int) -> Optional[Supplier]:
    return await db.get(Supplier, supplier_id)

async def get_suppliers(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Supplier]:
    result = await db.execute(select(Supplier).offset(skip).limit(limit))
    return result.scalars().all()

async def create_supplier(db: AsyncSession, supplier: SupplierCreate) -> Supplier:
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    await db.commit()
    await db.refresh(db_supplier)
    return db_supplier

async def update_supplier(db: AsyncSession, db_supplier: Supplier, supplier_in: SupplierUpdate) -> Supplier:
    update_data = supplier_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    await db.commit()
    await db.refresh(db_supplier)
    return db_supplier

async def remove_supplier(db: AsyncSession, supplier_id: int) -> Optional[Supplier]:
    db_supplier = await get_supplier(db, supplier_id)
    if db_supplier:
        await db.delete(db_supplier)
        await db.commit()
    return db_supplier