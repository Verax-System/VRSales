from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func
from datetime import datetime

class Base(DeclarativeBase):
    """
    Classe base declarativa da qual todos os modelos ORM herdarão.
    """
    pass

# Importamos os modelos aqui para que o Alembic possa "encontrá-los"
# quando estiver procurando por metadados para autogerar as migrations.
from app.models.product import Product
from app.models.user import User # <-- ADICIONE ESTA LINHA