# AI Recipe Extraction Feature

This feature allows users to upload photos of recipes and have them automatically extracted and added to the recipe collection using OpenAI's Vision API.

## How it Works

1. When a user clicks on the camera icon in the bottom navigation bar, they can select either "Take Photo" or "Upload Photo"
2. The user selects or takes a photo of a recipe
3. The system verifies that the image contains a recipe using OpenAI Vision API
4. If verified, the system extracts recipe details (title, description, ingredients, instructions, etc.)
5. A new recipe is created and the user is redirected to the recipe detail page

## Setup and Usage

### Requirements

- An OpenAI API key with access to GPT-4 Vision API
- Python 3.11 installed with required packages (Flask, OpenAI)

### Running the Service

The AI service is now automatically started when the main application runs. You don't need to start it separately.

> **Note**: If needed, you can still manually start the AI service with `./start_ai_service.sh`, but this is no longer required.

### Error Handling

- If an image does not contain a recipe, the user will be notified
- If there's an issue with the AI service, the application will display an appropriate error message
- The original image is not stored, only the extracted recipe data

## Technical Implementation

- Client-side: React with TanStack Query for managing requests
- Server-side: Express.js API that forwards requests to the Python service
- AI Service: Python Flask API that communicates with OpenAI Vision API

## Security

- API keys are stored as secure environment variables
- User authentication is required to upload images
- The user's Firebase Auth token is validated before processing any images