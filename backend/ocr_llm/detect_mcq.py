import cv2
import numpy as np

def detect_mcq_answers(image_path, debug=False):
    """
    Heuristic detection of MCQ answers (filled bubbles) from an image block.
    Returns list of dicts: [{"question":1,"selected":"A"}, ...]
    If no confident mark detected for a question, 'selected' = '?'.
    """
    img = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)

    thr = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY_INV, blockSize=21, C=10)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
    clean = cv2.morphologyEx(thr, cv2.MORPH_OPEN, kernel, iterations=1)
    clean = cv2.morphologyEx(clean, cv2.MORPH_CLOSE, kernel, iterations=1)

    contours, _ = cv2.findContours(clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    blobs = []
    h, w = clean.shape
    min_area = max(30, (w*h) // 10000)
    max_area = (w*h) // 200
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area or area > max_area:
            continue
        M = cv2.moments(cnt)
        if M['m00'] == 0:
            continue
        cx = int(M['m10']/M['m00'])
        cy = int(M['m01']/M['m00'])
        blobs.append({"cx":cx, "cy":cy, "area":area})

    if not blobs:
        return []

    # Cluster by Y into rows
    blobs.sort(key=lambda b: b['cy'])
    rows = []
    current_row = [blobs[0]]
    for b in blobs[1:]:
        if abs(b['cy'] - current_row[-1]['cy']) <= max(15, int(h*0.02)):
            current_row.append(b)
        else:
            rows.append(current_row)
            current_row = [b]
    rows.append(current_row)

    results = []
    q_index = 1
    for row in rows:
        row_sorted = sorted(row, key=lambda x: x['cx'])
        options = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        if len(row_sorted) == 0:
            results.append({"question": q_index, "selected": "?"})
            q_index += 1
            continue

        # Chọn blob lớn nhất
        best_blob = max(row_sorted, key=lambda x: x['area'])
        # Nếu diện tích nhỏ hơn ngưỡng, coi như không chắc chắn
        if best_blob['area'] < min_area * 1.2:
            selected = '?'
        else:
            pos = row_sorted.index(best_blob)
            selected = options[pos] if pos < len(options) else options[-1]

        results.append({
            "question": q_index,
            "selected": selected,
            "cx": best_blob['cx'],
            "cy": best_blob['cy'],
            "area": best_blob['area']
        })
        q_index += 1

    if debug:
        dbg = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        for r in results:
            cx, cy = int(r['cx']), int(r['cy'])
            cv2.circle(dbg, (cx, cy), 12, (0,0,255), 2)
            cv2.putText(dbg, r['selected'], (cx-10, cy-18), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        cv2.imwrite(image_path.replace(".jpg","_mcq_dbg.jpg"), dbg)

    return results
