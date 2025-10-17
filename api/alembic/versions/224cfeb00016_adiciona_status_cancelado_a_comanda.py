"""adiciona_status_cancelado_a_comanda

Revision ID: 224cfeb00016
Revises: e1146157d5cb
Create Date: 2025-10-17 18:12:33.005375

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '224cfeb00016'
down_revision: Union[str, Sequence[str], None] = 'e1146157d5cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # --- INÍCIO DA CORREÇÃO ---
    # Este comando SQL adiciona o novo valor 'CANCELLED' (em maiúsculas, como no log de erro)
    # ao tipo ENUM 'orderstatus' que já existe no PostgreSQL.
    # A cláusula "IF NOT EXISTS" previne erros caso a migração seja executada mais de uma vez.
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'CANCELLED'")
    # --- FIM DA CORREÇÃO ---


def downgrade() -> None:
    """Downgrade schema."""
    # A remoção de um valor de um ENUM em produção é uma operação complexa e arriscada.
    # Por segurança, não implementaremos a lógica de downgrade para esta alteração.
    pass