"""
Configuration module for AI service
"""

import os
import logging
from dotenv import load_dotenv
from openai import OpenAI
from together import Together

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Model provider configuration - can be 'openai' or 'together'
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Together client
together_client = Together(api_key=os.getenv("TOGETHER_API_KEY"))

# Model configurations
OPENAI_MODEL = "gpt-4o"  # Updated to the latest model
TOGETHER_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"

# Check if required API keys are set
if AI_PROVIDER == "openai" and not os.getenv("OPENAI_API_KEY"):
    logger.warning(
        "OPENAI_API_KEY environment variable is not set. The OpenAI services will not work properly."
    )
    
if AI_PROVIDER == "together" and not os.getenv("TOGETHER_API_KEY"):
    logger.warning(
        "TOGETHER_API_KEY environment variable is not set. The Together AI services will not work properly."
    )