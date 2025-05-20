FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy Python requirements and install Python dependencies
COPY ai_service/requirements.txt ./ai_service/
RUN pip3 install --no-cache-dir -r ai_service/requirements.txt

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Port used by the application
ENV PORT=8080

# Command to start the application
CMD ["npm", "run", "start"]