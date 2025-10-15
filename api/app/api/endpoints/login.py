from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# --- INÍCIO DA CORREÇÃO ---
# Importações explícitas e diretas para cada módulo
from app.api.dependencies import get_db
from app.core import security
from app.crud.crud_user import user as crud_user
from app.schemas.token_schema import Token  # Importação direta do schema Token
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/login/access-token", response_model=Token) # Usa o Token importado diretamente
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatível com o token de login, obtém o token de acesso e o tipo de token.
    """
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Email ou palavra-passe incorretos")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Utilizador inativo")
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # --- ATUALIZAÇÃO ---
    # Inclui todos os dados necessários no payload do token para o frontend
    token_data = {
        "sub": str(user.id),
        "role": user.role.value,
        "store_id": user.store_id,
        "name": user.full_name # Adiciona o nome do utilizador para ser usado no frontend
    }
    access_token = security.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    # --- FIM DA ATUALIZAÇÃO ---
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }