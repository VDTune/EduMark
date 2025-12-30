import cloudinary
import cloudinary.uploader
import requests
import numpy as np
import cv2
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

def download_image_from_url(url, target_width=1500):
    """Tải ảnh từ URL Cloudinary, resize server-side, trả về ảnh OpenCV"""
    try:
        optimized_url = url
        # Tối ưu: Yêu cầu Cloudinary resize ảnh xuống 1500px trước khi tải về -> Tiết kiệm RAM
        if "cloudinary.com" in url and "/upload/" in url:
             parts = url.split("/upload/")
             if len(parts) == 2:
                optimized_url = f"{parts[0]}/upload/w_{target_width},c_limit,q_auto/{parts[1]}"

        response = requests.get(optimized_url, timeout=20)
        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"❌ Error downloading: {e}")
        return None

def upload_image_to_cloudinary(cv2_img, folder="edumark_cleaned"):
    """Upload ảnh OpenCV lên Cloudinary"""
    try:
        success, encoded_image = cv2.imencode('.jpg', cv2_img)
        if not success: return None
        # Upload buffer trực tiếp
        response = cloudinary.uploader.upload(encoded_image.tobytes(), folder=folder)
        return response.get("secure_url")
    except Exception as e:
        print(f"❌ Error uploading: {e}")
        return None