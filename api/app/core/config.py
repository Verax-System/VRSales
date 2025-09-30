import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

class Settings(BaseSettings):
    """
    Classe de configurações para carregar variáveis de ambiente.
    Utiliza Pydantic para validação e gerenciamento.
    """
    # A URL do banco de dados é lida da variável de ambiente DATABASE_URL.
    # Se não for encontrada, um erro será lançado graças à validação do Pydantic.
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    class Config:
        # Pydantic V2 usa case_sensitive=False por padrão.
        # Esta configuração é mantida para clareza.
        case_sensitive = True

# Instância única das configurações que será importada em outros módulos.
settings = Settings()
