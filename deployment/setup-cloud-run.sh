#!/bin/bash

# Cloud Run setup and deployment script
# This script helps set up and deploy the application to Google Cloud Run

# Exit on error
set -euo pipefail

# Check if the Google Cloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "Google Cloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install it first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Request Google Cloud project ID
if [ -z "${PROJECT_ID:-}" ]; then
    read -p "Enter your Google Cloud project ID: " PROJECT_ID
fi

# Set the Google Cloud project
echo "Setting Google Cloud project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required services
echo "Enabling required Google Cloud services..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com secretmanager.googleapis.com

# Request deployment region
REGION=${REGION:-us-central1}
if [ -z "${CI:-}" ]; then
    read -p "Enter the region to deploy to (default: $REGION): " REGION_INPUT
    REGION=${REGION_INPUT:-$REGION}
fi

# Request service name
SERVICE_NAME=${SERVICE_NAME:-recipe-ai-app}
if [ -z "${CI:-}" ]; then
    read -p "Enter a name for your Cloud Run service (default: $SERVICE_NAME): " SERVICE_NAME_INPUT
    SERVICE_NAME=${SERVICE_NAME_INPUT:-$SERVICE_NAME}
fi

# Ask for environment variables or use a .env file
if [ -z "${ENV_CHOICE:-}" ]; then
    echo "Would you like to:"
    echo "1) Enter environment variables manually"
    echo "2) Use a .env file"
    read -p "Choice (1/2): " ENV_CHOICE
fi

case $ENV_CHOICE in
    1)
        if [ -z "${DATABASE_URL:-}" ]; then
            echo "Please enter your environment variables:"
            read -p "DATABASE_URL: " DATABASE_URL
            read -p "OPENAI_API_KEY: " OPENAI_API_KEY
            read -p "TOGETHER_API_KEY (optional): " TOGETHER_API_KEY
            read -p "FIREBASE_PROJECT_ID (optional): " FIREBASE_PROJECT_ID
            read -p "FIREBASE_CLIENT_EMAIL (optional): " FIREBASE_CLIENT_EMAIL
            read -p "FIREBASE_PRIVATE_KEY (optional): " FIREBASE_PRIVATE_KEY
        fi
        ;;
    2)
        ENV_FILE=${ENV_FILE:-../.env}
        if [ -z "${CI:-}" ]; then
            read -p "Enter the path to your .env file (default: $ENV_FILE): " ENV_FILE_INPUT
            ENV_FILE=${ENV_FILE_INPUT:-$ENV_FILE}
        fi
        if [ ! -f "$ENV_FILE" ]; then
            echo "Error: .env file not found at $ENV_FILE"
            exit 1
        fi
        # Source the .env file
        set -a # automatically export all variables
        source "$ENV_FILE"
        set +a
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Ask if user wants to use Secret Manager for environment variables
if [ -z "${USE_SECRET_MANAGER:-}" ]; then
    read -p "Would you like to store environment variables in Secret Manager? (y/n): " USE_SECRET_MANAGER
fi

if [ "$USE_SECRET_MANAGER" = "y" ]; then
    # Create secrets in Secret Manager
    echo "Creating secrets in Secret Manager..."
    
    echo -n "$DATABASE_URL" | gcloud secrets create recipe-app-database-url --data-file=-
    
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo -n "$OPENAI_API_KEY" | gcloud secrets create recipe-app-openai-api-key --data-file=-
    fi
    
    if [ ! -z "$TOGETHER_API_KEY" ]; then
        echo -n "$TOGETHER_API_KEY" | gcloud secrets create recipe-app-together-api-key --data-file=-
    fi
    
    if [ ! -z "$FIREBASE_PROJECT_ID" ]; then
        echo -n "$FIREBASE_PROJECT_ID" | gcloud secrets create recipe-app-firebase-project-id --data-file=-
    fi
    
    if [ ! -z "$FIREBASE_CLIENT_EMAIL" ]; then
        echo -n "$FIREBASE_CLIENT_EMAIL" | gcloud secrets create recipe-app-firebase-client-email --data-file=-
    fi
    
    if [ ! -z "$FIREBASE_PRIVATE_KEY" ]; then
        echo -n "$FIREBASE_PRIVATE_KEY" | gcloud secrets create recipe-app-firebase-private-key --data-file=-
    fi
    
    # Build and deploy with secret references
    echo "Building and deploying to Cloud Run with Secret Manager references..."
    
    SECRET_ENV_VARS="--set-secrets DATABASE_URL=recipe-app-database-url:latest"
    
    if [ ! -z "$OPENAI_API_KEY" ]; then
        SECRET_ENV_VARS="$SECRET_ENV_VARS,OPENAI_API_KEY=recipe-app-openai-api-key:latest"
    fi
    
    if [ ! -z "$TOGETHER_API_KEY" ]; then
        SECRET_ENV_VARS="$SECRET_ENV_VARS,TOGETHER_API_KEY=recipe-app-together-api-key:latest"
    fi
    
    if [ ! -z "$FIREBASE_PROJECT_ID" ]; then
        SECRET_ENV_VARS="$SECRET_ENV_VARS,FIREBASE_PROJECT_ID=recipe-app-firebase-project-id:latest"
    fi
    
    if [ ! -z "$FIREBASE_CLIENT_EMAIL" ]; then
        SECRET_ENV_VARS="$SECRET_ENV_VARS,FIREBASE_CLIENT_EMAIL=recipe-app-firebase-client-email:latest"
    fi
    
    if [ ! -z "$FIREBASE_PRIVATE_KEY" ]; then
        SECRET_ENV_VARS="$SECRET_ENV_VARS,FIREBASE_PRIVATE_KEY=recipe-app-firebase-private-key:latest"
    fi
    
    # Build and push Docker image
    echo "Building and pushing Docker image to Google Container Registry..."
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME ..
    
    # Deploy to Cloud Run with secret references
    echo "Deploying to Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        $SECRET_ENV_VARS
else
    # Build and push Docker image
    echo "Building and pushing Docker image to Google Container Registry..."
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME ..
    
    # Construct environment variables string
    ENV_VARS="PORT=8080,NODE_ENV=production,DATABASE_URL=$DATABASE_URL"
    
    if [ ! -z "$OPENAI_API_KEY" ]; then
        ENV_VARS="$ENV_VARS,OPENAI_API_KEY=$OPENAI_API_KEY"
    fi
    
    if [ ! -z "$TOGETHER_API_KEY" ]; then
        ENV_VARS="$ENV_VARS,TOGETHER_API_KEY=$TOGETHER_API_KEY"
    fi
    
    if [ ! -z "$FIREBASE_PROJECT_ID" ]; then
        ENV_VARS="$ENV_VARS,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
    fi
    
    if [ ! -z "$FIREBASE_CLIENT_EMAIL" ]; then
        ENV_VARS="$ENV_VARS,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL"
    fi
    
    if [ ! -z "$FIREBASE_PRIVATE_KEY" ]; then
        ENV_VARS="$ENV_VARS,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY"
    fi
    
    # Deploy to Cloud Run
    echo "Deploying to Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars "$ENV_VARS"
fi

# Output the service URL
echo "Deployment complete! Your app is being deployed to:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'

