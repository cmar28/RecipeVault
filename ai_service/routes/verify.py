"""
Verify route module for AI Service
"""

import logging
from flask import request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import is_valid_base64_image
from config import openai_client

# Configure logging
logger = logging.getLogger(__name__)

def register_route(app):
    @app.route('/verify', methods=['POST'])
    def verify_recipe_image():
        """Verify if an image contains a recipe."""
        logger.info("Received request to verify recipe image")
        try:
            # Get the base64 encoded image from the request
            data = request.json
            if not data or 'image' not in data:
                return jsonify({
                    "success": False,
                    "error": "No image provided"
                }), 400

            image_data = data['image']
            # Validate the image data
            if not is_valid_base64_image(image_data):
                return jsonify({
                    "success": False,
                    "error": "Invalid image format"
                }), 400

            # Prepare the prompt for OpenAI
            prompt = "Does this image contain a recipe? A recipe typically includes ingredients and instructions for preparing a dish. Answer with only 'yes' or 'no'."

            # Call OpenAI API
            response = openai_client.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[{
                    "role":
                    "user",
                    "content": [{
                        "type": "text",
                        "text": prompt
                    }, {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        }
                    }]
                }],
                max_tokens=10)

            # Extract the response
            ai_response = response.choices[0].message.content.strip().lower()
            logger.info(f"OpenAI verification response: {ai_response}")

            # Determine if the image contains a recipe
            is_recipe = 'yes' in ai_response

            return jsonify({
                "success":
                True,
                "is_recipe":
                is_recipe,
                "message":
                "Recipe detected" if is_recipe else "No recipe found in the image"
            })

        except Exception as e:
            logger.error(f"Error verifying recipe: {e}")
            return jsonify({"success": False, "error": str(e)}), 500