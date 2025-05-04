"""
Routes package initialization for AI Service
"""

import sys
import os
import logging
from flask import request, jsonify

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import AI_PROVIDER

# Set up logger
logger = logging.getLogger(__name__)

# Import all routes modules
from . import verify, extract, crop, crop_llama

# Initialize providers dictionary to keep track of loaded modules
provider_modules = {
    "openai": crop,
    "together": crop_llama
}

def register_routes(app):
    """Register all routes with the Flask app"""
    verify.register_route(app)
    extract.register_route(app)
    
    # Register custom crop route that supports dynamic provider selection
    @app.route('/crop', methods=['POST'])
    def crop_route():
        """Dynamic crop route that selects provider based on header or config"""
        try:
            # Check if a provider is specified in the header
            provider = request.headers.get('X-AI-Provider', AI_PROVIDER).lower()
            
            # Validate provider
            if provider not in provider_modules:
                logger.warning(f"Unknown provider '{provider}' requested, using default '{AI_PROVIDER}'")
                provider = AI_PROVIDER
            
            logger.info(f"Using '{provider}' implementation for this crop request")
            
            # Call the appropriate implementation
            if provider == "together":
                try:
                    return crop_llama.crop_recipe_image()
                except Exception as e:
                    logger.error(f"Error using Together implementation: {str(e)}")
                    logger.info("Falling back to OpenAI implementation")
                    return crop.crop_recipe_image()
            else:
                return crop.crop_recipe_image()
        except Exception as e:
            logger.error(f"Error in dynamic crop route: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500