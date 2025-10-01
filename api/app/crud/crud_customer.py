from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate

async def get_customer(db: AsyncSession, customer_id: int) -> Optional[Customer]:
    return await db.get(Customer, customer_id)

async def get_customers(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Customer]:
    result = await db.execute(select(Customer).offset(skip).limit(limit))
    return result.scalars().all()

async def create_customer(db: AsyncSession, customer: CustomerCreate) -> Customer:
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    await db.commit()
    await db.refresh(db_customer)
    return db_customer

async def update_customer(db: AsyncSession, db_customer: Customer, customer_in: CustomerUpdate) -> Customer:
    update_data = customer_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    await db.commit()
    await db.refresh(db_customer)
    return db_customer

async def remove_customer(db: AsyncSession, customer_id: int) -> Optional[Customer]:
    db_customer = await get_customer(db, customer_id)
    if db_customer:
        await db.delete(db_customer)
        await db.commit()
    return db_customer