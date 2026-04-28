import sys
from loguru import logger
import os

# Create logs directory in the project root (one level up from Backend)
# to avoid Uvicorn reload loops when logs are written.
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Configure logger
def setup_logger():
    # Remove default handler
    logger.remove()

    # Add stdout handler with nice formatting
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
        colorize=True
    )

    # Add file handler for persistent logs
    logger.add(
        os.path.join(LOGS_DIR, "app.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        rotation="10 MB",
        retention="1 week",
        compression="zip"
    )

    return logger

# Initialize logger
log = setup_logger()
