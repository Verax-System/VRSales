from sqlalchemy.orm import Session, selectinload
from typing import List

from app.crud.base import CRUDBase
from app.models.sale import Sale
from app.models.sale import SaleItem
from app.schemas.sale import SaleCreate, SaleUpdate

# Importa todos os serviços necessários
from app.services.crm_service import crm_service
from app.services.stock_service import stock_service
# --- INÍCIO DA ATUALIZAÇÃO ---
from app.services.cash_register_service import cash_register_service
# --- FIM DA ATUALIZAÇÃO ---

class CRUDSale(CRUDBase[Sale, SaleCreate, SaleUpdate]):
    def create(self, db: Session, *, obj_in: SaleCreate) -> Sale:
        """
        Cria uma nova venda e orquestra os serviços de pós-venda:
        - Registra o pagamento no caixa.
        - Atualiza as estatísticas do cliente (CRM).
        - Deduz os itens vendidos do estoque.
        """
        # --- INÍCIO DA ATUALIZAÇÃO ---
        # 1. Antes de tudo, verifica se há um caixa aberto.
        #    O próprio serviço levantará uma exceção se não houver.
        cash_register_service.get_open_register(db)
        # --- FIM DA ATUALIZAÇÃO ---

        sale_data = obj_in.dict()
        items_data = sale_data.pop("items")
        
        db_sale = Sale(**sale_data)
        db.add(db_sale)
        db.commit()
        db.refresh(db_sale)

        for item_data in items_data:
            db_item = SaleItem(**item_data, sale_id=db_sale.id)
            db.add(db_item)
            
        db.commit()
        db.refresh(db_sale)
        
        # --- ORDEM DE ORQUESTRAÇÃO ATUALIZADA ---
        # 1. Registra o pagamento no caixa
        cash_register_service.add_sale_transaction(db, sale=db_sale)
        
        # 2. Atualiza o CRM do cliente
        crm_service.update_customer_stats_from_sale(db, sale=db_sale)
        
        # 3. Deduz do estoque
        stock_service.deduct_stock_from_sale(db, sale=db_sale)
        # --- FIM DA ORDEM ---
        
        return db_sale

    def get_sales_by_customer(self, db: Session, *, customer_id: int) -> List[Sale]:
        # ... (código existente)
        return (
            db.query(self.model)
            .filter(Sale.customer_id == customer_id)
            .options(selectinload(Sale.items).selectinload(SaleItem.product))
            .order_by(Sale.created_at.desc())
            .all()
        )

sale = CRUDSale(Sale)