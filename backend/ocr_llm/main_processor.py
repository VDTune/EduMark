import sys
import json
import io
import os
import shutil
import requests
import uuid
from concurrent.futures import ProcessPoolExecutor
from dotenv import load_dotenv

# --- QUAN TRỌNG: Load .env TRƯỚC KHI import các module khác ---
# Vì cloudinary_uploader dùng os.getenv ngay khi import
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Import các module custom của bạn
from img_parallel import clean_images_parallel
from ocr_batch_processor import ocr_batch_parallel
from llm_processor import grade_multiple_submissions_parallel
from mcq_grader import MCQGrader
from cloudinary_uploader import upload_cleaned_image

# Thiết lập encoding cho luồng IO
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# Cấu hình thư mục tạm
RUN_ID = uuid.uuid4().hex
TEMP_RAW_DIR = os.path.join("uploads", "temp", "raw", RUN_ID)
TEMP_CLEAN_DIR = os.path.join("uploads", "temp", "cleaned", RUN_ID)

os.makedirs(TEMP_RAW_DIR, exist_ok=True)
os.makedirs(TEMP_CLEAN_DIR, exist_ok=True)

def log(message):
    sys.stderr.write(f"{message}\n")
    sys.stderr.flush()

def download_image(src, save_path):
    """Tải ảnh từ URL hoặc copy từ local path"""
    if src.startswith("http://") or src.startswith("https://"):
        r = requests.get(src, timeout=30)
        r.raise_for_status()
        with open(save_path, "wb") as f:
            f.write(r.content)
    elif os.path.exists(src):
        shutil.copyfile(src, save_path)
    else:
        raise ValueError(f"Invalid image source: {src}")

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python main_processor.py <urls> <rubric>"}))
        sys.exit(1)

    # Split and strip URLs to avoid whitespace issues
    raw_urls = [u.strip() for u in sys.argv[1].split(",") if u.strip()]
    rubric = sys.argv[2]

    download_raw_paths = []

    # Danh sách quản lý đường dẫn
    raw_local = []      # Đường dẫn ảnh gốc (cho MCQ Grader)
    cleaned_local = []  # Đường dẫn ảnh sạch (cho OCR/LLM)
    cleaned_cloud = []  # URL ảnh sạch trên Cloudinary (trả về FE)

    try:
        # --- BƯỚC 1: DOWNLOAD & CLEAN ---
        for i, url in enumerate(raw_urls):
            # 1.1 Download RAW
            raw_path = os.path.join(TEMP_RAW_DIR, f"{i}.jpg")
            try:
                download_image(url, raw_path)
                download_raw_paths.append(raw_path)
            except Exception as e:
                log(f"Error processing image {url}: {e}")
        if not download_raw_paths:
            raise Exception("No valid images were downloaded.")
        
        # --- BƯỚC 2. LÀM SẠCH ẢNH SONG SONG ---
        cleaned_result = clean_images_parallel(download_raw_paths, max_workers=2)
        if not cleaned_result:
            raise Exception("No images could be cleaned.")
        
        for orig, clean in cleaned_result:
            raw_local.append(orig)
            cleaned_local.append(clean)

        if not cleaned_local:
            raise Exception("No images could be processed.")

        # --- BƯỚC 3: UPLOAD CLEANED TO CLOUDINARY 
        for img in cleaned_local:
            try:
                url = upload_cleaned_image(img, "processed_batch")
                cleaned_cloud.append(url)
            except Exception as e: 
                log(f"Cloudinary upload failed for {img}: {e}")
                cleaned_cloud.append(None) 

        # --- BƯỚC 4: CHẠY OCR (Trên ảnh Cleaned) ---
        ocr_results_rich = ocr_batch_parallel(cleaned_local, max_workers=2)

        # --- BƯỚC 5: XỬ LÝ LOGIC MCQ & CONTEXT (Từ Main 2) ---
        mcq_grader = MCQGrader()
        full_ocr_text_context = ""
        combined_mcq_results = {}
        question_offset = 0

        for i, clean_path in enumerate(cleaned_local):
            current_raw_path = raw_local[i]
            
            # Lấy data OCR của trang tương ứng
            page_ocr_data = ocr_results_rich[i]

            # A. Xử lý OCR Data (Defensive Programming)
            processed_page_ocr_data = []
            if isinstance(page_ocr_data, list):
                for item in page_ocr_data:
                    if isinstance(item, dict):
                        processed_page_ocr_data.append(item)
            
            # B. Tạo Context Text cho LLM
            page_text_lines = [item.get('text', '') for item in processed_page_ocr_data]
            page_text_str = "\n".join(page_text_lines)
            full_ocr_text_context += f"\n--- Page {i+1} Content ---\n{page_text_str}\n"

            # C. Chấm Trắc nghiệm (Dùng ảnh RAW)
            # Quan trọng: Truyền current_raw_path vào đây
            page_mcq_results = mcq_grader.process_image(current_raw_path, save_debug=True)

            # D. Mapping kết quả MCQ (Dùng page_ocr_data để map tọa độ nếu cần)
            if page_mcq_results:
                current_page_max_q = 0
                
                for local_q_num, data in page_mcq_results.items():
                    val = int(local_q_num)
                    if val > current_page_max_q:
                        current_page_max_q = val
                        
                    # Tính số thứ tự câu hỏi toàn cục (Global Question Number)
                    global_q_num = str(question_offset + val)
                    combined_mcq_results[global_q_num] = data
                
                # Cập nhật offset dựa trên số câu lớn nhất tìm thấy, tránh lỗi khi YOLO bị miss câu
                question_offset += current_page_max_q
            else:
                log(f"MCQ Info: No circles found on page {i+1} ({current_raw_path})")

        # --- BƯỚC 5: TỔNG HỢP KẾT QUẢ ---
        mcq_text_block = mcq_grader.format_for_llm(combined_mcq_results)
        log(f"\n=== CHI TIẾT KẾT QUẢ TRẮC NGHIỆM ===\n{mcq_text_block}\n======================================\n")

        # --- BƯỚC 6: GỬI CHO LLM ---
        # Context bao gồm cả kết quả trắc nghiệm và text OCR
        final_context = f"{mcq_text_block}\n\n=== OCR RAW TEXT ===\n{full_ocr_text_context}"
        
        log(f"Context length sent to LLM: {len(final_context)} chars")
        if len(final_context) < 10:
            log("WARNING: Context quá ngắn, có thể OCR/YOLO không tìm thấy gì!")

        # LLM sẽ nhìn vào ảnh clean (dễ đọc chữ) + context text
        submission_payload = [(cleaned_local, rubric, final_context)]
        
        grading_result = grade_multiple_submissions_parallel(submission_payload, max_workers=2)[0]
        log("Grading complete.")

        # --- BƯỚC 7: TRẢ VỀ JSON ---
        print("<<<JSON_START>>>", flush=True)
        print(json.dumps({
            **grading_result,
            "cleanedUrls": cleaned_cloud  # Thêm URLs từ Cloudinary (Yêu cầu Main 1)
        }, ensure_ascii=False), flush=True)
        print("<<<JSON_END>>>", flush=True)

    except Exception as e:
        log(f"An error occurred: {e}")
        error_result = {
            "score": 0,
            "comment": f"System Error: {str(e)}",
            "feasibility": False,
            "details": {},
            "cleanedUrls": []
        }
        print("<<<JSON_START>>>", flush=True)
        print(json.dumps(error_result, ensure_ascii=False), flush=True)
        print("<<<JSON_END>>>", flush=True)
        sys.exit(1)

    finally:
        # Dọn dẹp thư mục tạm
        shutil.rmtree(TEMP_RAW_DIR, ignore_errors=True)
        shutil.rmtree(TEMP_CLEAN_DIR, ignore_errors=True)

if __name__ == "__main__":
    main()