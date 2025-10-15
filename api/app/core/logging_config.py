import logging
import sys
from loguru import logger

class InterceptHandler(logging.Handler):
    """
    Handler para interceptar logs do sistema de logging padrão do Python
    e redirecioná-los para o Loguru.
    """
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )

def setup_logging():
    """
    Configura o Loguru como o único logger para a aplicação.
    Remove handlers existentes, adiciona um novo handler configurado
    e intercepta os logs padrão.
    """
    # Remove qualquer handler pré-configurado para evitar duplicação de logs
    logger.remove()
    
    # Adiciona um novo handler para output no console com formato customizado
    # O formato inclui timestamp, nível, nome do arquivo, função e número da linha
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
               "<level>{message}</level>",
        level="INFO" # Define o nível mínimo de log a ser exibido
    )

    # Configura um handler para logs de arquivos, rotacionando o arquivo
    # quando ele atinge 10 MB e mantendo um backup de 10 arquivos.
    logger.add(
        "logs/file_{time}.log",
        rotation="10 MB",
        retention="10 days",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        encoding="utf-8"
    )

    # Intercepta todos os logs do sistema para que uvicorn, fastapi, etc.,
    # também usem o Loguru.
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    logger.info("Configuração de logging concluída e interceptadores ativados.")