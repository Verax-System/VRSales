from pydantic import BaseModel, validator
from typing import Any

class BaseSchema(BaseModel):
    """
    Um schema Pydantic base que fornece configurações e funcionalidades comuns.

    Funcionalidades:
    - Remove espaços em branco extras de todos os campos de string.
    """

    @validator("*", pre=True)
    def trim_str_values(cls, v: Any):
        """
        Um validador que remove espaços em branco do início e do fim
        de qualquer valor de string antes da validação principal.
        """
        if isinstance(v, str):
            return v.strip()
        return v

    class Config:
        """
        Configurações do Pydantic:
        - orm_mode = True: Permite que o schema seja criado a partir de um modelo ORM.
        """
        orm_mode = True