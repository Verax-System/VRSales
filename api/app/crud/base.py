from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.base import Base
from app.models.user import User # Importar o modelo User

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any, *, current_user: User) -> Optional[ModelType]:
        """Busca um registo pelo ID, filtrando pela loja do utilizador."""
        return db.query(self.model).filter(self.model.id == id, self.model.store_id == current_user.store_id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100, current_user: User
    ) -> List[ModelType]:
        """Busca múltiplos registos com paginação, filtrando pela loja do utilizador."""
        return db.query(self.model).filter(self.model.store_id == current_user.store_id).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType, current_user: User) -> ModelType:
        """Cria um novo registo, associando-o automaticamente à loja do utilizador."""
        obj_in_data = obj_in.dict()
        # Adiciona o store_id do utilizador atual aos dados de criação
        obj_in_data['store_id'] = current_user.store_id
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
        current_user: User
    ) -> ModelType:
        """Atualiza um registo existente (assumindo que já foi filtrado pela loja)."""
        # A verificação de permissão de loja deve ocorrer antes de chamar este método,
        # geralmente no endpoint ao chamar o método `get`.
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int, current_user: User) -> ModelType:
        """Remove um registo pelo ID, garantindo que pertence à loja do utilizador."""
        obj = self.get(db, id=id, current_user=current_user) # Usa o `get` modificado para segurança
        if not obj:
            return None
        db.delete(obj)
        db.commit()
        return obj