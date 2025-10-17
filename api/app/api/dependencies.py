from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import AsyncGenerator, Optional, List # Adicionar Optional

from app.core import security
from app.db.session import AsyncSessionLocal
from app.models.user import User as UserModel
from app.schemas.enums import UserRole # Importar UserRole

# Mantemos o esquema original que FORÇA a autenticação
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token")

# --- INÍCIO DA MUDANÇA ---
# Criamos um NOVO esquema com auto_error=False.
# Isso tentará ler o token, mas não retornará um erro 401 se ele não existir.
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token", auto_error=False)
# --- FIM DA MUDANÇA ---


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> UserModel:
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
    
    result = await db.execute(select(UserModel).filter(UserModel.id == int(user_id)))
    user = result.scalars().first()

    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# --- INÍCIO DA MUDANÇA ---
async def get_current_active_user_optional(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme_optional)
) -> Optional[UserModel]:
    """
    Tenta obter o usuário autenticado. Se não houver token ou for inválido,
    retorna None em vez de lançar uma exceção.
    """
    if token is None:
        return None  # Nenhum token foi fornecido

    try:
        payload = security.decode_access_token(token)
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        result = await db.execute(select(UserModel).filter(UserModel.id == int(user_id)))
        user = result.scalars().first()

        if user is None or not user.is_active:
            return None
            
        return user
    except Exception:
        # Se qualquer erro ocorrer na validação do token, tratamos como usuário não logado
        return None
# --- FIM DA MUDANÇA ---


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