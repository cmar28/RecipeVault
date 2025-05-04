#!/usr/bin/env python3
"""
Test script for the AI service /crop endpoint.
It processes all images in the 'test_images' directory and saves the cropped images to 'test_results'.
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


def main():
    # Check if test_images directory has any images
    image_files = [
        f for f in os.listdir('test_images')
        if f.lower().endswith(('.png', '.jpg', '.jpeg'))
    ]

    if not image_files:
        raise RuntimeError("No test images found in 'test_images' directory.")

    for i in range(len(image_files)):
        test_image_path = os.path.join('test_images', image_files[i])

        print(f"Testing with image: {test_image_path}")

        # Convert the image to base64
        base64_image = image_to_base64(test_image_path)
        print(
            f"Image converted to base64 (length: {len(base64_image)} characters)"
        )

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
            cropped_save_path = save_image(cropped_img, image_files[i])

            print("\nTest completed successfully!")
            print(f"Original image: {test_image_path}")
            print(f"Cropped image: {cropped_save_path}")
            print(
                "\nTo view these images, check the 'test_results' directory.")

        else:
            print("Failed to crop the image or API call unsuccessful")


if __name__ == "__main__":
    main()
