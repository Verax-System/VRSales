"""add shape capacity rotation to tables

Revision ID: ff54454b14a3
Revises: 33246bc4f854
Create Date: 2025-10-20 11:21:43.575890

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff54454b14a3'
# --- CORREÇÃO PRINCIPAL AQUI ---
# Apontando para o ID correto da sua migração inicial
down_revision: Union[str, Sequence[str], None] = '33246bc4f854'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Cria o novo tipo ENUM 'tableshape' no PostgreSQL.
    op.execute("CREATE TYPE tableshape AS ENUM ('rectangle', 'round')")
    
    # 2. Adiciona as novas colunas à tabela 'tables'.
    op.add_column('tables', sa.Column('capacity', sa.Integer(), server_default='4', nullable=False))
    op.add_column('tables', sa.Column('shape', sa.Enum('RECTANGLE', 'ROUND', name='tableshape', create_type=False), server_default='rectangle', nullable=False))
    op.add_column('tables', sa.Column('rotation', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Remove as colunas na ordem inversa.
    op.drop_column('tables', 'rotation')
    op.drop_column('tables', 'shape')
    op.drop_column('tables', 'capacity')
    
    # 2. Remove o tipo ENUM do banco de dados.
    op.execute("DROP TYPE tableshape")