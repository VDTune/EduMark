# d:\TIEN\Nam5\DATN\EduMark\backend\ocr_llm\llm_processor.py
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
import re
import json
import PIL.Image
from dotenv import load_dotenv
from prompt import prompt_template
from concurrent.futures import ThreadPoolExecutor, as_completed
# from encoding_fix_backup import force_utf8
# force_utf8()

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# --- Singleton Pattern for Gemini Model ---
_gemini_model = None

def _configure_gemini():
    global _gemini_model
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("ERROR: Environment variable 'GOOGLE_API_KEY' is not set in .env file.")
        
        genai.configure(api_key=api_key)
        
        print("Initializing Gemini (gemini-Flash-lastest) model...")
        # Sử dụng gemini-pro, một model mạnh mẽ và ổn định
        _gemini_model = genai.GenerativeModel('gemini-flash-latest') 
        print("✅ Gemini model is ready.")
        
    except Exception as e:
        print(f"🛑 Error in _configure_gemini: {e}")
        # Ném lại lỗi để dừng chương trình nếu không thể kết nối Gemini
        raise

def get_gemini_model():
    global _gemini_model
    if _gemini_model is None:
        _configure_gemini()
    return _gemini_model
def clean_json_string(text):
    """
    Hàm làm sạch chuỗi JSON trả về từ LLM.
    Loại bỏ các ký tự markdown như ```json ... ```
    """
    if not text:
        return ""
    
    # 1. Loại bỏ markdown code block
    text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'```$', '', text, flags=re.MULTILINE)
    
    # 2. Trim khoảng trắng
    text = text.strip()
    return text

# --- Main Grading Function ---
def grade_submission_with_llm(image_paths: list, rubric: str, final_context_text: str):
    
    print("\n--- 4. START GRADING WITH LLM ---")
    
    # Trường hợp OCR không đọc được gì
    if not image_paths:
        print("⚠️ Warning: Empty OCR text, cannot be graded.")
        return {
            "score": 0,
            "comment": "Không tìm thấy bài làm để chấm",
            "feasibility": False,
            "details": {}
        }

    try:
        # Lấy model Gemini (sẽ được khởi tạo nếu chưa có)
        model = get_gemini_model()

        image_parts = []
        for path in image_paths:
            try:
                if os.path.exists(path):
                    img = PIL.Image.open(path)
                    image_parts.append(img)
                    print(f"✅ Loaded image for Vision: {os.path.basename(path)}")
                else:
                    print(f"⚠️ Image path not found: {path}")
            except Exception as e:
                print(f"⚠️ Error loading image {path}: {e}")

        if not image_parts:
            return {
                "score": 0,
                "comment": "Lỗi: Không thể đọc được file ảnh nào.",
                "feasibility": False,
                "details": {}
            }

        # Điền thông tin vào prompt template
        final_prompt = prompt_template.format(
            rubric=rubric,
            recognized_text=final_context_text
        )

        # 4. Gửi Request Đa phương thức (Multimodal: Text Prompt + Images)
        # Gemini nhận input là một list [Prompt_Text, Image1, Image2, ...]
        input_content = [final_prompt] + image_parts

        print("Sending VISION request (Text + Images) to Google API...")

        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        # Cấu hình để yêu cầu LLM trả về đúng định dạng JSON
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1# Giảm sáng tạo để kết quả ổn định
        )

        print("Sending score request to Google API...")
        # Gọi API và lấy kết quả
        response = model.generate_content(
            input_content,
            generation_config=generation_config
        )

        # Trích xuất nội dung text từ response một cách an toàn
        import traceback as _tb
        response_text = None
        try:
            # Trường hợp thông thường: response.candidates[0].content.parts[0].text
            if getattr(response, 'candidates', None) and len(response.candidates) > 0:
                cand = response.candidates[0]
                # Try common attribute paths used by different SDK versions
                try:
                    response_text = cand.content.parts[0].text
                except Exception:
                    try:
                        response_text = cand.output[0].content[0].text
                    except Exception:
                        # last resort: stringify candidate
                        response_text = None

            # If still no text, try to serialize response for debugging
            if not response_text:
                print("⚠️ Could not extract text via expected fields. Dumping response for debug...")
                try:
                    # response may be a proto message; convert to string
                    print(repr(response))
                except Exception:
                    print("(failed to repr response)")
                raise ValueError("No textual candidate found in API response")

            print("✅Get JSON response from API.")
            # Parse chuỗi JSON thành dictionary của Python
            cleaned_json = clean_json_string(response_text)
            grading_result = json.loads(cleaned_json)
            print("✅ JSON parsed successfully.")
            return grading_result
        except Exception as e:
            print(f"🛑 Failed to extract/parse JSON from LLM response: {e}")
            _tb.print_exc()
            return {
                "score": 0,
                "comment": f"Đã xảy ra lỗi khi xử lý phản hồi từ LLM: {e}",
                "feasibility": False,
                "details": {"raw_response": str(response)[:2000]}
            }

    except Exception as e:
        import traceback
        print(f"🛑 Serious ERROR in grading LLM: {e}")
        traceback.print_exc()
        # Trả về một cấu trúc lỗi nhất quán
        return {
            "score": 0,
            "comment": f"Đã xảy ra lỗi hệ thống trong quá trình chấm điểm bằng AI: {e}",
            "feasibility": False,
            "details": {}
        }

def grade_multiple_submissions_parallel(submissions, max_workers=5):
    """
    Chấm nhiều bài song song bằng Gemini (ThreadPoolExecutor)
    submissions: List tuple (image_paths, rubric, final_context_text)
    max_workers: số luồng xử lý song song
    """

    results = [None] * len(submissions)

    print(f"\n🚀 Parallel LLM grading started with {max_workers} threads...")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {
            executor.submit(grade_submission_with_llm, imgs, rub, txt): i
            for i, (imgs, rub, txt) in enumerate(submissions)
        }

        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            try:
                results[idx] = future.result()
                print(f"✅ Finished grading submission #{idx+1}")
            except Exception as e:
                print(f"❌ Error grading submission #{idx+1}: {e}")
                results[idx] = {
                    "score": 0,
                    "comment": "Lỗi luồng xử lý song song.",
                    "feasibility": False,
                    "details": {}
                }

    print("🎉 All parallel grading completed.")
    return results

