from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://postgres:Admin123@localhost/vrsales"# O 'echo=False' significa que não veremos os logs SQL gerados no console.
# Mude para True se precisar depurar as queries SQL.
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

# Cria uma fábrica de sessões assíncronas.
# expire_on_commit=False previne que os atributos dos objetos expirem após o commit.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)