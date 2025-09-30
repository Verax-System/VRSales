from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Cria um motor de banco de dados assíncrono.
# O 'echo=False' significa que não veremos os logs SQL gerados no console.
# Mude para True se precisar depurar as queries SQL.
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Cria uma fábrica de sessões assíncronas.
# expire_on_commit=False previne que os atributos dos objetos expirem após o commit.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
