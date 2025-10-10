from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import cash_register_transaction

# --- INÍCIO DA CORREÇÃO ---
# Importa a Base e todos os modelos para garantir que o SQLAlchemy
# os conheça quando a aplicação iniciar.
from app.db.base import Base
from app.models import payment  ,user, product, customer, supplier, sale, cash_register, ingredient, recipe, additional, batch, table, order
# --- FIM DA CORREÇÃO ---

from app.api.api import api_router

# Cria a instância principal da aplicação FastAPI
app = FastAPI(
    title="Sistema de Gestão de Vendas",
    description="API para o sistema de gestão de vendas.",
    version="1.0.0"
)

# Configuração do CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui o roteador principal da API, prefixado com /api/v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    """
    Endpoint raiz para verificar se a API está funcionando.
    """
    return {"message": "Bem-vindo à API de Gestão de Vendas!"}