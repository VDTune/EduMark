import re
import os
import logging
import numpy as np
import cv2
from paddleocr import PaddleOCR
# from backend.ocr_llm.encoding_fix import force_utf8
# force_utf8()

# 1. Cấu hình môi trường
# Tắt log rác của Paddle và sửa lỗi thư viện trên Windows
logging.getLogger("ppocr").setLevel(logging.ERROR)
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

# --- Singleton Pattern: Quản lý Model ---
_ocr_model = None                            

# def get_ocr_model():
#     """
#     Hàm này đảm bảo chỉ load model 1 lần duy nhất.
#     """
#     global _ocr_model
#     if _ocr_model is None:
#         print("⏳ Loading PaddleOCR model (Vietnamese)...")
#         # use_angle_cls=True: Tự động xoay ảnh nghiêng
#         # lang='vi': Tiếng Việt
#         # show_log=False: Tắt log nội bộ
#         _ocr_model = PaddleOCR(use_angle_cls=True, lang='en', device='cpu')
#         print("✅ PaddleOCR READY.")
#     return _ocr_model

def extract_text_from_image(image_path):
    """
    Hàm xử lý chính: Đọc ảnh -> OCR -> Trả về văn bản.
    """
    print(f"\n--- ⚙️ BẮT ĐẦU OCR: {os.path.basename(image_path) if image_path else 'Unknown'} ⚙️ ---")

    # 2. Kiểm tra đường dẫn
    if not image_path or not os.path.exists(image_path):
        print(f"🛑 Error: Not Found image file at path'{image_path}'.")
        return ""

    try:
        # Lấy model (đã load hoặc load mới)
        # ocr = get_ocr_model()
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='en', device='cpu')

        img_array = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)

        if img_array is None:
            print("🛑 Error: OpenCV can not read image file (File error or corrupted).")
            return ""
        
        TARGET_WIDTH = 1500
        height, width, _ = img_array.shape
        
        # Chỉ resize nếu chiều rộng không nằm trong khoảng tối ưu
        if width < 500 or width > 2000:
            print(f"Resizing image from {width}px to {TARGET_WIDTH}px width...")
            scale_ratio = TARGET_WIDTH / width
            new_height = int(height * scale_ratio)
            img_array = cv2.resize(img_array, (TARGET_WIDTH, new_height), interpolation=cv2.INTER_CUBIC)


        print(f"👁️ Scanning text in image...")
        
        # 4. Chạy OCR
        result = ocr.ocr(img_array)

        final_lines = []
        # MIN_CONFIDENCE = 0.6  # Lọc rác
        
        print("--- RESULT DETAIL ---")
        
        # Trường hợp không tìm thấy gì
        if result is None or len(result) == 0 or result[0] is None:
             print("⚠️ Warning: No text recognized.")
             return ""
        
        data = result[0]

        if isinstance(data, list):
            for line_info in data:
                if isinstance(line_info, list) and len(line_info) > 1:
                    text_tuple = line_info[1] # (text, score)
                    text = text_tuple[0]
                    score = text_tuple[1]
                    
                    print(f"Text: {text} | Reliability: {score:.2f}")
                    final_lines.append(text)

        # TRƯỜNG HỢP B: Kết quả dạng Dict (Dự phòng cho các phiên bản khác)
        elif isinstance(data, dict):
            texts = data.get('rec_texts', [])
            scores = data.get('rec_scores', [])
            
            if texts and scores:
                for t, s in zip(texts, scores):
                    print(f"Text: {t} | Reliability: {s:.2f}")
                    final_lines.append(t)
            else:
                 print("⚠️ Dictionary data returned empty.")

        print("-------------------------")
        
        # Ghép lại thành 1 đoạn văn bản để trả về cho LLM
        full_text = "\n".join(final_lines)
        return full_text

    except Exception as e:
        print(f"❌ Exception error when running OCR: {e}")
        import traceback
        traceback.print_exc()
        return ""
    
def sanitize_text(text):
    """
    Loại bỏ ký tự rác, giữ lại ký tự toán học & chữ số.
    """
    text = re.sub(r'[^0-9a-zA-Zà-ỹÀ-Ỹ\+\-\=\.\,\(\)xXyYzZ√/ ]', '', text)
    return text.strip()


# if __name__ == "__main__":
#     test_path = r"D:\TIEN\Nam5\DATN\test_images\bai_kiem_tra.jpg"
#     text = extract_text_from_image(test_path)
#     print("\n=== KẾT QUẢ CUỐI CÙNG ===")
#     print(text)