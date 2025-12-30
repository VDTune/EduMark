import os
import requests
import tempfile
import cv2
import re
from typing import List, Dict, Any
from ultralytics import YOLO
import numpy as np

# Đường dẫn model (Sửa nếu cần)
MODEL_ABCD_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'Model_ABCD.pt')
MODEL_STRUCT_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'cauhoi_circle.pt')

MAP_ABCD = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }
MAP_STRUCT = { 0: 'cau_hoi', 1: 'circle' }
CONF_ABCD = 0.25
CONF_STRUCT = 0.25

class MCQGrader:
    def __init__(self):
        self.model_abcd = YOLO(MODEL_ABCD_PATH) if os.path.exists(MODEL_ABCD_PATH) else None
        self.model_struct = YOLO(MODEL_STRUCT_PATH) if os.path.exists(MODEL_STRUCT_PATH) else None

    @staticmethod
    def center(b): return ((b[0]+b[2])//2, (b[1]+b[3])//2)

    @staticmethod
    def iou_area(a,b):
        x1,y1 = max(a[0],b[0]),max(a[1],b[1])
        x2,y2 = min(a[2],b[2]),min(a[3],b[3])
        if x2<x1 or y2<y1: return 0
        return (x2-x1)*(y2-y1)

    def process_image(self, image_url: str, save_debug: bool = False) -> Dict[str, Any]:
        """Xử lý ảnh từ URL: Tải về file tạm -> YOLO -> Xóa file"""
        if not self.model_abcd or not self.model_struct: return {}

        temp_path = None
        results_map = {}

        try:
            # 1. Tải về file tạm (YOLO cần file path hoặc numpy array)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                resp = requests.get(image_url, stream=True, timeout=20)
                for chunk in resp.iter_content(8192): tmp.write(chunk)
                temp_path = tmp.name

            # 2. YOLO Predict từ file tạm
            res_abcd = self.model_abcd.predict(temp_path, imgsz=1024, conf=CONF_ABCD, verbose=False)[0]
            res_struct = self.model_struct.predict(temp_path, imgsz=1024, conf=CONF_STRUCT, verbose=False)[0]

            # 3. Parse Kết quả YOLO (Logic cũ giữ nguyên)
            options, circles = [], []
            for x1, y1, x2, y2, score, cls in res_abcd.boxes.data.tolist():
                cls = int(cls)
                if cls in MAP_ABCD:
                    b = [int(x1), int(y1), int(x2), int(y2)]
                    options.append({ "bbox": b, "center": self.center(b), "label": MAP_ABCD[cls], "selected": False })

            for x1, y1, x2, y2, score, cls in res_struct.boxes.data.tolist():
                cls = int(cls)
                if MAP_STRUCT.get(cls) == "circle":
                    b = [int(x1), int(y1), int(x2), int(y2)]
                    circles.append({ "bbox": b, "center": self.center(b), "mapped": False })

            # 4. Logic Mapping (Giữ nguyên logic cũ của bạn)
            for c in circles:
                best_opt, best_area = None, 0
                for o in options:
                    area = self.iou_area(c["bbox"], o["bbox"])
                    if area > best_area: best_area, best_opt = area, o
                if best_opt and best_area > 0.1 * ((best_opt["bbox"][2]-best_opt["bbox"][0])*(best_opt["bbox"][3]-best_opt["bbox"][1])):
                    best_opt["selected"] = True

            circles.sort(key=lambda c: c["center"][1])
            rows = []
            if circles:
                avg_h = np.mean([c["bbox"][3]-c["bbox"][1] for c in circles])
                for c in circles:
                    placed = False
                    for r in rows:
                        if abs(r[0]["center"][1]-c["center"][1]) < avg_h * 1.4:
                            r.append(c); placed=True; break
                    if not placed: rows.append([c])

            for q_idx, row in enumerate(rows, start=1):
                row_opts = []
                for c in row:
                    for o in options:
                        if o["selected"] and self.iou_area(o["bbox"], c["bbox"]) > 0: row_opts.append(o)
                row_opts.sort(key=lambda o: o["center"][0])
                detected = [o["label"] for o in row_opts]
                
                FULL = ["A","B","C","D"]
                if len(detected) < 4:
                     xs = sorted([c["center"][0] for c in row])
                     for i in range(len(detected), min(len(xs), 4)):
                        row_opts.append({"label": FULL[i], "selected": True})

                answers = [o["label"] for o in row_opts if o["selected"]]
                final, status = (answers[0], "ok") if len(answers)==1 else (answers if len(answers)>1 else None, "multiple" if len(answers)>1 else "blank")
                results_map[str(q_idx)] = { "answer": final, "status": status }

        except Exception as e:
            print(f"MCQ Error: {e}")
        finally:
            # 5. Xóa file tạm
            if temp_path and os.path.exists(temp_path):
                try: os.remove(temp_path)
                except: pass
        
        return results_map

    def format_for_llm(self, mapped_answers: Dict[str, str]) -> str:
        if not mapped_answers: return ""
        lines = ["--- KẾT QUẢ CHẤM TRẮC NGHIỆM (YOLO DETECTED) ---"]
        for k in sorted(mapped_answers.keys(), key=int):
            info = mapped_answers[k]
            ans_str = ",".join(info['answer']) if isinstance(info['answer'], list) else str(info['answer'])
            lines.append(f"Câu {k}: {ans_str} ({info['status']})")
        return "\n".join(lines)