"""
Routes package initialization for AI Service
"""

import sys
import os
import logging

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import AI_PROVIDER

# Set up logger
logger = logging.getLogger(__name__)

# Import common routes
from . import verify, extract

# Conditionally import the appropriate crop module based on AI_PROVIDER
if AI_PROVIDER == "together":
    try:
        logger.info("Using Together.ai implementation for crop route")
        from . import crop_llama as crop_module
    except ImportError:
        logger.warning("Failed to import crop_llama, falling back to default crop module")
        from . import crop as crop_module
else:
    logger.info("Using OpenAI implementation for crop route")
    from . import crop as crop_module

def register_routes(app):
    """Register all routes with the Flask app"""
    verify.register_route(app)
    extract.register_route(app)
    crop_module.register_route(app)