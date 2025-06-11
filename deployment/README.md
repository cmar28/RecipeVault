# Deploying to Google Cloud Run with Neon PostgreSQL

This guide provides instructions for deploying the Recipe AI application to Google Cloud Run with a Neon serverless PostgreSQL database.

## Prerequisites

- [Google Cloud Account](https://cloud.google.com/) with billing enabled
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
- [Docker](https://docs.docker.com/get-docker/) installed locally
- [Neon PostgreSQL Account](https://neon.tech/) (free-tier available)
- Firebase project (if using Firebase Authentication)
- OpenAI API key or Together.ai API key for AI services

## Setting Up Neon PostgreSQL

1. Create a Neon account at https://neon.tech/
2. Create a new project in the Neon dashboard
3. After project creation, you'll receive a connection string. Save this for later.

## Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

```
# Server configuration
PORT=8080
NODE_ENV=production

# Database
DATABASE_URL=your_neon_connection_string

# AI Service
OPENAI_API_KEY=your_openai_api_key
TOGETHER_API_KEY=your_together_api_key (if using Together.ai models)

# Firebase (if using Firebase authentication)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

## Local Testing

To test the build locally:

```bash
# Build the Docker image
docker build -t recipe-ai-app -f deployment/Dockerfile .

# Run the container locally, mapping ports and injecting environment variables from your .env file
docker run -p 8080:8080 --env-file .env recipe-ai-app
```

Visit `http://localhost:8080` to verify the application is working correctly.

## Deploying to Google Cloud Run

1. Authenticate with Google Cloud:

```bash
gcloud auth login
```

2. Set your GCP project:

```bash
gcloud config set project your-project-id
```

3. Enable required services:

```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

4. Build and push your Docker image to Google Container Registry:

```bash
gcloud builds submit --tag gcr.io/your-project-id/recipe-ai-app
```

5. Deploy to Cloud Run:

```bash
gcloud run deploy recipe-ai-app \
  --image gcr.io/your-project-id/recipe-ai-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=your_neon_connection_string,OPENAI_API_KEY=your_openai_api_key,TOGETHER_API_KEY=your_together_api_key,FIREBASE_PROJECT_ID=your_firebase_project_id,FIREBASE_CLIENT_EMAIL=your_firebase_client_email,FIREBASE_PRIVATE_KEY=your_firebase_private_key"
```

Alternatively, you can store environment variables in Secret Manager and reference them during deployment.

## Database Migrations

Before deploying, make sure your database schema is up to date:

```bash
# Set the DATABASE_URL to your Neon connection string
export DATABASE_URL="your_neon_connection_string"

# Run database migrations
npm run db:push
```

## CI/CD Pipeline (Optional)

For automated deployments, you can set up a CI/CD pipeline using GitHub Actions or Google Cloud Build.

### GitHub Actions workflow

This repository includes a ready-to-use workflow at `.github/workflows/deploy.yml`.

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Google Auth
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}
    
    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
    
    - name: Build and Deploy
      run: |
        gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/recipe-ai-app
        gcloud run deploy recipe-ai-app \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/recipe-ai-app \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated \
          --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }},OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }},TOGETHER_API_KEY=${{ secrets.TOGETHER_API_KEY }},FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }},FIREBASE_CLIENT_EMAIL=${{ secrets.FIREBASE_CLIENT_EMAIL }},FIREBASE_PRIVATE_KEY=${{ secrets.FIREBASE_PRIVATE_KEY }}"
```

## Troubleshooting

- **Connection issues with Neon**: Make sure your Neon database is not in sleep mode and that your connection string is correct.
- **Memory issues**: Cloud Run instances have limited memory. Adjust the container memory allocation if needed.
- **Cold starts**: Configure minimum instances to reduce cold start latency.
- **Database migrations**: Always test migrations locally before deploying to production.

## Monitoring and Maintenance

- Set up Google Cloud Monitoring for application performance
- Configure alerting for critical metrics
- Schedule regular database backups through Neon's dashboard
- Review application logs in Google Cloud Console