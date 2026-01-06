# 1. Base Image: Python 3.10 Slim (Nhẹ nhất)
FROM python:3.10-slim

# 2. Tối ưu Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Cài Node.js & Thư viện hệ thống (Đã fix lỗi Debian Trixie)
# libgl1 và libglib2.0-0 cần thiết cho OpenCV chạy được
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 4. Copy file cấu hình trước (Tận dụng Docker Cache)
COPY package*.json ./
COPY ocr_llm/requirements.txt ./ocr_llm/

# --- BÍ KÍP GIẢM 8GB DUNG LƯỢNG ---

# 5. Cài PyTorch bản CPU (Chỉ ~180MB thay vì 2.5GB)
# Phải cài trước để Ultralytics không tự tải bản GPU
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 6. Cài PaddlePaddle bản CPU (Chỉ ~100MB thay vì 3GB)
# Phải cài trước để PaddleOCR không tự tải bản GPU
RUN pip install --no-cache-dir paddlepaddle==2.6.1 --index-url https://mirror.baidu.com/pypi/simple

# 7. Cài các thư viện còn lại
RUN pip install --no-cache-dir -r ocr_llm/requirements.txt

# 8. Cài Node modules
RUN npm install --production

# 9. Copy Source Code & Chạy
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]