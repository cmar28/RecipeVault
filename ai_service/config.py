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

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Check if OPENAI_API_KEY is set
if not os.getenv("OPENAI_API_KEY"):
    logger.warning(
        "OPENAI_API_KEY environment variable is not set. The AI service will not work properly."
    )