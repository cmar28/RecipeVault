#!/usr/bin/env python3
"""
This script starts a Jupyter notebook server that can be accessed through Replit's webview.
"""

import os
import sys
import subprocess
import webbrowser
import time

def start_jupyter():
    """Start a Jupyter notebook server"""
    print("Starting Jupyter notebook server...")
    
    # Construct the command
    cmd = [
        "jupyter", "notebook",
        "--ip=0.0.0.0",
        "--no-browser",
        "--NotebookApp.token=''",
        "--NotebookApp.password=''"
    ]
    
    # Print info about accessing the notebook
    print("\n" + "="*70)
    print("Jupyter Notebook will be available at:")
    print("https://{your-repl-url}/tools/jupyter")
    print("="*70 + "\n")
    
    # Start the Jupyter server
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nJupyter Notebook server has been shut down")
        sys.exit(0)

if __name__ == "__main__":
    start_jupyter()