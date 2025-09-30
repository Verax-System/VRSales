from fastapi import APIRouter

from app.api.endpoints import products

api_router = APIRouter()

# Inclui o roteador de produtos sob o prefixo /products
# e com a tag 'Products' na documentação
api_router.include_router(products.router, prefix="/products", tags=["Products"])
