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
    """Crop image based on normalized bounding box coordinates.
    
    Only supports ymin, xmin, ymax, xmax format: Normalized (0-1000) coordinates for top-left and bottom-right
    """
    try:
        # Check which format the bbox is using
        if all(k in bbox for k in ['ymin', 'xmin', 'ymax', 'xmax']):
            # Normalized coordinates (0-1000) format
            # Convert from 0-1000 scale to 0-1 scale
            xmin_rel = bbox.get('xmin', 0) / 1000.0
            ymin_rel = bbox.get('ymin', 0) / 1000.0
            xmax_rel = bbox.get('xmax', 1000) / 1000.0
            ymax_rel = bbox.get('ymax', 1000) / 1000.0
            
            # Convert to pixel values
            xmin = max(0, int(xmin_rel * image.width))
            ymin = max(0, int(ymin_rel * image.height))
            xmax = min(int(xmax_rel * image.width), image.width)
            ymax = min(int(ymax_rel * image.height), image.height)
            
            # Ensure valid crop dimensions
            if xmax <= xmin or ymax <= ymin:
                logger.warning(
                    f"Invalid crop coordinates: xmin={xmin}, ymin={ymin}, xmax={xmax}, ymax={ymax}. Using original image."
                )
                return image
                
            # Crop the image using (left, top, right, bottom) format
            cropped_image = image.crop((xmin, ymin, xmax, ymax))
            return cropped_image
        else:
            logger.warning(f"Unsupported bounding box format: {bbox}. Using original image.")
            return image

    except Exception as e:
        logger.error(f"Error cropping image: {e}")
        return image  # Return original image if cropping fails