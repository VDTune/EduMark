import sys
import json
import io
import os
import shutil
import requests

from img_preprocessing import clean_image
from ocr_batch_processor import ocr_batch_parallel
from llm_processor import grade_multiple_submissions_parallel
from mcq_grader import MCQGrader
from cloudinary import uploader

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


TEMP_RAW_DIR = "uploads/temp/raw"
TEMP_CLEAN_DIR = "uploads/temp/cleaned"

os.makedirs(TEMP_RAW_DIR, exist_ok=True)
os.makedirs(TEMP_CLEAN_DIR, exist_ok=True)


def download_image(src, save_path):
    if src.startswith("http://") or src.startswith("https://"):
        r = requests.get(src, timeout=30)
        r.raise_for_status()
        with open(save_path, "wb") as f:
            f.write(r.content)
    # Case 2: local path
    elif os.path.exists(src):
        shutil.copyfile(src, save_path)
    else:
        raise ValueError(f"Invalid image source: {src}")


def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python main_processor.py <urls> <rubric>"}))
        sys.exit(1)

    raw_urls = sys.argv[1].split(",")
    rubric = sys.argv[2]

    raw_local = []
    cleaned_local = []
    cleaned_cloud = []

    try:
        # 1. Download RAW
        for i, url in enumerate(raw_urls):
            raw_path = os.path.join(TEMP_RAW_DIR, f"{i}.jpg")
            download_image(url, raw_path)
            raw_local.append(raw_path)

        # 2. Clean images
        for raw in raw_local:
            cleaned = clean_image(raw)
            if cleaned:
                cleaned_local.append(cleaned)

        # 3. Upload CLEANED to Cloudinary
        for img in cleaned_local:
            result = uploader.upload(
                img,
                folder=os.getenv("CLOUDINARY_FOLDER_CLEAN"),
                resource_type="image"
            )
            cleaned_cloud.append(result["secure_url"])

        # 4. OCR + AI (GIỮ NGUYÊN)
        ocr_results = ocr_batch_parallel(cleaned_local, max_workers=1)

        mcq_grader = MCQGrader()
        context = ""

        for page in ocr_results:
            for item in page:
                if isinstance(item, dict):
                    context += item.get("text", "") + "\n"

        submission_payload = [(cleaned_local, rubric, context)]
        grading = grade_multiple_submissions_parallel(submission_payload, 1)[0]

        print("<<<JSON_START>>>")
        print(json.dumps({
            **grading,
            "cleanedUrls": cleaned_cloud
        }, ensure_ascii=False))
        print("<<<JSON_END>>>")

    finally:
        shutil.rmtree(TEMP_RAW_DIR, ignore_errors=True)
        shutil.rmtree(TEMP_CLEAN_DIR, ignore_errors=True)


if __name__ == "__main__":
    main()
