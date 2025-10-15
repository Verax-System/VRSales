from typing import Optional
from sqlalchemy.orm import Session

# Importa a classe base e os modelos/schemas
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """
    Operações CRUD para o modelo User, com métodos específicos.
    Herda get, get_multi, update, e remove de CRUDBase.
    """
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Busca um usuário pelo seu e-mail."""
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Cria um novo usuário, com hashing da senha.
        Sobrescreve o método 'create' da classe base.
        """
        # Cria o dicionário a partir do schema Pydantic
        create_data = obj_in.dict()
        # Remove a senha para tratá-la separadamente
        create_data.pop("password")
        # Cria o objeto do modelo SQLAlchemy
        db_obj = User(**create_data)
        # Define a senha hasheada
        db_obj.hashed_password = get_password_hash(obj_in.password)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Cria uma instância da classe para ser importada em outros lugares
user = CRUDUser(User)