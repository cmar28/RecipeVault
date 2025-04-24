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

The AI service needs to be running alongside the main application to process recipe images. To start the AI service:

1. Open a new terminal
2. Run the command: `./start_ai_service.sh`
3. Keep this terminal running while using the application

### Error Handling

- If an image does not contain a recipe, the user will be notified
- If the AI service is not running, the user will be informed to start it
- The original image is not stored, only the extracted recipe data

## Technical Implementation

- Client-side: React with TanStack Query for managing requests
- Server-side: Express.js API that forwards requests to the Python service
- AI Service: Python Flask API that communicates with OpenAI Vision API

## Security

- API keys are stored as secure environment variables
- User authentication is required to upload images
- The user's Firebase Auth token is validated before processing any images