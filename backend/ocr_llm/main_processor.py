# d:\TIEN\Nam5\DATN\EduMark\backend\ocr_llm\main_processor.py
import sys
import json
from concurrent.futures import ProcessPoolExecutor
from img_parallel import clean_images_parallel
from ocr_batch_processor import ocr_batch_parallel
from llm_processor import grade_multiple_submissions_parallel
import io
from mcq_grader import MCQGrader

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def log(message):
    sys.stderr.write(f"{message}\n")
    sys.stderr.flush()

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
        final_images = []
        original_images = []

        for item in cleaned_images:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                original_images.append(item[0])
                final_images.append(item[1])
            elif isinstance(item, str) and item:
                final_images.append(item)
                original_images.append(item)

        # 2. CHẠY OCR (1 LẦN DUY NHẤT - PARALLEL)
        ocr_results_rich = ocr_batch_parallel(final_images, max_workers=1)
        # khởi tạo YOLO 
        mcq_grader = MCQGrader()
        full_ocr_text_context = ""
        combined_mcq_results = {}
        question_offset = 0

        for i, img_path in enumerate(final_images):
            # Lấy data OCR của trang tương ứng
            page_ocr_data = ocr_results_rich[i] 

            # --- Defensive Programming: Đảm bảo page_ocr_data có đúng định dạng ---
            # Chuyển đổi các item là chuỗi JSON thành dictionary để tránh lỗi "string indices must be integers"
            processed_page_ocr_data = []
            if isinstance(page_ocr_data, list):
                for item in page_ocr_data:
                    # ocr_processor trả về mixed list [str, dict, str, dict...].
                    # Ta chỉ cần lấy dict (chứa text, box, score) và bỏ qua str (raw text) để tránh lỗi json.loads
                    if isinstance(item, dict):
                        processed_page_ocr_data.append(item)
            
            # --- XỬ LÝ 1: Tạo Context Text cho LLM ---
            # Chỉ lấy trường 'text' để ghép thành đoạn văn
            page_text_lines = [item['text'] for item in processed_page_ocr_data]
            page_text_str = "\n".join(page_text_lines)
            full_ocr_text_context += f"\n--- Page {i+1} Content ---\n{page_text_str}\n"

            # --- XỬ LÝ 2: Chấm Trắc nghiệm bằng YOLO ---
            # Bước A: YOLO Detect (Tìm vòng tròn)
            yolo_input_img = original_images[i] if i < len(original_images) else img_path
            page_mcq_results = mcq_grader.process_image(yolo_input_img, save_debug=True)
            
            # Bước B: Mapping (Dùng page_ocr_data có sẵn tọa độ)
            if page_mcq_results:
                num_questions_in_page = len(page_mcq_results)
                
                # Cập nhật vào dictionary tổng
                for local_q_num, data in page_mcq_results.items():
                    # local_q_num là "1", "2"... của trang hiện tại
                    # global_q_num là số thứ tự thực tế: offset + local
                    global_q_num = str(question_offset + int(local_q_num))
                    combined_mcq_results[global_q_num] = data
                
                # Cập nhật offset cho vòng lặp sau
                # Ví dụ trang 1 tìm thấy 5 câu, offset=5. Trang 2 câu 1 sẽ thành câu 6.
                question_offset += num_questions_in_page
            else:
                log(f"MCQ Info: No circles or text found on {img_path}")

        # 5. Tổng hợp kết quả Trắc nghiệm
        mcq_text_block = mcq_grader.format_for_llm(combined_mcq_results)
        log(f"\n=== CHI TIẾT KẾT QUẢ TRẮC NGHIỆM ===\n{mcq_text_block}\n======================================\n")
       
        
        # 6. Gửi tất cả cho Vision LLM
        final_context = f"{mcq_text_block}\n\n=== OCR RAW TEXT ===\n{full_ocr_text_context}"
        log(f"Context length sent to LLM: {len(final_context)} chars")
        if len(final_context) < 10:
            log("WARNING: Context quá ngắn, có thể OCR/YOLO không tìm thấy gì!")
        submission_payload = [(final_images, rubric, final_context)]

        # Step 6: Grade the submission using the LLM
        grading_result = grade_multiple_submissions_parallel(submission_payload, max_workers=1)[0]
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
