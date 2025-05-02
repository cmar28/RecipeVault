# AI Service Test Tools

This folder contains tools to test the AI service's `/crop` endpoint in isolation.

## Prerequisites

Ensure you have the following installed:
- Python 3.x
- Required Python packages: `requests`, `pillow`, `matplotlib`
- The AI service must be running (part of the main application)

## Testing Methods

### 1. Using the Jupyter Notebook

The `test_crop_endpoint.ipynb` notebook provides an interactive way to test the endpoint:

1. Add your test images to the `test_images/` directory
2. Open the notebook with Jupyter
3. Run the cells sequentially
4. View the results and visualizations in the notebook

### 2. Using the Python Script

The `test_crop_endpoint.py` script allows command-line testing:

```bash
# Make sure the app is running first
npm run dev

# In another terminal:
python test_crop_endpoint.py test_images/your_image.jpg
```

This will:
1. Send the image to the `/crop` endpoint
2. Display the original and cropped images
3. Save the cropped image to the `test_results/` directory

### 3. Using the Shell Script

For convenience, a shell script is provided:

```bash
# Make the script executable
chmod +x test_crop.sh

# Run the script
./test_crop.sh
```

This script:
1. Checks for test images in the `test_images/` directory
2. Starts the application if it's not already running
3. Runs the test with the first image found

## Testing Your Own Images

To test with your own recipe images:

1. Create a `test_images` directory if it doesn't exist
2. Add your recipe images to this directory
3. Use any of the methods above to test the endpoint

## Notes

- The cropped images will be saved in the `test_results/` directory
- If the AI service returns an error, it will be displayed in the console
- The test tools use the local endpoint at `http://localhost:5050/crop`