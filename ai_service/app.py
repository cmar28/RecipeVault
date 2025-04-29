from flask import Flask, request, jsonify
import base64
from dotenv import load_dotenv
import os
import json
from openai import OpenAI
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def is_valid_base64_image(image_data):
    """Validate if the string is a valid base64 image."""
    try:
        # Try to decode the base64 string
        base64.b64decode(image_data)
        return True
    except Exception as e:
        logger.error(f"Invalid base64 image: {e}")
        return False


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
        response = client.chat.completions.create(
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
        response = client.chat.completions.create(
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
        logger.info(f"OpenAI extraction response received:\n{ai_response}")

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)
