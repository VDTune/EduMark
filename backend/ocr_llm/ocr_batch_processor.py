from concurrent.futures import ProcessPoolExecutor
from ocr_processor import extract_text_from_image

def ocr_batch_parallel(image_paths, max_workers=4):
    """
    Chạy OCR song song cho nhiều ảnh.

    Args:
        image_paths (list): danh sách đường dẫn ảnh
        max_workers (int): số process xử lý cùng lúc

    Returns:
        list[str]: danh sách text OCR tương ứng
    """

    if not isinstance(image_paths, list):
        return []

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(extract_text_from_image, image_paths))

    return results
