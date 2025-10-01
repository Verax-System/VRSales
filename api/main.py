from fastapi import FastAPI
# --- INÍCIO DO NOVO CÓDIGO ---
from fastapi.middleware.cors import CORSMiddleware
# --- FIM DO NOVO CÓDIGO ---

from app.api.api import api_router

# Cria a instância principal da aplicação FastAPI
app = FastAPI(
    title="Sistema de Gestão de Vendas",
    description="API para o sistema de gestão de vendas.",
    version="1.0.0"
)

# --- INÍCIO DO NOVO CÓDIGO ---

# Configuração do CORS
# Lista de origens que têm permissão para fazer requisições
# Para desenvolvimento, você pode usar a porta padrão do Vite (5173) ou um wildcard.
origins = [
    "http://localhost:5173", # Endereço do seu app React/Vite
    "http://localhost:3000", # Endereço comum para Create React App
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Permite as origens listadas
    allow_credentials=True,      # Permite cookies (importante para autenticação)
    allow_methods=["*"],         # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],         # Permite todos os cabeçalhos
)

# --- FIM DO NOVO CÓDIGO ---


# Inclui o roteador principal da API, prefixado com /api/v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    """
    Endpoint raiz para verificar se a API está funcionando.
    """
    return {"message": "Bem-vindo à API de Gestão de Vendas!"}