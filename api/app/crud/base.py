# api/app/crud/base.py

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.db.base import Base
from app.models.user import User

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any, *, current_user: User) -> Optional[ModelType]:
        """Busca um registo pelo ID, filtrando pela loja do utilizador, a menos que seja super_admin."""
        stmt = select(self.model).filter(self.model.id == id)
        if current_user.role != 'super_admin':
            stmt = stmt.filter(self.model.store_id == current_user.store_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    # --- INÍCIO DA CORREÇÃO ---
    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, current_user: User
    ) -> List[ModelType]:
        """
        Busca múltiplos registos com paginação.
        - Filtra pela loja do utilizador, a menos que seja super_admin.
        """
        stmt = select(self.model)
        if hasattr(self.model, 'store_id') and current_user.role != 'super_admin':
            stmt = stmt.filter(self.model.store_id == current_user.store_id)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
    # --- FIM DA CORREÇÃO ---

    # (O restante do arquivo base.py continua o mesmo...)
    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType, current_user: User) -> ModelType:
        obj_in_data = obj_in.model_dump()
        if hasattr(self.model, 'store_id'):
            if current_user.role != 'super_admin':
                obj_in_data['store_id'] = current_user.store_id
            elif 'store_id' not in obj_in_data:
                # O create de Store não precisa de user, então fazemos uma exceção
                if self.model.__tablename__ != 'stores':
                     raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Para super_admin, o 'store_id' é obrigatório ao criar um item do tipo '{self.model.__tablename__}'."
                    )
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
        obj_data = db_obj.__dict__
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

    async def remove(self, db: AsyncSession, *, id: int, current_user: User) -> Optional[ModelType]:
        obj = await self.get(db, id=id, current_user=current_user)
        if not obj:
            return None
        await db.delete(obj)
        await db.commit()
        return obj