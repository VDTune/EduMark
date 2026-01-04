import cv2
import numpy as np
import os
import uuid

# cleaned sẽ nằm cùng cấp uploads/cleaned
CLEANED_DIR = os.path.join("uploads", "cleaned")
os.makedirs(CLEANED_DIR, exist_ok=True)


def remove_small_components(binary_img, min_size=80):
    nb_components, output, stats, _ = cv2.connectedComponentsWithStats(
        binary_img, connectivity=8
    )
    sizes = stats[1:, cv2.CC_STAT_AREA]
    nb_components -= 1
    img_clean = np.zeros(output.shape, dtype=np.uint8)
    for i in range(nb_components):
        if sizes[i] >= min_size:
            img_clean[output == i + 1] = 255
    return img_clean


def deskew_image(binary_img, orig_img):
    coords = np.column_stack(np.where(binary_img > 0))
    if coords.shape[0] < 10:
        return orig_img, 0.0

    rect = cv2.minAreaRect(coords[:, ::-1])
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

    abs_cos = abs(M[0, 0])
    abs_sin = abs(M[0, 1])
    bound_w = int(h * abs_sin + w * abs_cos)
    bound_h = int(h * abs_cos + w * abs_sin)

    M[0, 2] += bound_w / 2 - center[0]
    M[1, 2] += bound_h / 2 - center[1]

    rotated = cv2.warpAffine(
        orig_img,
        M,
        (bound_w, bound_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return rotated, angle


def clean_image(file_path: str) -> str:
    """
    Clean image for OCR.
    RETURN: path to cleaned image
    """
    if not os.path.exists(file_path):
        print("❌ File not found:", file_path)
        return ""

    try:
        arr = np.fromfile(file_path, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            print("❌ Cannot decode image")
            return ""

        h, w = img.shape[:2]
        if max(h, w) > 2400:
            scale = 2400 / max(h, w)
            img = cv2.resize(img, None, fx=scale, fy=scale)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, None, 25, 7, 21)

        kernel = np.ones((2, 2), np.uint8)
        opened = cv2.morphologyEx(denoised, cv2.MORPH_OPEN, kernel)

        clahe = cv2.createCLAHE(2.0, (8, 8))
        contrast = clahe.apply(opened)

        sharpen_kernel = np.array(
            [[0, -0.3, 0], [-0.3, 3.0, -0.3], [0, -0.3, 0]]
        )
        sharpened = cv2.filter2D(contrast, -1, sharpen_kernel)

        adaptive = cv2.adaptiveThreshold(
            sharpened, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            25, 10
        )

        cleaned_components = remove_small_components(adaptive, 120)
        rotated_color, _ = deskew_image(cleaned_components, img)
        rotated_gray = cv2.cvtColor(rotated_color, cv2.COLOR_BGR2GRAY)

        den2 = cv2.fastNlMeansDenoising(rotated_gray, None, 15, 7, 21)
        clahe2 = cv2.createCLAHE(1.8, (8, 8)).apply(den2)

        adapt2 = cv2.adaptiveThreshold(
            clahe2, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            21, 8
        )

        cleaned_final = remove_small_components(adapt2, 100)
        final = cv2.bitwise_not(cleaned_final)
        final = cv2.medianBlur(final, 3)

        cleaned_path = os.path.join(
            CLEANED_DIR, f"cleaned_{uuid.uuid4().hex}.jpg"
        )

        cv2.imencode(".jpg", final, [cv2.IMWRITE_JPEG_QUALITY, 95])[1].tofile(
            cleaned_path
        )

        return cleaned_path

    except Exception as e:
        import traceback
        print("❌ Clean error:", e)
        traceback.print_exc()
        return ""
