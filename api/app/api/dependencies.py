from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import SessionLocal
from app import crud

# --- INÍCIO DA CORREÇÃO ---
# Importa o schema 'User' diretamente do seu módulo
from app.schemas.user import User
# --- FIM DA CORREÇÃO ---


# Define o esquema de autenticação: o token deve ser enviado no header "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token")

async def get_db():
    async with SessionLocal() as session:
        yield session

# A anotação de retorno agora usa 'User' diretamente
async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Decodifica o token JWT para obter o usuário atual.
    Se o token for inválido ou o usuário não existir, lança uma exceção.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        # Não precisamos mais do token_data aqui
    except JWTError:
        raise credentials_exception

    user = await crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user