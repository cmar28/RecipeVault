# AI Service Documentation

## Overview
The AI Service is a Python Flask application that provides AI-powered image analysis and recipe extraction capabilities for the Recipe Management Application. It offers three main endpoints:

- `/verify` - Verifies if an image contains recipe content
- `/extract` - Extracts recipe information from an image
- `/crop` - Identifies and crops the recipe image to focus on the dish or title

## AI Providers
The service supports multiple AI providers:

1. **OpenAI** (default) - Uses OpenAI's GPT-4o model for image analysis
2. **Together.ai** - Uses LLaMA models via Together.ai's API

## Switching Between AI Providers

To switch between AI providers, simply edit the `ai_service/config.py` file and change the `AI_PROVIDER` variable:

```python
# Model provider configuration - change this value manually to switch providers
# Options: "openai" or "together"
AI_PROVIDER = "openai"  # Change to "together" to use Together.ai
```

## API Keys

The following API keys are required depending on which provider you're using:

- For OpenAI: Set the `OPENAI_API_KEY` environment variable
- For Together.ai: Set the `TOGETHER_API_KEY` environment variable

## Endpoints

### POST /verify
Verifies if an image contains recipe content.

**Request body**: 
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response**:
```json
{
  "success": true,
  "is_recipe": true,
  "message": "This image contains a recipe."
}
```

### POST /extract
Extracts recipe information from an image.

**Request body**: 
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response**:
```json
{
  "success": true,
  "recipe": {
    "title": "Recipe Title",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...],
    "metadata": { ... }
  }
}
```

### POST /crop
Identifies and crops the recipe image to focus on the dish or title.

**Request body**: 
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response**:
```json
{
  "success": true,
  "cover_type": "dish_photo",
  "message": "Successfully cropped image",
  "cropped_image": "base64_encoded_cropped_image_data"
}
```

## Testing

To test the service, you can use the following scripts:

- `test_sample.py` - Tests the crop endpoint with a sample image
- `test_crop_endpoint.py` - Tests the crop endpoint with a specified image
- `test_crop_image_set.py` - Tests the crop endpoint with all images in the test_images directory