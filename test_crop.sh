#!/bin/bash
# This script runs the AI service and then tests the /crop endpoint with a sample image

# Create test directories if they don't exist
mkdir -p test_images
mkdir -p test_results

# Check if we have any test images
if [ -z "$(ls -A test_images 2>/dev/null)" ]; then
  echo "No test images found in the test_images directory."
  echo "Please add some test images to test_images/ before running this script."
  exit 1
fi

# Start the application if it's not already running
if ! pgrep -f "node.*index.ts" > /dev/null; then
  echo "Starting the application..."
  npm run dev &
  APP_PID=$!
  echo "Waiting for services to start..."
  sleep 5
else
  echo "Application already running."
fi

# Run the test script with the first image in the test_images directory
TEST_IMAGE=$(ls test_images | head -n 1)
if [ -n "$TEST_IMAGE" ]; then
  echo "Testing with image: $TEST_IMAGE"
  python test_crop_endpoint.py "test_images/$TEST_IMAGE"
else
  echo "No test image found."
  exit 1
fi

# Clean up if we started the app
if [ -n "$APP_PID" ]; then
  echo "Press Ctrl+C to stop the application when done."
  wait $APP_PID
fi