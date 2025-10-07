"""adiciona_campo_role_em_users

Revision ID: a0d93bd8641d
Revises: 9b9134629841
Create Date: 2025-10-07 08:48:20.571588

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0d93bd8641d'
down_revision: Union[str, Sequence[str], None] = '9b9134629841'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    """Upgrade schema."""
    # ### Início da Correção ###
    user_role_enum = sa.Enum('ADMIN', 'MANAGER', 'CASHIER', name='userrole')
    user_role_enum.create(op.get_bind())
    # ### Fim da Correção ###

    op.add_column('users', sa.Column('role', sa.Enum('ADMIN', 'MANAGER', 'CASHIER', name='userrole'), nullable=False, server_default='CASHIER'))
    op.alter_column('users', 'role', server_default=None) # Remove o default após a inserção inicial para não travar futuras alterações


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'role')

    # ### Início da Correção ###
    user_role_enum = sa.Enum('ADMIN', 'MANAGER', 'CASHIER', name='userrole')
    user_role_enum.drop(op.get_bind())
    # ### Fim da Correção ###