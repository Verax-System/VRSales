from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.dependencies import get_db, get_current_user
from app.schemas.user import User

# (Temporário) Vamos simular um banco de dados em memória para as campanhas
# O ideal seria criar o Model, Schema e CRUD completos.
fake_campaigns_db = []
campaign_id_counter = 1

router = APIRouter()

@router.get("/campaigns", response_model=List[dict])
async def get_marketing_campaigns(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Retorna a lista de campanhas de marketing. """
    return fake_campaigns_db

@router.post("/campaigns", response_model=dict, status_code=201)
async def create_marketing_campaign(campaign_data: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Cria uma nova campanha de marketing. """
    global campaign_id_counter
    new_campaign = campaign_data.copy()
    new_campaign["id"] = campaign_id_counter
    new_campaign["status"] = "draft" # Status inicial
    fake_campaigns_db.append(new_campaign)
    campaign_id_counter += 1
    return new_campaign

@router.put("/campaigns/{campaign_id}", response_model=dict)
async def update_marketing_campaign(campaign_id: int, campaign_data: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Atualiza uma campanha de marketing. """
    for i, campaign in enumerate(fake_campaigns_db):
        if campaign["id"] == campaign_id:
            updated_campaign = {**campaign, **campaign_data}
            fake_campaigns_db[i] = updated_campaign
            return updated_campaign
    raise HTTPException(status_code=404, detail="Campanha não encontrada")

@router.delete("/campaigns/{campaign_id}", status_code=204)
async def delete_marketing_campaign(campaign_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Deleta uma campanha de marketing. """
    global fake_campaigns_db
    initial_len = len(fake_campaigns_db)
    fake_campaigns_db = [c for c in fake_campaigns_db if c["id"] != campaign_id]
    if len(fake_campaigns_db) == initial_len:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return