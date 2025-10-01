from fastapi import APIRouter

from app.api.endpoints import attributes ,categories  ,batches, products, login, users, sales, cash_register, reports, additionals, customers, suppliers, ingredients, tables, orders

api_router = APIRouter()

# Inclui o roteador de produtos sob o prefixo /products
# e com a tag 'Products' na documentação
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(login.router, tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"]) # <-- ADICIONE
api_router.include_router(cash_register.router, prefix="/cash-register", tags=["Cash Register"]) # <-- ADICIONE
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"]) # <-- ADICIONE
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(ingredients.router, prefix="/ingredients", tags=["Ingredients"]) # <-- ADICIONE
api_router.include_router(tables.router, prefix="/tables", tags=["Tables"]) # <-- ADICIONE
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"]) # <-- ADICIONE
api_router.include_router(additionals.router, prefix="/additionals", tags=["Additionals"]) # <-- ADICIONE
api_router.include_router(batches.router, prefix="/batches", tags=["Batches"]) # <-- ADICIONE
api_router.include_router(categories.router, prefix="/categories", tags=["Categorias de Produtos"]) # <-- ADICIONE
api_router.include_router(attributes.router, prefix="/attributes", tags=["Atributos de Variação"]) # <-- ADICIONE
