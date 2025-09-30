from fastapi import FastAPI

from app.api.api import api_router

# Cria a instância principal da aplicação FastAPI
app = FastAPI(
    title="Sistema de Gestão de Vendas",
    description="API para o sistema de gestão de vendas.",
    version="1.0.0"
)

# Inclui o roteador principal da API, prefixado com /api/v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    """
    Endpoint raiz para verificar se a API está funcionando.
    """
    return {"message": "Bem-vindo à API de Gestão de Vendas!"}
