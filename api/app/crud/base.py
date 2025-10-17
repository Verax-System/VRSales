# api/app/crud/base.py
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder

from app.db.base import Base
from app.models.user import User

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    # --- CORRIGIDO para ser async ---
    async def get(self, db: AsyncSession, id: Any, *, current_user: User) -> Optional[ModelType]:
        stmt = select(self.model).filter(self.model.id == id)
        if hasattr(self.model, 'store_id') and current_user.role != 'super_admin':
            stmt = stmt.filter(self.model.store_id == current_user.store_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    # --- CORRIGIDO para ser async ---
    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, current_user: User, **kwargs
    ) -> List[ModelType]:
        stmt = select(self.model)
        if hasattr(self.model, 'store_id') and current_user.role != 'super_admin':
            stmt = stmt.filter(self.model.store_id == current_user.store_id)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType, current_user: User) -> ModelType:
        obj_in_data = obj_in.model_dump()
        
        if hasattr(self.model, 'store_id'):
            if current_user.role != 'super_admin':
                obj_in_data['store_id'] = current_user.store_id
        
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
        
    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
        current_user: User
    ) -> ModelType:
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    # --- CORRIGIDO para ser async ---
    async def remove(self, db: AsyncSession, *, id: int, current_user: User) -> Optional[ModelType]:
        obj = await self.get(db, id=id, current_user=current_user)
        if not obj:
            return None
        await db.delete(obj)
        await db.commit()
        return obj