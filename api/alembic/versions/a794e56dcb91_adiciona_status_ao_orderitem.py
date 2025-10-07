"""adiciona_status_ao_orderitem

Revision ID: a794e56dcb91
Revises: a8d19ad88afb
Create Date: 2025-10-07 09:19:42.268178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a794e56dcb91'
down_revision: Union[str, Sequence[str], None] = 'a8d19ad88afb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### Início da Correção ###
    order_item_status_enum = sa.Enum('PENDING', 'PREPARING', 'READY', 'DELIVERED', name='orderitemstatus')
    order_item_status_enum.create(op.get_bind())
    # ### Fim da Correção ###

    op.add_column('order_items', sa.Column('status', sa.Enum('PENDING', 'PREPARING', 'READY', 'DELIVERED', name='orderitemstatus'), server_default='PENDING', nullable=False))


def downgrade() -> None:
    op.drop_column('order_items', 'status')

    # ### Início da Correção ###
    order_item_status_enum = sa.Enum('PENDING', 'PREPARING', 'READY', 'DELIVERED', name='orderitemstatus')
    order_item_status_enum.drop(op.get_bind())
    # ### Fim da Correção ###
