from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import AsyncGenerator

from app.core import security
from app.db.session import AsyncSessionLocal  # Importa a sessão assíncrona
from app.models.user import User as UserModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependência que fornece uma sessão assíncrona do banco de dados.
    """
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> UserModel:
    """
    Decodifica o token JWT para obter o usuário atual de forma assíncrona.
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
    
    # Faz a query de forma assíncrona
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

# O RoleChecker pode continuar como está
from app.schemas.enums import UserRole
from typing import List

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