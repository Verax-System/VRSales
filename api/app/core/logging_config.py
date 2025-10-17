import logging
from logging.handlers import TimedRotatingFileHandler
import os
from datetime import datetime

def setup_logging():
    # Caminho para o diretório de logs
    log_directory = "logs"
    if not os.path.exists(log_directory):
        os.makedirs(log_directory)

    # Configuração básica do logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Formato do log
    log_format = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # --- INÍCIO DA MUDANÇA ---
    # As linhas abaixo, que criavam e adicionavam o handler de arquivo, foram comentadas.
    # Assim, os logs não serão mais salvos em arquivos.

    # # Handler para salvar logs em arquivos com rotação diária
    # now = datetime.now()
    # log_filename = f"{log_directory}/file_{now.strftime('%Y-%m-%d_%H-%M-%S_%f')}.log"
    # file_handler = TimedRotatingFileHandler(log_filename, when="midnight", interval=1, backupCount=30)
    # file_handler.setFormatter(log_format)
    # logger.addHandler(file_handler)
    
    # --- FIM DA MUDANÇA ---

    # Handler para exibir logs no console (mantido)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    
    # Adiciona o handler do console ao logger se ainda não tiver um
    if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
        logger.addHandler(console_handler)