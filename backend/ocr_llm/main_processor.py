# d:\TIEN\Nam5\DATN\EduMark\backend\ocr_llm\main_processor.py
import sys
import json
from concurrent.futures import ProcessPoolExecutor
from img_parallel import clean_images_parallel
from ocr_batch_processor import ocr_batch_parallel
from llm_processor import grade_multiple_submissions_parallel
from detect_mcq import detect_mcq_answers
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def log(message):
    sys.stderr.write(f"{message}\n")
    sys.stderr.flush()
def normalize_cleaned_outputs(cleaned_images):
    """
    cleaned_images may contain:
     - "path/to/ocr.jpg" (string)
     - ("path/to/ocr.jpg", "path/to/mcq.jpg") (tuple)
    Return two lists: ocr_images (list[str]) and mcq_images (list[str])
    """
    ocr_images = []
    mcq_images = []
    for i, item in enumerate(cleaned_images):
        if isinstance(item, (list, tuple)):
            # choose first element as ocr image, second as mcq (may be None)
            if len(item) > 0 and isinstance(item[0], str) and item[0]:
                ocr_images.append(item[0])
            if len(item) > 1 and isinstance(item[1], str) and item[1]:
                mcq_images.append(item[1])
        elif isinstance(item, str):
            ocr_images.append(item)
        else:
            log(f"Warning: unknown cleaned_images item type at index {i}: {type(item)} - skipping")
    return ocr_images, mcq_images

def format_mcq_answers(mcq_results_all):
    """
    mcq_results_all: list of lists per page, where each inner is [{'question':1,'selected':'A'},...]
    Format into human-readable block for LLM.
    Câu không nhận diện được sẽ được ghi là '?'.
    """
    lines = []
    q_global = 1
    for page_idx, page_res in enumerate(mcq_results_all):
        if not page_res:
            continue
        lines.append(f"--- MCQ Page {page_idx+1} ---")
        for r in page_res:
            sel = r.get('selected', '?')
            # Nếu selected không phải A/B/C/D, coi như không đọc được
            if sel not in ['A','B','C','D']:
                sel = '?'
            lines.append(f"Q{q_global}: {sel}")
            q_global += 1
    return "\n".join(lines)

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python main_processor.py <image_paths_comma_separated> <rubric_string>"}))
        sys.exit(1)

    image_paths = sys.argv[1].split(',')
    rubric = sys.argv[2]

    try:
        # Step 1: Clean images in parallel
        cleaned_images = clean_images_parallel(image_paths, max_workers=1)
        log(f"Cleaned images: {cleaned_images}")

        # 2) Normalize outputs -> separate ocr_images and mcq_images
        ocr_images, mcq_images = normalize_cleaned_outputs(cleaned_images)
        log(f"OCR images: {ocr_images}")
        log(f"MCQ images: {mcq_images}")

        # Step 3: Extract text from cleaned images in parallel
        ocr_texts = []
        if ocr_images:
            ocr_texts = ocr_batch_parallel(ocr_images, max_workers=1)
        log(f"OCR texts extracted: {len(ocr_texts)} pages")

        essay_text = "\n".join(ocr_texts).strip()
        log("Concatenated essay_text length: %d" % len(essay_text))

        # 4) Run MCQ detection per mcq image (if any)
        mcq_results_all = []
        for p in mcq_images:
            try:
                res = detect_mcq_answers(p, debug=False)
                mcq_results_all.append(res)
            except Exception as e:
                log(f"Error detecting MCQ on {p}: {e}")
                mcq_results_all.append([])

        mcq_block_text = format_mcq_answers(mcq_results_all)
        log(f"MCQ block:\n{mcq_block_text}")

        # 5) Build recognized_text payload = essay_text + MCQ block
        recognized_text = ""
        if essay_text:
            recognized_text += "=== ESSAY TEXT START ===\n" + essay_text + "\n=== ESSAY TEXT END ===\n\n"
        if mcq_block_text:
            recognized_text += "=== MCQ ANSWERS START ===\n" + mcq_block_text + "\n=== MCQ ANSWERS END ===\n\n"

        if not recognized_text.strip():
            recognized_text = ""  # preserve behavior for empty

        # Step 6: Grade the submission using the LLM
        grading_result = grade_multiple_submissions_parallel([(recognized_text, rubric)], max_workers=1)[0]
        log("Grading complete.")

        # Step 7: Print the final result to stdout for Node.js
        print("<<<JSON_START>>>", flush=True)
        print(json.dumps(grading_result, ensure_ascii=False), flush=True)
        print("<<<JSON_END>>>", flush=True)

    except Exception as e:
        log(f"An error occurred: {e}")
        error_result = {
            "score": 0,
            "comment": f"System Error: {e}",
            "feasibility": False,
            "details": {}
        }
        print("<<<JSON_START>>>", flush=True)
        print(json.dumps(error_result, ensure_ascii=False), flush=True)
        print("<<<JSON_END>>>", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()

