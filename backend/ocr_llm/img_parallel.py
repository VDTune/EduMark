from concurrent.futures import ProcessPoolExecutor
from img_preprocessing import clean_image

def clean_images_parallel(image_paths, max_workers=2):
    """
    Xử lý làm sạch nhiều ảnh song song
    """
    print("⚙️ Start parallel cleaning...")

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(clean_image, image_paths))

    # lọc ảnh lỗi
    results = [img for img in results if img]

    print("✅ Parallel cleaning finished")
    return results
