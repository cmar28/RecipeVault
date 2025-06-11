# AI-Powered Recipe Management Application

A mobile-responsive recipe management application that leverages AI and modern web technologies to provide an intuitive, personalized culinary experience. The application offers advanced recipe processing capabilities, focusing on intelligent image recognition, user authentication, and seamless AI-powered recipe management.

## Features

- 📸 **AI Image Processing**: Extract recipes from photos using AI vision capabilities
- 📱 **Mobile-First Design**: Responsive interface optimized for mobile devices
- 👤 **User Authentication**: Secure login with Firebase authentication
- 📝 **Recipe Management**: Create, view, edit, and delete your favorite recipes
- ❤️ **Favorites System**: Save and organize your favorite recipes
- 🔍 **Search Functionality**: Quickly find recipes by name or ingredients
- 📤 **Import/Export**: Share and backup your recipe collection

## Architecture Overview

### Tech Stack

- **Frontend**: React + TypeScript with Vite
- **UI Components**: Shadcn UI components built on Radix UI primitives
- **Styling**: Tailwind CSS for responsive design
- **Backend**: Express.js (Node.js) API server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication
- **AI Processing**: Python Flask API with OpenAI Vision and Together.ai LLaMA models

### System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │─────▶│  Express Server │─────▶│  Flask AI API   │
│   (TypeScript)  │◀─────│   (Node.js)     │◀─────│   (Python)      │
│                 │      │                 │      │                 │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │                        │
                                  │                        │
                                  ▼                        ▼
                         ┌────────────────┐       ┌────────────────┐
                         │                │       │                │
                         │  PostgreSQL    │       │  OpenAI API /  │
                         │  Database      │       │  Together.ai   │
                         │                │       │                │
                         └────────────────┘       └────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   - User logs in via Firebase Authentication (Google Sign-In)
   - Firebase returns auth token to frontend
   - Token is sent with all API requests to Express backend
   - Backend verifies token with Firebase Admin SDK
   - User data is synced with PostgreSQL database

2. **Recipe Image Processing Flow**:
   - User uploads or captures a recipe image
   - Image is sent to Express backend
   - Backend forwards image to Flask AI service
   - AI service verifies if image contains a recipe
   - If verified, AI extracts recipe details and/or crops the image
   - Extracted data is returned to frontend and saved to database

3. **Recipe Management Flow**:
   - User creates/edits recipes through the frontend UI
   - Changes are sent to Express backend with auth token
   - Backend validates and persists changes to PostgreSQL
   - Updated data is returned to frontend

## Database Schema

The application uses a PostgreSQL database with the following schema:

### Users Table

| Column      | Type      | Description               |
|-------------|-----------|---------------------------|
| uid         | varchar   | Firebase UID (Primary Key)|
| displayName | varchar   | User's display name       |
| email       | varchar   | User's email address      |
| photoURL    | varchar   | User's profile image URL  |
| createdAt   | timestamp | Account creation time     |
| lastLogin   | timestamp | Last login time           |

### Recipes Table

| Column       | Type          | Description                |
|--------------|---------------|----------------------------|
| id           | serial        | Recipe ID (Primary Key)    |
| title        | text          | Recipe title               |
| description  | text          | Recipe description         |
| imageUrl     | text          | URL to recipe image        |
| imageData    | text          | Base64 encoded image data  |
| prepTime     | integer       | Preparation time (minutes) |
| cookTime     | integer       | Cooking time (minutes)     |
| servings     | integer       | Number of servings         |
| ingredients  | text[]        | List of ingredients        |
| instructions | text[]        | List of instructions       |
| createdBy    | varchar       | Reference to user UID      |

### User Favorites Table

| Column       | Type          | Description                 |
|--------------|---------------|-----------------------------|
| userId       | varchar       | Reference to user UID       |
| recipeId     | integer       | Reference to recipe ID      |
| Primary Key  | composite     | (userId, recipeId)          |

## AI Service

The AI service is a Flask application that offers three main endpoints:

1. **/verify** - Verifies if an image contains recipe content
2. **/extract** - Extracts recipe information from an image
3. **/crop** - Identifies and crops the recipe image to focus on the dish or title

The service supports multiple AI providers:
- **OpenAI** (default) - Uses OpenAI's GPT-4o model for image analysis
- **Together.ai** - Uses LLaMA models via Together.ai's API

## Setup and Development

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database
- Firebase project with Authentication enabled
- OpenAI API key or Together.ai API key

### Configuration

The application requires the following environment variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# Firebase (Frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# AI Services (Backend)
OPENAI_API_KEY=your_openai_api_key
# or
TOGETHER_API_KEY=your_together_api_key
```

### Running the Application

The application is configured to run with a single command:

```
npm run dev
```

This starts:
1. The Express backend API server
2. The Vite development server for the React frontend
3. The Flask AI service

### Database Management

To update the database schema:

1. Modify the schema definitions in `shared/schema.ts`
2. Run migrations with `npm run db:push`

## Security Considerations

- Firebase Authentication is used for secure user authentication
- API keys are stored as secure environment variables
- User authentication tokens are verified on all protected API endpoints 
- The original recipe images are not stored, only the extracted data

## Mobile Responsiveness

The application is designed with a mobile-first approach, ensuring optimal user experience on:
- Mobile phones
- Tablets
- Desktop browsers

Interface components and layouts automatically adjust based on the device screen size using Tailwind CSS responsive design classes.

## Deployment

Deployment instructions and automation scripts are located in the [`deployment`](deployment/) directory. The included `setup-cloud-run.sh` script and GitHub Actions workflow help deploy the project to Google Cloud Run.
