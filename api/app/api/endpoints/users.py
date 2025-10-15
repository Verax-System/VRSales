from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# --- INÍCIO DA CORREÇÃO ---
# Importações explícitas e diretas para cada módulo
from app import crud
from app.models.user import User as UserModel
from app.schemas.user import User as UserSchema, UserCreate
from app.api.dependencies import get_db, RoleChecker
from app.schemas.enums import UserRole
# --- FIM DA CORREÇÃO ---


router = APIRouter()

# Define as permissões necessárias. Apenas administradores podem gerir utilizadores.
admin_permissions = RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])


@router.post(
    "/", 
    response_model=UserSchema, # Usa o UserSchema importado
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_permissions)]
)
def create_user(
    *, 
    db: Session = Depends(get_db), 
    user_in: UserCreate # Usa o UserCreate importado
):
    """
    Cria um novo utilizador no sistema.
    Acessível apenas para utilizadores com a role 'admin' ou 'super_admin'.
    """
    user = crud.crud_user.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um utilizador com este email no sistema.",
        )
    
    # A lógica de atribuir o store_id já está na CRUDBase, mas aqui a criação é específica.
    # Precisamos de garantir que o crud_user.create lida com isso.
    # Por agora, vamos assumir que o admin só pode criar utilizadores na sua própria loja.
    # (A lógica para Super Admin criar noutras lojas já está no frontend/UserForm)
    
    user = crud.crud_user.user.create(db, obj_in=user_in)
    return user

@router.get(
    "/", 
    response_model=List[UserSchema], # Usa o UserSchema importado
    dependencies=[Depends(admin_permissions)]
)
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retorna uma lista de utilizadores.
    - Admins de loja veem apenas os utilizadores da sua loja.
    - Super Admins veem todos os utilizadores.
    (Esta lógica precisa ser implementada no CRUD)
    """
    # Idealmente, o crud.user.get_multi seria adaptado para lidar com o current_user.
    # Por agora, isto irá funcionar para admins de loja por causa da CRUDBase, mas não para super admins.
    users = crud.crud_user.user.get_multi(db, skip=skip, limit=limit)
    return users

# Adicione aqui os endpoints de GET (por id), UPDATE e DELETE se necessário no futuro