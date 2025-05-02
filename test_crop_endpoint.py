#!/usr/bin/env python3
"""
Test script for the AI service /crop endpoint.
This script sends an image to the endpoint and displays the results.

Usage:
    python test_crop_endpoint.py <path_to_image>

Example:
    python test_crop_endpoint.py test_images/recipe.jpg
"""

import requests
import base64
import json
import io
import os
import sys
from PIL import Image
import matplotlib.pyplot as plt

# Configuration
AI_SERVICE_URL = 'http://localhost:5050/crop'

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

def display_images(original_img, cropped_img, cover_type):
    """Display original and cropped images side by side."""
    plt.figure(figsize=(20, 10))
    
    plt.subplot(1, 2, 1)
    plt.imshow(original_img)
    plt.title("Original Image")
    plt.axis('off')
    
    plt.subplot(1, 2, 2)
    plt.imshow(cropped_img)
    plt.title(f"Cropped Image (Cover Type: {cover_type})")
    plt.axis('off')
    
    plt.tight_layout()
    plt.show()

def main():
    # Check if an image path was provided
    if len(sys.argv) < 2:
        print("Please provide the path to an image file.")
        print("Usage: python test_crop_endpoint.py <path_to_image>")
        return
    
    image_path = sys.argv[1]
    
    # Check if the file exists
    if not os.path.isfile(image_path):
        print(f"Error: File '{image_path}' not found.")
        return
    
    print(f"Testing with image: {image_path}")
    
    # Load the original image
    original_img = Image.open(image_path)
    
    # Convert the image to base64
    base64_image = image_to_base64(image_path)
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
        
        # Display the images
        display_images(original_img, cropped_img, cover_type)
        
        # Save the cropped image to file
        output_dir = "test_results"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        base_filename = os.path.basename(image_path)
        output_filename = f"{os.path.splitext(base_filename)[0]}_cropped.jpg"
        output_path = os.path.join(output_dir, output_filename)
        cropped_img.save(output_path)
        print(f"Cropped image saved to {output_path}")
    else:
        print("Failed to crop the image or API call unsuccessful")

if __name__ == "__main__":
    main()