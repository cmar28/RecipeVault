"""
Common utility functions for AI Service
"""

import base64
import io
import logging
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        # Check if we're dealing with relative (0-1) or absolute coordinates
        if all(0 <= v <= 1 for v in [
                bbox.get('x', 0),
                bbox.get('y', 0),
                bbox.get('width', 1),
                bbox.get('height', 1)
        ]):
            # Relative coordinates (0-1)
            x = max(0, int(bbox.get('x', 0) * image.width))
            y = max(0, int(bbox.get('y', 0) * image.height))
            width = min(int(bbox.get('width', 1) * image.width),
                        image.width - x)
            height = min(int(bbox.get('height', 1) * image.height),
                         image.height - y)
        else:
            # Absolute coordinates (pixel values)
            x = max(0, int(bbox.get('x', 0)))
            y = max(0, int(bbox.get('y', 0)))
            width = min(int(bbox.get('width', image.width)), image.width - x)
            height = min(int(bbox.get('height', image.height)),
                         image.height - y)

        # Ensure valid crop dimensions
        if width <= 0 or height <= 0:
            logger.warning(
                f"Invalid crop dimensions: width={width}, height={height}. Using original image."
            )
            return image

        # Crop the image
        cropped_image = image.crop((x, y, x + width, y + height))
        return cropped_image
    except Exception as e:
        logger.error(f"Error cropping image: {e}")
        return image  # Return original image if cropping fails