from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud
from app.models.user import User as UserModel
from app.schemas.user import User as UserSchema, UserCreate
from app.api.dependencies import get_db, RoleChecker, get_current_active_user
from app.schemas.enums import UserRole


router = APIRouter()

# Define as permissões necessárias para as rotas que precisam de proteção
admin_permissions = RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])


@router.post(
    "/", 
    response_model=UserSchema, 
    status_code=status.HTTP_201_CREATED,
    # --- CORREÇÃO PRINCIPAL ---
    # A dependência de permissão foi REMOVIDA desta rota.
    # Isto torna a criação do primeiro utilizador pública.
    # Para produção, considere proteger esta rota após a configuração inicial.
    # dependencies=[Depends(admin_permissions)] # <--- LINHA REMOVIDA/COMENTADA
)
def create_user(
    *, 
    db: Session = Depends(get_db), 
    user_in: UserCreate
):
    """
    Cria um novo utilizador no sistema.
    Esta rota está temporariamente pública para permitir a criação do primeiro super admin.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um utilizador com este email no sistema.",
        )
    
    # Para criar o primeiro utilizador como Super Admin, certifique-se
    # de que o frontend envia 'role': 'super_admin' no payload.
    new_user = crud.user.create(db, obj_in=user_in)
    return new_user

@router.get(
    "/", 
    response_model=List[UserSchema], 
    # A rota para listar utilizadores CONTINUA protegida
    dependencies=[Depends(admin_permissions)]
)
def read_users(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Retorna uma lista de utilizadores. Protegido por permissão de admin.
    """
    users = crud.user.get_multi(db, skip=skip, limit=limit, current_user=current_user)
    return users

# Adicione aqui os outros endpoints (GET por id, UPDATE, DELETE), todos eles DEVEM
# continuar com a dependência 'dependencies=[Depends(admin_permissions)]'