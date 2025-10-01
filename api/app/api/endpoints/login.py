from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

# --- INÍCIO DA CORREÇÃO ---
# Importa o módulo CRUD específico para usuários
from app.crud import crud_user
# Importa as dependências e configurações necessárias
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.api.dependencies import get_db
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/token")
async def login_for_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Fornece um token de acesso JWT para um usuário autenticado.
    """
    # A chamada agora usa crud_user
    user = await crud_user.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}