import cv2
import numpy as np
import os
import uuid

CLEANED_DIR = os.path.join('./uploads', "cleaned")
os.makedirs(CLEANED_DIR, exist_ok=True)

def remove_small_components(binary_img, min_size=80):
    # binary_img: foreground = 255, background = 0
    nb_components, output, stats, _ = cv2.connectedComponentsWithStats(binary_img, connectivity=8)
    sizes = stats[1:, cv2.CC_STAT_AREA]
    nb_components -= 1
    img_clean = np.zeros(output.shape, dtype=np.uint8)
    for i in range(0, nb_components):
        if sizes[i] >= min_size:
            img_clean[output == i + 1] = 255
    return img_clean

def deskew_image(binary_img, orig_img):
    # binary_img: foreground=255 (text), background=0
    coords = np.column_stack(np.where(binary_img > 0))
    if coords.shape[0] < 10:
        return orig_img, 0.0
    
    rect = cv2.minAreaRect(coords[:, ::-1])  # x,y swapped
    angle = rect[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    if abs(angle) > 10: 
        return orig_img, 0.0
    
    (h, w) = orig_img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    # Tính sin và cos của góc xoay
    abs_cos = abs(M[0, 0])
    abs_sin = abs(M[0, 1])

    # Tính chiều rộng và chiều cao mới của ảnh sau khi xoay
    bound_w = int(h * abs_sin + w * abs_cos)
    bound_h = int(h * abs_cos + w * abs_sin)

    # Điều chỉnh ma trận dịch chuyển (Translation matrix) để ảnh nằm giữa khung mới
    M[0, 2] += bound_w / 2 - center[0]
    M[1, 2] += bound_h / 2 - center[1]

    # Thực hiện xoay với kích thước khung hình mới
    rotated = cv2.warpAffine(orig_img, M, (bound_w, bound_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return rotated, angle

def enhance_mcq_marks(img_gray, out_for_mcq):
    # Attempt to detect circular marks (bubble answers) and emphasize them
    # Work on a blurred version to help Hough
    blur = cv2.medianBlur(img_gray, 5)
    # HoughCircles expects bright circles on dark background or reverse; try both
    circles = None
    try:
        circles = cv2.HoughCircles(
            blur,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=15,
            param1=60,
            param2=18,
            minRadius=8,
            maxRadius=40
        )
    except Exception:
        circles = None

    out = out_for_mcq.copy()
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for (x, y, r) in circles[0, :]:
            # draw thicker circle and fill slightly to strengthen mark
            cv2.circle(out, (x, y), r+2, (0, 0, 0), thickness=3)
            cv2.circle(out, (x, y), max(2, r-4), (0, 0, 0), thickness=-1)
    return out

def clean_image(file_path, for_mcq=False):
    """
    Enhanced cleaning for exam sheets (A4) with heavy salt-and-pepper noise.
    Returns path to cleaned image optimized for OCR, and optionally MCQ-enhanced image.
    """
    print("\n--- START ENHANCED CLEAN IMAGE ---")
    if not os.path.exists(file_path):
        print("❌ File not found:", file_path)
        return ""

    try:
        arr = np.fromfile(file_path, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            print("❌ Cannot decode image")
            return ""

        # Resize down if extremely large to speed up, but keep details
        h, w = img.shape[:2]
        max_dim = max(h, w)
        if max_dim > 2400:
            scale = 2400 / max_dim
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            h, w = img.shape[:2]

        # convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1) Strong denoising: Non-local Means (preserve edges)
        denoised = cv2.fastNlMeansDenoising(gray, None, h=25, templateWindowSize=7, searchWindowSize=21)

        # 2) Small morphological opening to remove isolated noise pixels
        kernel = np.ones((2, 2), np.uint8)
        opened = cv2.morphologyEx(denoised, cv2.MORPH_OPEN, kernel, iterations=1)

        # 3) Slight contrast enhancement via CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast = clahe.apply(opened)

        # 4) Slight sharpening (mild) to strengthen strokes
        kernel_sharp = np.array([
            [0, -0.3, 0], 
            [-0.3, 3.0, -0.3], 
            [0, -0.3, 0]])
        sharpened = cv2.filter2D(contrast, -1, kernel_sharp)

        # 5) Adaptive threshold - use INV so text becomes white on black (helps connectedComponents)
        adaptive = cv2.adaptiveThreshold(
            sharpened,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=25,
            C=10
        )

        # 6) Remove small components (likely noise)
        cleaned_components = remove_small_components(adaptive, min_size=120)

        # 7) Deskew using cleaned_components, rotate original color and grayscale accordingly
        rotated_color, angle = deskew_image(cleaned_components, img)
        # recompute grayscale from rotated color
        rotated_gray = cv2.cvtColor(rotated_color, cv2.COLOR_BGR2GRAY)

        # 8) Re-run a light pipeline after deskew to refine
        den2 = cv2.fastNlMeansDenoising(rotated_gray, None, h=15, templateWindowSize=7, searchWindowSize=21)
        clahe2 = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8)).apply(den2)
        adapt2 = cv2.adaptiveThreshold(clahe2, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY_INV, blockSize=21, C=8)

        cleaned_final_inv = remove_small_components(adapt2, min_size=100)

        # final result: invert back to have black text (0) on white (255)
        final = cv2.bitwise_not(cleaned_final_inv)

        # optional: do a small median blur to smooth remaining speckles but preserve edges
        final = cv2.medianBlur(final, 3)

        # Save OCR-optimized image
        cleaned_image_path = os.path.join(CLEANED_DIR, f"cleaned_ocr_{uuid.uuid4().hex}.jpg")
        ok, enc = cv2.imencode(".jpg", final, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        if ok:
            enc.tofile(cleaned_image_path)
            print("✅ OCR image saved:", cleaned_image_path)
        else:
            print("❌ Failed saving OCR image")
            return ""

        # If MCQ detection needed, create an enhanced variant (emphasize circles)
        mcq_path = None
        if for_mcq:
            # Work on grayscale rotated image to detect circles and emphasize
            rotated_gray2 = rotated_gray.copy()
            # create a white background B/W image for drawing
            mcq_base = cv2.bitwise_not(cleaned_final_inv)  # black text on white
            mcq_enhanced = enhance_mcq_marks(rotated_gray2, mcq_base)
            mcq_path = os.path.join(CLEANED_DIR, f"cleaned_mcq_{uuid.uuid4().hex}.jpg")
            ok2, enc2 = cv2.imencode(".jpg", mcq_enhanced, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            if ok2:
                enc2.tofile(mcq_path)
                print("✅ MCQ image saved:", mcq_path)
            else:
                print("❌ Failed saving MCQ image")

        # return both paths (mcq_path may be None)
        if not for_mcq:
            return cleaned_image_path
        return cleaned_image_path, mcq_path

    except Exception as e:
        import traceback
        print("❌ Error in enhanced clean:", e)
        traceback.print_exc()
        return ""
