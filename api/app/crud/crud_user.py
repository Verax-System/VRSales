from typing import Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
# --- INÍCIO DA CORREÇÃO ---
# Importa AMBAS as funções: uma para criar o hash, outra para verificar.
from app.core.security import get_password_hash, verify_password
# --- FIM DA CORREÇÃO ---


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        # --- CORREÇÃO PRINCIPAL ---
        # Usa a função 'verify_password' em vez de tentar chamar um método inexistente.
        if not verify_password(password, user.hashed_password):
            return None
        # --- FIM DA CORREÇÃO ---
        return user

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        create_data = obj_in.dict()
        # O store_id pode ser nulo para um SUPER_ADMIN, o que está correto.
        # Se um admin de loja criar um utilizador, o frontend deve garantir que o store_id é enviado.
        
        password = create_data.pop("password")
        
        db_obj = User(**create_data)
        db_obj.hashed_password = get_password_hash(password)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

user = CRUDUser(User)