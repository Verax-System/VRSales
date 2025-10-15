from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List

from app.core import security
from app.db.session import SessionLocal
from app.models.user import User as UserModel
from app.schemas.enums import UserRole
# A importação do crud_user já não é necessária aqui, mas não faz mal mantê-la
from app.crud import crud_user 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> UserModel:
    """
    Descodifica o token JWT para obter o utilizador atual.
    Levanta uma exceção HTTP 401 se o token for inválido ou o utilizador não for encontrado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = security.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    # --- INÍCIO DA CORREÇÃO ---
    # Em vez de usar o método CRUD genérico, que agora exige um 'current_user',
    # fazemos uma consulta direta à base de dados para este caso especial de autenticação.
    user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()
    # --- FIM DA CORREÇÃO ---

    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserModel = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {' or '.join(role.value for role in self.allowed_roles)}",
            )
        return user