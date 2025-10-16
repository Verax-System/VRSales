from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.api.dependencies import get_db
from app.core import security
from app.crud import crud_user # Importa o crud_user do __init__
from app.schemas.token_schema import Token

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatível com o token de login, obtém o token de acesso e o tipo de token.
    """
    # Adiciona 'await' para chamar a função de autenticação assíncrona
    user = await crud_user.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    
    if not user:
        raise HTTPException(status_code=400, detail="Email ou palavra-passe incorretos")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Utilizador inativo")
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_data = {
        "sub": str(user.id),
        "role": user.role.value,
        "store_id": user.store_id,
        "name": user.full_name
    }
    access_token = security.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }