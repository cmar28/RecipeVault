"""
Routes package initialization for AI Service
"""

from . import verify, extract, crop

def register_routes(app):
    """Register all routes with the Flask app"""
    verify.register_route(app)
    extract.register_route(app)
    crop.register_route(app)