import os
import re
from typing import List, Dict, Any, Tuple

import cv2
from ultralytics import YOLO
import numpy as np

MODEL_ABCD_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'ABCD_start.pt')
MODEL_STRUCT_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'cauhoi_circle.pt')

MAP_ABCD = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D', 
    4: 'objects'
}

# Ví dụ: Model Structure (0:cau_hoi, 1:circle) - Hãy sửa lại nếu model bạn train khác
MAP_STRUCT = {
    0: 'cau_hoi',
    1: 'circle'
}
CONF_ABCD = 0.15
CONF_STRUCT = 0.25

class MCQGrader:
    def __init__(self):
        self.model_abcd = None
        self.model_struct = None
        if os.path.exists(MODEL_ABCD_PATH) and os.path.exists(MODEL_STRUCT_PATH):
            print(f"✅ Loading YOLO model from: {MODEL_ABCD_PATH} and {MODEL_STRUCT_PATH}")
            self.model_abcd = YOLO(MODEL_ABCD_PATH) 
            self.model_struct = YOLO(MODEL_STRUCT_PATH)
        else:
            print(f"⚠️ Warning: Model file not found at {MODEL_ABCD_PATH} or {MODEL_STRUCT_PATH}. Please check the path.")

    @staticmethod
    def center(b):
        return ((b[0]+b[2])//2, (b[1]+b[3])//2)

    @staticmethod
    def iou_area(a,b):
        x1,y1 = max(a[0],b[0]),max(a[1],b[1])
        x2,y2 = min(a[2],b[2]),min(a[3],b[3])
        if x2<x1 or y2<y1: return 0
        return (x2-x1)*(y2-y1)

    def process_image(self, image_path: str, save_debug: bool = False) -> Dict[str, Any]:
        img = cv2.imread(image_path)
        if img is None:
            return {}

        h, w = img.shape[:2]

        # ==================== PREDICT ====================
        res_abcd = self.model_abcd.predict(
            image_path, imgsz=1024, conf=CONF_ABCD, verbose=False
        )[0]

        res_struct = self.model_struct.predict(
            image_path, imgsz=1024, conf=CONF_STRUCT, verbose=False
        )[0]

        options, circles, questions = [], [], []
        mcq_start_y = None

        # ==================== PARSE ====================
        for x1, y1, x2, y2, score, cls in res_abcd.boxes.data.tolist():
            cls = int(cls)
            b = [int(x1),int(y1),int(x2),int(y2)]

            if MAP_ABCD.get(cls) == 'objects':   # TRẮC NGHIỆM
                y_obj = self.center(b)[1]
                if mcq_start_y is None or y_obj > mcq_start_y:
                    mcq_start_y = y_obj
                continue

            if cls in [0,1,2,3]:
                options.append({
                    'bbox':b,'center':self.center(b),
                    'label':MAP_ABCD[cls],
                    'selected':False,'source':'real'
                })

        for x1, y1, x2, y2, score, cls in res_struct.boxes.data.tolist():
            b=[int(x1),int(y1),int(x2),int(y2)]
            if MAP_STRUCT[int(cls)]=='circle':
                circles.append({'bbox':b,'center':self.center(b),'mapped':False})
            else:
                questions.append({'bbox':b,'center':self.center(b)})

        if mcq_start_y is None:
            if circles:
                mcq_start_y = min(c['center'][1] for c in circles)
                print("⚠️ Object miss → fallback dùng circle")
            elif questions:
                mcq_start_y = min(q['center'][1] for q in questions)
                print("⚠️ Object + circle miss → fallback dùng cau_hoi")
            else:
                mcq_start_y = 0
                print("❌ Không detect được object / circle / cau_hoi")
        
        circles = [c for c in circles if c['center'][1] >= mcq_start_y]

        # =====================================================
        # STEP 1 — MAP CIRCLE ↔ OPTION (MAX IOU)
        # =====================================================
        for c in circles:
            best_opt, best_area = None, 0
            for o in options:
                area = self.iou_area(c["bbox"], o["bbox"])
                if area > best_area:
                    best_area = area
                    best_opt = o

            if best_opt and best_area > 0.1 * (
                (best_opt["bbox"][2] - best_opt["bbox"][0]) *
                (best_opt["bbox"][3] - best_opt["bbox"][1])
            ):
                best_opt["selected"] = True
                c["mapped"] = True

        # =====================================================
        # STEP 2 — GROUP CIRCLES BY ROW (CORE FIX)
        # =====================================================
        circles.sort(key=lambda c: c["center"][1])
        avg_h = np.mean(
            [c["bbox"][3] - c["bbox"][1] for c in circles]
        ) if circles else 80

        ROW_TH = avg_h * 1.4
        rows: List[List[dict]] = []

        for c in circles:
            placed = False
            for r in rows:
                if abs(r[0]["center"][1] - c["center"][1]) < ROW_TH:
                    r.append(c)
                    placed = True
                    break
            if not placed:
                rows.append([c])

        # =====================================================
        # STEP 3 — ANSWER INFERENCE PER ROW
        # =====================================================
        results = {}

        for q_idx, row in enumerate(rows, start=1):

            row_opts = []
            for c in row:
                for o in options:
                    if o["selected"] and self.iou_area(o["bbox"], c["bbox"]) > 0:
                        row_opts.append(o)

            row_opts.sort(key=lambda o: o["center"][0])
            detected_labels = [o["label"] for o in row_opts]

            # ---- Infer missing A/B/C/D if needed ----
            FULL = ["A", "B", "C", "D"]
            if len(detected_labels) < 4:
                xs = sorted([c["center"][0] for c in row])
                for i in range(len(detected_labels), min(len(xs), 4)):
                    row_opts.append({
                        "label": FULL[i],
                        "selected": True,
                        "source": "virtual"
                    })

            answers = [o["label"] for o in row_opts if o["selected"]]

            if not answers:
                final, status = None, "blank"
            elif len(answers) == 1:
                final, status = answers[0], "ok"
            else:
                final, status = answers, "multiple"

            results[str(q_idx)] = {
                "answer": final,
                "status": status
            }

            # Debug text
            cv2.putText(
                img, str(final) if final else "_",
                (row[0]["bbox"][0], row[0]["bbox"][1] - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 120, 0), 2
            )

        # ==================== SAVE DEBUG ====================
        if save_debug:
            out = image_path.replace(".jpg", "_debug.jpg").replace(".png", "_debug.png")
            cv2.imwrite(out, img)

        return results

    def format_for_llm(self, mapped_answers: Dict[str, str]) -> str:
        """Formats the graded answers into a string for LLM processing."""
        if not mapped_answers:
            return ""
        
        lines = ["--- KẾT QUẢ CHẤM TRẮC NGHIỆM (YOLO DETECTED) ---"]
        # Sort keys numerically for correct order (e.g., "2" before "10")
        for k in sorted(mapped_answers.keys(), key=int):
            info = mapped_answers[k]
            ans_str = ",".join(info['answer']) if isinstance(info['answer'], list) else info['answer']
            lines.append(f"Câu {k}: {ans_str} ({info['status']})")

        return "\n".join(lines)