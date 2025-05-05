"""
Crop route module for AI Service
"""

import json
import logging
from flask import request, jsonify
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import is_valid_base64_image, base64_to_pil_image, pil_image_to_base64, crop_image
from config import openai_client, OPENAI_CROP_MODEL

# Configure logging
logger = logging.getLogger(__name__)


def register_route(app):

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

                # Use the chat.completions.create API with function calling
                response = openai_client.chat.completions.create(
                    model=OPENAI_CROP_MODEL,
                    messages=[{
                        "role": "system",
                        "content": system_message
                    }, {
                        "role":
                        "user",
                        "content": [{
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }]
                    }],
                    tools=[{
                        "type": "function",
                        "function": {
                            "name": "crop_image",
                            "description":
                            "Crop an image based on the bounding box coordinates provided in the format [ymin, xmin, ymax, xmax]. Note the input coordinates must be normalized to a scale of 0 to 1000",
                            "parameters": {
                                "type": "object",
                                "required": ["cover_type", "bbox"],
                                "properties": {
                                    "cover_type": {
                                        "type": "string",
                                        "enum": ["dish_photo", "title_crop"],
                                        "description":
                                        "Type of cover image to select"
                                    },
                                    "bbox": {
                                        "type": "object",
                                        "required":
                                        ["ymin", "xmin", "ymax", "xmax"],
                                        "properties": {
                                            "ymin": {
                                                "type":
                                                "number",
                                                "description":
                                                "y min coordinate of the bounding box (value should be between 0 and 1000)"
                                            },
                                            "xmin": {
                                                "type":
                                                "number",
                                                "description":
                                                "x min coordinate of the bounding box (value should be between 0 and 1000)"
                                            },
                                            "ymax": {
                                                "type":
                                                "number",
                                                "description":
                                                "y max coordinate of the bounding box (value should be between 0 and 1000)"
                                            },
                                            "xmax": {
                                                "type":
                                                "number",
                                                "description":
                                                "x max coordinate of the bounding box (value should be between 0 and 1000)"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }],
                    tool_choice={"type": "function", "function": {"name": "crop_image"}},
                )

                # Check if we have a valid tool call response
                if (response.choices and response.choices[0].message and 
                    hasattr(response.choices[0].message, 'tool_calls') and 
                    response.choices[0].message.tool_calls):
                    
                    tool_call = response.choices[0].message.tool_calls[0]
                    if tool_call.function.name == "crop_image":
                        # Parse function arguments from JSON string
                        try:
                            # Parse the function arguments
                            tool_input = json.loads(tool_call.function.arguments)
                            cover_type = tool_input.get(
                                'cover_type', 'title_crop')
                            bbox = tool_input.get('bbox', {})

                            logger.info(f"Detected bounding box: {bbox}")
                            logger.info(f"Cover type: {cover_type}")

                            # Crop the image using the bounding box
                            cropped_image = crop_image(pil_image, bbox)

                            # Convert cropped image back to base64
                            cropped_base64 = pil_image_to_base64(cropped_image)

                            if not cropped_base64:
                                return jsonify({
                                    "success":
                                    False,
                                    "error":
                                    "Failed to convert cropped image to base64"
                                }), 500

                            return jsonify({
                                "success": True,
                                "cover_type": cover_type,
                                "cropped_image": cropped_base64
                            })
                        except Exception as json_error:
                            logger.error(
                                f"Error parsing function arguments: {json_error}"
                            )
                            # Fall back to returning the original image
                            return jsonify({
                                "success":
                                True,
                                "cover_type":
                                "original",
                                "cropped_image":
                                image_data,
                                "message":
                                "Failed to parse cropping instructions, returning original image"
                            })
                    else:
                        logger.warning(
                            f"Unexpected function call: {tool_call.function.name}")
                        # Fall back to returning the original image
                        return jsonify({
                            "success":
                            True,
                            "cover_type":
                            "original",
                            "cropped_image":
                            image_data,
                            "message":
                            "Failed to determine crop area, returning original image"
                        })
                else:
                    logger.warning("No tool calls in response")
                    # Log the actual response for debugging
                    logger.info(f"Response content: {response}")
                    # Fall back to returning the original image
                    return jsonify({
                        "success": True,
                        "cover_type": "original",
                        "cropped_image": image_data,
                        "message": "Failed to determine crop area, returning original image"
                    })

            except Exception as e:
                logger.error(f"Error calling OpenAI: {e}")
                # Fall back to returning the original image
                return jsonify({
                    "success":
                    True,
                    "cover_type":
                    "original",
                    "cropped_image":
                    image_data,
                    "message":
                    f"Error during image processing: {str(e)}, returning original image"
                })

        except Exception as e:
            logger.error(f"Error processing crop request: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
