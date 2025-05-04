"""
Test script for the AI service /crop endpoint using Together.ai implementation.
This script adds a special header to tell the AI service to use the Together.ai implementation.
"""

import os
import sys
import base64
import json
import requests
from PIL import Image
from io import BytesIO
import matplotlib.pyplot as plt
import html

def image_to_base64(file_path):
    """Convert an image file to base64 string."""
    with open(file_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def base64_to_image(base64_string):
    """Convert a base64 string back to a PIL Image."""
    image_data = base64.b64decode(base64_string)
    return Image.open(BytesIO(image_data))

def crop_image(base64_image):
    """Send the image to the /crop endpoint and return the result."""
    url = "http://localhost:5050/crop"
    headers = {
        "Content-Type": "application/json",
        "X-AI-Provider": "together"  # Special header to request Together.ai implementation
    }
    data = {
        "image": base64_image
    }
    
    response = requests.post(url, headers=headers, json=data)
    print(f"Response status code: {response.status_code}")
    print(f"Response content length: {len(response.content)} bytes")
    
    if response.status_code == 200:
        result = response.json()
        cover_type = result.get("cover_type", "unknown")
        message = result.get("message", "No message provided")
        print(f"Cover type detected: {cover_type}")
        print(f"Message: {message}")
        
        if result.get("success", False):
            return result.get("cropped_image"), cover_type, message
    
    return None, None, None

def save_image(image, filename):
    """Save a PIL Image to file."""
    image.save(filename)
    print(f"Image saved to {filename}")

def display_images(original_img, cropped_img, cover_type, message, provider="Together.ai"):
    """Create an HTML file to display original and cropped images side by side."""
    # Save the images
    original_img.save("test_results/together_original.jpg")
    if cropped_img:
        cropped_img.save("test_results/together_cropped.jpg")
    
    # Create an HTML file with the results
    html_content = f"""
        <html>
        <head>
            <title>AI Service Crop Test Results ({provider})</title>
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
            <h1>AI Service Crop Test Results ({provider})</h1>
            <div class="images">
                <div class="image-container">
                    <h2>Original Image</h2>
                    <img src="together_original.jpg" alt="Original Image">
                </div>
                <div class="image-container">
                    <h2>Cropped Image</h2>
                    <img src="together_cropped.jpg" alt="Cropped Image">
                    <div class="info">
                        <p><strong>Cover Type:</strong> {cover_type}</p>
                        <p><strong>Message:</strong> {html.escape(message or "No message provided")}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    
    with open("test_results/together_results.html", "w") as f:
        f.write(html_content)
    
    print("HTML results page created at test_results/together_results.html")

def main():
    # Check if an image path is provided as a command-line argument
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        # Use a default image from the test_images directory
        image_files = [f for f in os.listdir("test_images") if f.endswith((".jpg", ".jpeg", ".png"))]
        if image_files:
            image_path = os.path.join("test_images", image_files[0])
        else:
            print("No test images found. Please provide an image path.")
            return
    
    print(f"Testing with image: {image_path}")
    
    # Convert image to base64
    base64_image = image_to_base64(image_path)
    print(f"Image converted to base64 (length: {len(base64_image)} characters)")
    
    # Send the image to the /crop endpoint
    print("Sending request to AI service...")
    cropped_base64, cover_type, message = crop_image(base64_image)
    
    if cropped_base64:
        # Convert the base64 strings back to PIL Images
        original_img = Image.open(image_path)
        cropped_img = base64_to_image(cropped_base64)
        
        # Display the images
        display_images(original_img, cropped_img, cover_type, message)
        
        print("\nTest completed successfully!")
        print(f"Original image: {image_path}")
        print(f"Cropped image: test_results/together_cropped.jpg")
        print("\nTo view these images, check the 'test_results' directory.")
    else:
        print("Failed to crop the image.")

if __name__ == "__main__":
    main()