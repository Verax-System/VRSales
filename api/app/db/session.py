from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Usamos a variável DATABASE_URL do seu config.py
# e trocamos o driver para o assíncrono 'asyncpg'
ASYNC_SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql+psycopg2", "postgresql+asyncpg"
)

# Criamos o motor de conexão assíncrono
async_engine = create_async_engine(
    ASYNC_SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

# Criamos a fábrica de sessões assíncronas
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)