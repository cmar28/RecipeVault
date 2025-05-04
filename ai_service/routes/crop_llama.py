"""
Crop route module for AI Service using Together.ai LLaMA models
"""

import json
import logging
from flask import request, jsonify
import sys
import os
import base64
from io import BytesIO
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import is_valid_base64_image, base64_to_pil_image, pil_image_to_base64, crop_image
from config import together_client, TOGETHER_MODEL, AI_PROVIDER

# Configure logging
logger = logging.getLogger(__name__)

def register_route(app):
    @app.route('/crop', methods=['POST'])
    def crop_recipe_image():
        """Identify and crop the recipe image to focus on the dish or title using Together.ai LLaMA models."""
        logger.info("Received request to crop recipe image (Llama implementation)")
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

            # Prepare system message for Together.ai
            system_message = "You are a helpful assistant specialized in image analysis. You will be given a recipe image. Your task is to identify the main dish or recipe title in the image and provide coordinates to crop it. You should return a JSON object with the cover_type (either 'dish_photo' or 'title_crop') and the bounding box coordinates (x, y, width, height) that define the region to crop."
            
            # Prepare the user prompt with detailed instructions
            user_message = """
            Please analyze this recipe image and provide a JSON object with the following format:
            {
                "cover_type": "dish_photo", // Use "dish_photo" if you find a picture of the prepared dish, or "title_crop" if you find the title of the recipe
                "bbox": {
                    "x": 100, // The x-coordinate of the top-left corner of the bounding box
                    "y": 200, // The y-coordinate of the top-left corner of the bounding box
                    "width": 300, // The width of the bounding box
                    "height": 400 // The height of the bounding box
                }
            }
            
            Remember to provide only the JSON object with no additional text.
            """

            # Create a data URI for the image
            image_data_uri = f"data:image/jpeg;base64,{image_data}"

            # Call Together.ai API for bounding box detection
            try:
                logger.info("Calling Together.ai to detect bounding box")
                
                # Check if Together client is initialized
                if together_client is None:
                    logger.error("Together client is not initialized. Cannot process request.")
                    return jsonify({
                        "success": True,
                        "cover_type": "original",
                        "cropped_image": image_data,
                        "message": "Together.ai is not available. Please check API key. Returning original image."
                    })

                # Format the prompt with the image
                messages = [
                    {
                        "role": "system",
                        "content": system_message
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": user_message
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_data_uri
                                }
                            }
                        ]
                    }
                ]

                # Make API call
                response = together_client.chat.completions.create(
                    model=TOGETHER_MODEL,
                    messages=messages,
                    temperature=0.2,  # Lower temperature for more deterministic outputs
                    max_tokens=1000,
                    response_format={"type": "json_object"}  # Request JSON format
                )

                # Process the response to extract JSON
                try:
                    # Extract just the content as a string
                    response_text = response.choices[0].message.content.strip()
                    logger.info(f"Got response from Together.ai: {response_text[:100]}...")
                    
                    # Parse the JSON response
                    parsed_response = json.loads(response_text)
                    
                    # Extract the required information
                    if "cover_type" in parsed_response and "bbox" in parsed_response:
                        cover_type = parsed_response.get("cover_type", "title_crop")
                        bbox = parsed_response.get("bbox", {})
                        
                        # Validate bbox structure
                        if not all(key in bbox for key in ["x", "y", "width", "height"]):
                            logger.warning(f"Invalid bbox structure: {bbox}")
                            raise ValueError("Invalid bounding box structure")
                        
                        logger.info(f"Detected bounding box: {bbox}")
                        logger.info(f"Cover type: {cover_type}")
                        
                        # Crop the image using the bounding box
                        cropped_image = crop_image(pil_image, bbox)
                        
                        # Convert cropped image back to base64
                        cropped_base64 = pil_image_to_base64(cropped_image)
                        
                        if not cropped_base64:
                            return jsonify({
                                "success": False,
                                "error": "Failed to convert cropped image to base64"
                            }), 500
                        
                        # Return the cropped image
                        return jsonify({
                            "success": True,
                            "cover_type": cover_type,
                            "cropped_image": cropped_base64
                        })
                    else:
                        # If missing required fields, return original image
                        logger.warning(f"Missing required fields in response: {response_text}")
                        return jsonify({
                            "success": True,
                            "cover_type": "original",
                            "cropped_image": image_data,
                            "message": "Invalid response format, returning original image"
                        })
                        
                except json.JSONDecodeError as json_error:
                    logger.error(f"Error parsing Together.ai response: {json_error}")
                    return jsonify({
                        "success": True,
                        "cover_type": "original",
                        "cropped_image": image_data,
                        "message": "Failed to parse response, returning original image"
                    })
                    
            except Exception as e:
                logger.error(f"Error calling Together.ai: {str(e)}")
                # Fall back to returning the original image
                return jsonify({
                    "success": True,
                    "cover_type": "original",
                    "cropped_image": image_data,
                    "message": f"Error during image processing: {str(e)}, returning original image"
                })
                
        except Exception as e:
            logger.error(f"Error processing crop request: {e}")
            return jsonify({"success": False, "error": str(e)}), 500