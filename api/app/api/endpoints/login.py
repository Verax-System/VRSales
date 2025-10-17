from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api import dependencies
from app.core import security
from app.schemas.token_schema import Token

router = APIRouter()

# --- CORREÇÃO APLICADA AQUI ---
# A rota foi alterada de volta para "/token" para corresponder à chamada do frontend.
@router.post("/token", response_model=Token)
# -----------------------------
async def login_access_token(
    db: AsyncSession = Depends(dependencies.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatível com token de acesso para login.
    """
    user = await crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="E-mail ou senha incorretos")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # O conteúdo do token deve usar "sub" (subject) como padrão JWT
    token_data = {"sub": str(user.id)}
    
    return {
        "access_token": security.create_access_token(
            data=token_data, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }