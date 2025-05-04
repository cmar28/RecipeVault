"""
Extract route module for AI Service
"""

import json
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
    @app.route('/extract', methods=['POST'])
    def extract_recipe():
        """Extract recipe information from an image."""
        logger.info("Received request to extract recipe information")
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
            prompt = """
            Please extract the following information from this recipe image:
            1. Recipe title
            2. Brief description
            3. Cooking time in minutes
            4. Difficulty level (easy, medium, hard)
            5. Ingredients (as a list)
            6. Instructions (as numbered steps)
            7. Servings
            
            Format your response as a valid JSON object with the following keys:
            {
              "title": "string",
              "description": "string",
              "cookingTimeMinutes": number,
              "difficulty": "string", 
              "ingredients": ["string"],
              "instructions": ["string"],
              "servings": number
            }
            
            Only return the JSON object, no additional text.
            """

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
                max_tokens=800)

            # Extract the response
            ai_response = response.choices[0].message.content.strip()
            logger.info(f"OpenAI extraction response received")

            # Parse the JSON response
            try:
                # Find the JSON object in the response
                json_start = ai_response.find('{')
                json_end = ai_response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = ai_response[json_start:json_end]
                    recipe_data = json.loads(json_str)

                    # Validate required fields
                    required_fields = [
                        "title", "description", "cookingTimeMinutes", "difficulty",
                        "ingredients", "instructions", "servings"
                    ]
                    missing_fields = [
                        field for field in required_fields
                        if field not in recipe_data
                    ]

                    if missing_fields:
                        return jsonify({
                            "success":
                            False,
                            "error":
                            f"Missing required fields: {', '.join(missing_fields)}"
                        }), 400

                    return jsonify({"success": True, "recipe": recipe_data})
                else:
                    return jsonify({
                        "success":
                        False,
                        "error":
                        "Could not parse recipe data from image"
                    }), 400

            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}, Response: {ai_response}")
                return jsonify({
                    "success": False,
                    "error": "Could not parse recipe data from image"
                }), 400

        except Exception as e:
            logger.error(f"Error extracting recipe: {e}")
            return jsonify({"success": False, "error": str(e)}), 500