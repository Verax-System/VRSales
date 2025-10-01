from fastapi import APIRouter

from app.api.endpoints import products, login, users, sales 

api_router = APIRouter()

# Inclui o roteador de produtos sob o prefixo /products
# e com a tag 'Products' na documentação
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(login.router, tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"]) # <-- ADICIONE
