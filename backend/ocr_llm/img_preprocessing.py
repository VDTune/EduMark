import cv2
import numpy as np
# Import các hàm tiện ích mới
from cloudinary_utils import download_image_from_url, upload_image_to_cloudinary

# --- Giữ nguyên 2 hàm thuật toán này ---
def remove_small_components(binary_img, min_size=80):
    nb_components, output, stats, _ = cv2.connectedComponentsWithStats(binary_img, connectivity=8)
    sizes = stats[1:, cv2.CC_STAT_AREA]
    nb_components -= 1
    img_clean = np.zeros(output.shape, dtype=np.uint8)
    for i in range(0, nb_components):
        if sizes[i] >= min_size: img_clean[output == i + 1] = 255
    return img_clean

def deskew_image(binary_img, orig_img):
    coords = np.column_stack(np.where(binary_img > 0))
    if coords.shape[0] < 10: return orig_img, 0.0
    rect = cv2.minAreaRect(coords[:, ::-1])
    angle = rect[-1]
    if angle < -45: angle = -(90 + angle)
    else: angle = -angle
    if abs(angle) > 10: return orig_img, 0.0
    (h, w) = orig_img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    bound_w = int(h * abs(M[0, 1]) + w * abs(M[0, 0]))
    bound_h = int(h * abs(M[0, 0]) + w * abs(M[0, 1]))
    M[0, 2] += bound_w / 2 - center[0]
    M[1, 2] += bound_h / 2 - center[1]
    return cv2.warpAffine(orig_img, M, (bound_w, bound_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), angle

# --- Thay đổi hàm chính ---
def clean_image(image_url):
    print(f"\n--- START CLEAN IMAGE FROM URL ---")
    
    # 1. Tải ảnh từ URL vào RAM
    img = download_image_from_url(image_url)
    if img is None: return ""

    try:
        # Pipeline xử lý ảnh (Copy nguyên logic cũ của bạn)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, None, h=25, templateWindowSize=7, searchWindowSize=21)
        kernel = np.ones((2, 2), np.uint8)
        opened = cv2.morphologyEx(denoised, cv2.MORPH_OPEN, kernel, iterations=1)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast = clahe.apply(opened)
        adaptive = cv2.adaptiveThreshold(contrast, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, blockSize=25, C=10)
        cleaned_components = remove_small_components(adaptive, min_size=120)
        rotated_color, _ = deskew_image(cleaned_components, img)
        rotated_gray = cv2.cvtColor(rotated_color, cv2.COLOR_BGR2GRAY)
        cleaned_final_inv = remove_small_components(cv2.adaptiveThreshold(rotated_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, blockSize=21, C=8), min_size=100)
        final = cv2.medianBlur(cv2.bitwise_not(cleaned_final_inv), 3)

        # 2. Upload ảnh đã clean lên Cloudinary
        cleaned_url = upload_image_to_cloudinary(final, folder="edumark_cleaned")
        
        if cleaned_url: 
            print("✅ Cleaned Image Saved:", cleaned_url)
            return cleaned_url
        return ""

    except Exception as e:
        print("❌ Error clean_image:", e)
        return ""