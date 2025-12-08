# d:\TIEN\Nam5\DATN\EduMark\backend\ocr_llm\llm_processor.py
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from prompt import prompt_template
# from encoding_fix_backup import force_utf8
# force_utf8()

# Tải các biến môi trường từ file .env ở thư mục backend
# Điều này giúp quản lý API key một cách an toàn
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

# --- Main Grading Function ---
def grade_submission_with_llm(recognized_text: str, rubric: str):
    
    print("\n--- 4. START GRADING WITH LLM ---")
    
    # Trường hợp OCR không đọc được gì
    if not recognized_text or not recognized_text.strip():
        print("⚠️ Warning: Empty OCR text, cannot be graded.")
        return {
            "score": 0,
            "comment": "Không thể chấm điểm do không nhận dạng được văn bản từ ảnh bài làm.",
            "feasibility": False,
            "details": {}
        }

    try:
        # Lấy model Gemini (sẽ được khởi tạo nếu chưa có)
        model = get_gemini_model()


        # Điền thông tin vào prompt template
        final_prompt = prompt_template.format(
            rubric=rubric,
            recognized_text=recognized_text
        )

        # Cấu hình để yêu cầu LLM trả về đúng định dạng JSON
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json"
        )

        print("Sending score request to Google API...")
        # Gọi API và lấy kết quả
        response = model.generate_content(
            [final_prompt],
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
            grading_result = json.loads(response_text)
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
from concurrent.futures import ThreadPoolExecutor, as_completed

def grade_multiple_submissions_parallel(submissions, max_workers=5):
    """
    Chấm nhiều bài song song bằng Gemini (ThreadPoolExecutor)

    submissions: List tuple (recognized_text, rubric)
    max_workers: số luồng xử lý song song

    Returns:
        List kết quả chấm điểm (giữ đúng thứ tự input)
    """

    results = [None] * len(submissions)

    print(f"\n🚀 Parallel LLM grading started with {max_workers} threads...")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {
            executor.submit(grade_submission_with_llm, text, rubric): i
            for i, (text, rubric) in enumerate(submissions)
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
                    "comment": "Lỗi khi chấm bài bằng AI",
                    "feasibility": False,
                    "details": {}
                }

    print("🎉 All parallel grading completed.")
    return results

