import os
import re
from typing import List, Dict, Any, Tuple

import cv2
from ultralytics import YOLO

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'best.pt')

# Constants for answer column mapping based on relative X-coordinate
ANSWER_COLUMN_BOUNDARIES: List[Tuple[float, str]] = [
    (0.35, "A"),  # Ratio < 0.35 -> A
    (0.55, "B"),  # 0.35 <= Ratio < 0.55 -> B
    (0.75, "C"),  # 0.55 <= Ratio < 0.75 -> C
]
DEFAULT_LAST_COLUMN = "D"

class MCQGrader:
    def __init__(self):
        self.model = None
        if os.path.exists(MODEL_PATH):
            print(f"✅ Loading YOLO model from: {MODEL_PATH}")
            self.model = YOLO(MODEL_PATH)
        else:
            print(f"⚠️ Warning: Model file not found at {MODEL_PATH}")

    def detect_circles(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detects circled answers in an image using the YOLO model.

        Args:
            image_path: The path to the image file.

        Returns:
            A list of dictionaries, where each dictionary represents a detected circle
            with its center coordinates, bounding box, and confidence score.
        """
        if not self.model:
            return []
        # Run model prediction
        results = self.model.predict(image_path, conf=0.25, verbose=False)
        
        circles = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = box.conf[0].item()
                
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                
                circles.append({
                    'x': center_x,
                    'y': center_y,
                    'bbox': [x1, y1, x2, y2],
                    'conf': conf
                })
        return circles

    def map_ocr_to_yolo(self, ocr_data: List[Dict[str, Any]], yolo_circles: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Maps OCR-detected question numbers to YOLO-detected circled answers.

        This algorithm identifies lines containing question numbers (e.g., "Câu 1:"),
        then searches for the most confident circled answer within the vertical
        region of that question.

        Args:
            ocr_data: A list of OCR results, each with text and bounding box info.
            yolo_circles: A list of detected circles from the YOLO model.

        Returns:
            A dictionary mapping question numbers (as strings) to selected answers (e.g., "A", "B").
        """
        mapped_answers: Dict[str, str] = {}
        
        # 1. Find all lines containing question numbers (e.g., "Câu 1", "Question 2")
        question_lines = []
        pattern = re.compile(r'^(?:Câu\s*)?(\d+)[\.:]', re.IGNORECASE)
        
        for item in ocr_data:
            text = item['text'].strip()
            match = pattern.search(text)
            if match:
                q_num = int(match.group(1))
                question_lines.append({
                    'q_num': q_num,
                    'box': item['box'],
                    'text': text
                })
        
        question_lines.sort(key=lambda x: x['box']['y_center'])

        # 2. Map each question to the most likely circled answer in its vertical vicinity
        for i, q in enumerate(question_lines):
            q_num = q['q_num']
            
            # Define the vertical search area for answers for this question.
            # The search area starts from the top of the current question's bounding box.
            y_start = q['box']['y1']
            
            # The search area ends at the top of the next question's box.
            if i < len(question_lines) - 1:
                y_end = question_lines[i+1]['box']['y1']
            else:
                # For the last question, extend the search area downwards significantly.
                y_end = q['box']['y2'] + 300 # This value can be tuned if needed.

            candidates = [c for c in yolo_circles if y_start < c['y'] < y_end]
            
            if candidates:
                best_circle = max(candidates, key=lambda x: x['conf'])
                
                img_width = q['box'].get('img_width', 1000)
                
                # Avoid division by zero if img_width is somehow 0
                ratio = best_circle['x'] / img_width if img_width > 0 else 0
                
                selected = DEFAULT_LAST_COLUMN
                for boundary, answer in ANSWER_COLUMN_BOUNDARIES:
                    if ratio < boundary:
                        selected = answer
                        break
                
                mapped_answers[str(q_num)] = selected

        return mapped_answers

    def format_for_llm(self, mapped_answers: Dict[str, str]) -> str:
        """Formats the graded answers into a string for LLM processing."""
        if not mapped_answers:
            return ""
        
        lines = ["--- KẾT QUẢ CHẤM TRẮC NGHIỆM (YOLO DETECTED) ---"]
        # Sort keys numerically for correct order (e.g., "2" before "10")
        sorted_keys = sorted(mapped_answers.keys(), key=lambda x: int(x))
        for k in sorted_keys:
            lines.append(f"Câu {k}: {mapped_answers[k]}")
        
        return "\n".join(lines)