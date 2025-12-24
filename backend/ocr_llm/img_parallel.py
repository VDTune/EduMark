from concurrent.futures import ProcessPoolExecutor
from img_preprocessing import clean_image

def clean_images_parallel(image_paths, max_workers=2):
    """
    Xử lý làm sạch nhiều ảnh song song
    """
    print("⚙️ Start parallel cleaning...")

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(clean_image, image_paths))

    # lọc ảnh lỗi và ghép cặp với ảnh gốc
    final_results = []
    for orig, clean in zip(image_paths, results):
        if clean:
            final_results.append((orig, clean))

    print("✅ Parallel cleaning finished")
    return final_results
