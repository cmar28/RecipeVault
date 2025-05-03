#!/usr/bin/env python3
"""
Simplified test script for the AI service /crop endpoint.
This script sends a sample image to the endpoint and displays the results.

Usage:
    python test_sample.py
"""

import requests
import base64
import json
import io
import os
from PIL import Image
import matplotlib.pyplot as plt
import sys

# Configuration
AI_SERVICE_URL = 'http://localhost:5050/crop'

# Create directories if they don't exist
os.makedirs('test_images', exist_ok=True)
os.makedirs('test_results', exist_ok=True)

def image_to_base64(file_path):
    """Convert an image file to base64 string."""
    with open(file_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string

def base64_to_image(base64_string):
    """Convert a base64 string back to a PIL Image."""
    image_data = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(image_data))

def crop_image(base64_image):
    """Send the image to the /crop endpoint and return the result."""
    payload = {"image": base64_image}
    
    try:
        print("Sending request to AI service...")
        response = requests.post(AI_SERVICE_URL, json=payload)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response content length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            result = response.json()
            return result
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception occurred: {e}")
        return None

def save_image(image, filename):
    """Save a PIL Image to file."""
    output_path = os.path.join('test_results', filename)
    image.save(output_path)
    print(f"Image saved to {output_path}")
    return output_path

def create_test_image():
    """Create a simple test image with text for testing purposes."""
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a white background image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # Add some text
    try:
        font = ImageFont.truetype("Arial", 36)
    except IOError:
        font = ImageFont.load_default()
    
    # Draw a recipe title
    draw.text((width//2 - 150, 50), "Simple Test Recipe", fill='black', font=font)
    
    # Draw an ingredients section
    draw.text((50, 150), "Ingredients:", fill='black', font=font)
    ingredients = ["2 cups flour", "1 cup sugar", "3 eggs", "1/2 cup milk"]
    for i, ingredient in enumerate(ingredients):
        draw.text((70, 200 + i*40), f"- {ingredient}", fill='black', font=font)
    
    # Draw instructions section
    draw.text((50, 350), "Instructions:", fill='black', font=font)
    instructions = ["Mix dry ingredients", "Add wet ingredients", "Bake at 350°F for 25 minutes"]
    for i, instruction in enumerate(instructions):
        draw.text((70, 400 + i*40), f"{i+1}. {instruction}", fill='black', font=font)
    
    # Save the image
    test_image_path = os.path.join('test_images', 'test_recipe.jpg')
    image.save(test_image_path)
    print(f"Created test image at {test_image_path}")
    return test_image_path

def main():
    # Check if test_images directory has any images
    image_files = [f for f in os.listdir('test_images') if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if not image_files:
        print("No test images found. Creating a sample test image...")
        test_image_path = create_test_image()
    else:
        # Use the first image in the directory
        test_image_path = os.path.join('test_images', image_files[0])
    
    print(f"Testing with image: {test_image_path}")
    
    # Convert the image to base64
    base64_image = image_to_base64(test_image_path)
    print(f"Image converted to base64 (length: {len(base64_image)} characters)")
    
    # Send the image to the /crop endpoint
    result = crop_image(base64_image)
    
    if result and result.get('success'):
        # Extract information from the response
        cropped_base64 = result.get('cropped_image')
        cover_type = result.get('cover_type')
        message = result.get('message', 'No message provided')
        
        print(f"Cover type detected: {cover_type}")
        print(f"Message: {message}")
        
        # Convert the cropped image back from base64
        cropped_img = base64_to_image(cropped_base64)
        
        # Save the original and cropped images
        original_img = Image.open(test_image_path)
        original_save_path = save_image(original_img, "original_image.jpg")
        cropped_save_path = save_image(cropped_img, "cropped_image.jpg")
        
        print("\nTest completed successfully!")
        print(f"Original image: {original_save_path}")
        print(f"Cropped image: {cropped_save_path}")
        print("\nTo view these images, check the 'test_results' directory.")
        
        # Create HTML output for easy viewing
        html_output = f"""
        <html>
        <head>
            <title>AI Service Crop Test Results</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .images {{ display: flex; flex-wrap: wrap; gap: 20px; }}
                .image-container {{ border: 1px solid #ccc; padding: 10px; }}
                img {{ max-width: 400px; max-height: 400px; }}
                h2 {{ color: #333; }}
                .info {{ margin-top: 10px; color: #555; }}
            </style>
        </head>
        <body>
            <h1>AI Service Crop Test Results</h1>
            <div class="images">
                <div class="image-container">
                    <h2>Original Image</h2>
                    <img src="original_image.jpg" alt="Original Image">
                </div>
                <div class="image-container">
                    <h2>Cropped Image</h2>
                    <img src="cropped_image.jpg" alt="Cropped Image">
                    <div class="info">
                        <p><strong>Cover Type:</strong> {cover_type}</p>
                        <p><strong>Message:</strong> {message}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        with open(os.path.join('test_results', 'results.html'), 'w') as f:
            f.write(html_output)
        print("HTML results page created at test_results/results.html")
        
    else:
        print("Failed to crop the image or API call unsuccessful")

if __name__ == "__main__":
    main()