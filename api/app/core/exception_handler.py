from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
import traceback

async def global_exception_handler(request: Request, exc: Exception):
    """
    Handler de exceção global para capturar erros não tratados (HTTP 500).
    Loga o traceback completo do erro e retorna uma resposta JSON padronizada.
    """
    # Loga o erro com detalhes e traceback completo para depuração
    logger.error(f"Erro inesperado na requisição: {request.method} {request.url}")
    logger.error(f"Exceção: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")

    # Retorna uma resposta amigável para o cliente, sem expor detalhes internos
    return JSONResponse(
        status_code=500,
        content={
            "detail": {
                "type": "internal_server_error",
                "msg": "Ocorreu um erro interno inesperado no servidor.",
                "loc": []
            }
        },
    )