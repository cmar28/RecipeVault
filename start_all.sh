#!/bin/bash

# Start the Python AI service in the background
cd ai_service
python run.py &
AI_PID=$!

# Go back to the root directory
cd ..

# Start the main app
npm run dev

# Cleanup: Kill the AI service when the main app exits
kill $AI_PID