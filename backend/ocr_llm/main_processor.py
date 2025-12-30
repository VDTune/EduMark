import sys
import json
import io
from img_parallel import clean_images_parallel
from ocr_batch_processor import ocr_batch_parallel
from llm_processor import grade_multiple_submissions_parallel
from mcq_grader import MCQGrader

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def log(msg):
    sys.stderr.write(f"{msg}\n"); sys.stderr.flush()

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid args"})); sys.exit(1)

    # Input: URL ngăn cách bởi dấu phẩy
    raw_urls = sys.argv[1].split(',')
    rubric = sys.argv[2]

    try:
        # 1. Clean ảnh (Parallel - Sẽ dùng logic tải URL và Upload lại)
        cleaned_data = clean_images_parallel(raw_urls, max_workers=2)
        
        # cleaned_data có thể trả về list [url_gốc, url_cleaned] hoặc chỉ url_cleaned tùy logic img_parallel
        # Ở đây giả sử img_parallel đã được cập nhật hoặc trả về url cleaned
        final_urls = []
        original_urls = []
        for item in cleaned_data:
             if isinstance(item, (list, tuple)):
                original_urls.append(item[0])
                final_urls.append(item[1] if item[1] else item[0])
             elif isinstance(item, str) and item:
                 final_urls.append(item)
                 original_urls.append(item)
        
        if not final_urls: final_urls = raw_urls # Fallback

        # 2. OCR (Parallel - PaddleOCR cần update để hỗ trợ URL hoặc tải về như MCQ)
        # Lưu ý: Bạn cần đảm bảo ocr_batch_parallel dùng logic tải ảnh tương tự cloudinary_utils
        ocr_results = ocr_batch_parallel(final_urls, max_workers=2)

        # 3. Chấm Trắc nghiệm
        mcq_grader = MCQGrader()
        full_ocr_text = ""
        combined_mcq = {}
        offset = 0

        for i, url in enumerate(final_urls):
            # OCR Text
            page_data = ocr_results[i] if i < len(ocr_results) else []
            lines = [item['text'] for item in page_data if isinstance(item, dict)]
            full_ocr_text += f"\n--- Page {i+1} ---\n" + "\n".join(lines) + "\n"

            # YOLO Detect (Truyền URL vào)
            yolo_input = original_urls[i] if i < len(original_urls) else url
            page_mcq = mcq_grader.process_image(yolo_input) 
            
            if page_mcq:
                for k, v in page_mcq.items():
                    combined_mcq[str(offset + int(k))] = v
                offset += len(page_mcq)

        # 4. Gửi cho LLM
        mcq_block = mcq_grader.format_for_llm(combined_mcq)
        final_context = f"{mcq_block}\n\n=== OCR RAW ===\n{full_ocr_text}"
        
        payload = [(final_urls, rubric, final_context)]
        result = grade_multiple_submissions_parallel(payload, max_workers=1)[0]

        print("<<<JSON_START>>>")
        print(json.dumps(result, ensure_ascii=False))
        print("<<<JSON_END>>>")

    except Exception as e:
        log(f"Error: {e}")
        print("<<<JSON_START>>>")
        print(json.dumps({"score": 0, "comment": f"System Error: {e}", "details":{}}))
        print("<<<JSON_END>>>")

if __name__ == "__main__":
    main()