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

# Model provider configuration - change this value manually to switch providers
# Options: "openai" or "together"
#AI_PROVIDER = "openai"
AI_PROVIDER = "together"

OPENAI_CROP_MODEL = "gpt-4.1"  # Using gpt-4.1 model
LLAMA_CROP_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Together client only if we're using Together provider
together_client = None
if AI_PROVIDER == "together":
    try:
        from together import Together
        together_client = Together(api_key=os.getenv("TOGETHER_API_KEY"))

        # Check if Together API key is set
        if not os.getenv("TOGETHER_API_KEY"):
            logger.warning(
                "TOGETHER_API_KEY environment variable is not set. The Together.ai services will not work properly."
            )
    except ImportError:
        logger.warning(
            "Failed to import Together module. Together AI services will not be available."
        )
        # Fall back to OpenAI if Together import fails
        AI_PROVIDER = "openai"

# Check if OpenAI API key is set when using OpenAI provider
if AI_PROVIDER == "openai" and not os.getenv("OPENAI_API_KEY"):
    logger.warning(
        "OPENAI_API_KEY environment variable is not set. The OpenAI services will not work properly."
    )
