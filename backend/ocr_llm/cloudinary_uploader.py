import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

def upload_cleaned_image(local_path: str, student_name: str):
    """
    Upload ảnh CLEANED lên Cloudinary
    """
    result = cloudinary.uploader.upload(
        local_path,
        folder=f"{os.getenv('CLOUDINARY_FOLDER_CLEAN')}/{student_name}",
        resource_type="image"
    )
    return result["secure_url"]
