from concurrent.futures import ProcessPoolExecutor
from ocr_processor import extract_text_from_image

def ocr_batch_parallel(image_paths, max_workers=4):

    if not isinstance(image_paths, list):
        return []

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(extract_text_from_image, image_paths))

    return results
