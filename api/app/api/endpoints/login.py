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

@router.post("/access-token", response_model=Token)
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
    
    # --- INÍCIO DA CORREÇÃO ---
    # Criamos um dicionário com a chave "sub" (subject), que é o padrão para JWT.
    # O valor deve ser uma string.
    token_data = {"sub": str(user.id)}
    # --- FIM DA CORREÇÃO ---
    
    return {
        "access_token": security.create_access_token(
            data=token_data, expires_delta=access_token_expires # Passamos o dicionário
        ),
        "token_type": "bearer",
    }