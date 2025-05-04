"""
Configuration module for AI service
"""

import os
import logging
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Model provider configuration - can be 'openai' or 'together'
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Model configurations
OPENAI_MODEL = "gpt-4o"  # Updated to the latest model
TOGETHER_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"

# Initialize Together client only if we have an API key or if we're using Together as provider
together_client = None
if os.getenv("TOGETHER_API_KEY") or AI_PROVIDER == "together":
    try:
        from together import Together
        together_client = Together(api_key=os.getenv("TOGETHER_API_KEY", "dummy_key_for_import_only"))
        
        # Override AI_PROVIDER if TOGETHER_API_KEY is missing but was requested
        if AI_PROVIDER == "together" and not os.getenv("TOGETHER_API_KEY"):
            logger.warning(
                "TOGETHER_API_KEY environment variable is not set but 'together' provider was requested. "
                "Falling back to 'openai' provider."
            )
            AI_PROVIDER = "openai"
    except ImportError:
        logger.warning("Failed to import Together module. Together AI services will not be available.")
        if AI_PROVIDER == "together":
            logger.warning("Falling back to 'openai' provider due to import failure.")
            AI_PROVIDER = "openai"

# Check if required API keys are set
if AI_PROVIDER == "openai" and not os.getenv("OPENAI_API_KEY"):
    logger.warning(
        "OPENAI_API_KEY environment variable is not set. The OpenAI services will not work properly."
    )