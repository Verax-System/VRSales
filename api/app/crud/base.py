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

    async def get(self, db: AsyncSession, id: Any, *, current_user: User) -> Optional[ModelType]:
        stmt = select(self.model).filter(self.model.id == id)
        # Se o modelo tem 'store_id' e o usuário não é super_admin, filtra pela loja dele
        if hasattr(self.model, 'store_id') and current_user.role != 'super_admin':
            stmt = stmt.filter(self.model.store_id == current_user.store_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, current_user: User
    ) -> List[ModelType]:
        stmt = select(self.model)
        if hasattr(self.model, 'store_id') and current_user.role != 'super_admin':
            stmt = stmt.filter(self.model.store_id == current_user.store_id)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    # --- LÓGICA DE CRIAÇÃO CORRIGIDA E SIMPLIFICADA ---
    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType, current_user: User) -> ModelType:
        """
        Cria um novo registro.
        - Se o modelo a ser criado tiver um campo 'store_id' e o usuário logado
          não for um 'super_admin', o 'store_id' do usuário será injetado automaticamente.
        - Modelos que não têm 'store_id' (como a própria Loja) são criados normalmente.
        """
        obj_in_data = jsonable_encoder(obj_in)
        
        # Apenas modifica os dados se o modelo tiver 'store_id'
        if hasattr(self.model, 'store_id'):
            # Se o usuário não for super_admin, ele SÓ PODE criar itens para a sua própria loja
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

    async def remove(self, db: AsyncSession, *, id: int, current_user: User) -> Optional[ModelType]:
        obj = await self.get(db, id=id, current_user=current_user)
        if not obj:
            return None # O get já filtra por permissão, então não precisa de checagem extra
        await db.delete(obj)
        await db.commit()
        return obj