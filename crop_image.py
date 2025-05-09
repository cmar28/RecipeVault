from PIL import Image

# Load the original image
img = Image.open("test_images/20250429_103925.jpg")

# Define crop box: taking roughly the lower 55% of the page
width, height = img.size
upper = int(height * 0.45)
left, right, lower = 0, width, height

print(f"Original image dimensions: {width}x{height}")
print(f"Cropping from: left={left}, upper={upper}, right={right}, lower={lower}")

dish_crop = img.crop((left, upper, right, lower))

# Save the cropped image
output_path = "test_results/oa03_Crop.jpg"
dish_crop.save(output_path)

print(f"Cropped image saved to: {output_path}")