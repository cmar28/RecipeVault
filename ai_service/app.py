from flask import Flask, request, jsonify
import base64
from dotenv import load_dotenv
import os
import json
import io
from PIL import Image
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

# Check if OPENAI_API_KEY is set
if not os.getenv("OPENAI_API_KEY"):
    logger.warning("OPENAI_API_KEY environment variable is not set. The AI service will not work properly.")


def is_valid_base64_image(image_data):
    """Validate if the string is a valid base64 image."""
    try:
        # Try to decode the base64 string
        base64.b64decode(image_data)
        return True
    except Exception as e:
        logger.error(f"Invalid base64 image: {e}")
        return False


def base64_to_pil_image(base64_image):
    """Convert base64 encoded image to PIL Image object."""
    try:
        image_data = base64.b64decode(base64_image)
        return Image.open(io.BytesIO(image_data))
    except Exception as e:
        logger.error(f"Error converting base64 to PIL image: {e}")
        return None


def pil_image_to_base64(image, format="JPEG"):
    """Convert PIL Image object to base64 encoded string."""
    try:
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        logger.error(f"Error converting PIL image to base64: {e}")
        return None


def crop_image(image, bbox):
    """Crop image based on bounding box coordinates."""
    try:
        # Extract coordinates from bounding box
        x = max(0, int(bbox.get('x', 0) * image.width))
        y = max(0, int(bbox.get('y', 0) * image.height))
        width = min(int(bbox.get('width', 1) * image.width), image.width - x)
        height = min(int(bbox.get('height', 1) * image.height), image.height - y)
        
        # Crop the image
        cropped_image = image.crop((x, y, x + width, y + height))
        return cropped_image
    except Exception as e:
        logger.error(f"Error cropping image: {e}")
        return image  # Return original image if cropping fails


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


@app.route('/crop', methods=['POST'])
def crop_recipe_image():
    """Identify and crop the recipe image to focus on the dish or title."""
    logger.info("Received request to crop recipe image")
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

        # Convert base64 to PIL Image
        pil_image = base64_to_pil_image(image_data)
        if not pil_image:
            return jsonify({
                "success": False,
                "error": "Failed to process image"
            }), 400

        # Prepare system message for OpenAI
        system_message = "You are responsible for extracting the cover image of the recipe included in the image attached. If a section of the image contains an image of the finished dish crop the image to identify the picture of the dish. Otherwise crop the image to extract the title of the recipe. Return the cropped image."

        # Call OpenAI API for bounding box detection
        try:
            logger.info("Calling OpenAI to detect bounding box")
            
            # Since the responses.create API might not be available in this version,
            # we'll use the chat.completions.create API with function calling instead
            response = client.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[
                    {
                        "role": "system",
                        "content": system_message
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": "crop_image",
                            "description": "Crop an image based on the bounding box provided as an input",
                            "parameters": {
                                "type": "object",
                                "required": [
                                    "cover_type",
                                    "bbox"
                                ],
                                "properties": {
                                    "cover_type": {
                                        "type": "string",
                                        "enum": [
                                            "dish_photo",
                                            "title_crop"
                                        ],
                                        "description": "Type of cover image to select"
                                    },
                                    "bbox": {
                                        "type": "object",
                                        "required": [
                                            "x",
                                            "y",
                                            "width",
                                            "height"
                                        ],
                                        "properties": {
                                            "x": {
                                                "type": "number",
                                                "description": "X coordinate of the bounding box"
                                            },
                                            "y": {
                                                "type": "number",
                                                "description": "Y coordinate of the bounding box"
                                            },
                                            "width": {
                                                "type": "number",
                                                "description": "Width of the bounding box"
                                            },
                                            "height": {
                                                "type": "number",
                                                "description": "Height of the bounding box"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ],
                tool_choice={"type": "function", "function": {"name": "crop_image"}},
                temperature=1,
                max_tokens=2048
            )

            # Check if we have a valid tool call response
            if hasattr(response, 'choices') and response.choices and response.choices[0].message.tool_calls:
                tool_call = response.choices[0].message.tool_calls[0]
                if tool_call.function.name == "crop_image":
                    # Parse function arguments from JSON string
                    try:
                        import json
                        tool_input = json.loads(tool_call.function.arguments)
                        cover_type = tool_input.get('cover_type', 'title_crop')
                        bbox = tool_input.get('bbox', {})
                        
                        logger.info(f"Detected bounding box: {bbox}")
                        logger.info(f"Cover type: {cover_type}")
                    except Exception as json_error:
                        logger.error(f"Error parsing tool call arguments: {json_error}")
                        return jsonify({
                            "success": False,
                            "error": "Failed to parse image cropping instructions"
                        }), 500
                    
                    # Crop the image using the bounding box
                    cropped_image = crop_image(pil_image, bbox)
                    
                    # Convert cropped image back to base64
                    cropped_base64 = pil_image_to_base64(cropped_image)
                    
                    if not cropped_base64:
                        return jsonify({
                            "success": False,
                            "error": "Failed to convert cropped image to base64"
                        }), 500
                    
                    return jsonify({
                        "success": True,
                        "cover_type": cover_type,
                        "cropped_image": cropped_base64
                    })
                else:
                    logger.error("Invalid tool call response")
            else:
                logger.error("No valid tool call in response")
                
            # If we get here, something went wrong with the OpenAI response
            return jsonify({
                "success": False,
                "error": "Failed to detect recipe image area"
            }), 500
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            # Fall back to returning the original image
            return jsonify({
                "success": True,
                "cover_type": "original",
                "cropped_image": image_data,
                "message": "Failed to crop image, returning original"
            })

    except Exception as e:
        logger.error(f"Error cropping recipe image: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)
