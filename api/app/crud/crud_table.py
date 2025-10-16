from sqlalchemy.orm import Session
from typing import List

from app.crud.base import CRUDBase
from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate, TableLayoutUpdate

class CRUDTable(CRUDBase[Table, TableCreate, TableUpdate]):
    """
    Operações CRUD para Mesas, herdando a funcionalidade padrão da CRUDBase.
    """
    # A CRUDBase já nos dá:
    # - get(db, id, current_user)
    # - get_multi(db, skip, limit, current_user)
    # - create(db, obj_in, current_user)
    # - update(db, db_obj, obj_in, current_user)
    # - remove(db, id, current_user)
    
    # Podemos adicionar métodos específicos aqui se necessário, como o de atualizar o layout.
    def update_layout(self, db: Session, *, tables_layout: List[TableLayoutUpdate], current_user) -> List[Table]:
        updated_tables = []
        for table_update in tables_layout:
            db_table = self.get(db, id=table_update.id, current_user=current_user)
            if db_table:
                # O Pydantic model 'TableLayoutUpdate' pode ser passado diretamente para o update
                updated_table = self.update(db=db, db_obj=db_table, obj_in=table_update, current_user=current_user)
                updated_tables.append(updated_table)
        return updated_tables

# Instância única para ser usada na aplicação
table = CRUDTable(Table)