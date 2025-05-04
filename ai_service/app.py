"""
Main Flask application module for AI Service
"""

import logging
from flask import Flask
from routes import register_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    # Initialize Flask app
    app = Flask(__name__)
    
    # Register routes
    register_routes(app)
    
    return app

# Create the Flask app
app = create_app()

# If this file is run directly, start the Flask server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)