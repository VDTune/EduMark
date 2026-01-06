# 1. Base Image
FROM python:3.10-slim

# 2. Env vars
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. System deps (Đã fix lỗi libgl1)
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

# 4. Copy config
COPY package*.json ./
COPY ocr_llm/requirements.txt ./ocr_llm/

# 5. Cài PyTorch CPU (Giữ nguyên dòng này để giảm dung lượng)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 6. Cài PaddlePaddle CPU (ĐÃ SỬA: Bỏ mirror Baidu)
RUN pip install --no-cache-dir paddlepaddle==3.3.2

# 7. Cài các thư viện còn lại
RUN pip install --no-cache-dir -r ocr_llm/requirements.txt

# 8. Cài Node modules
RUN npm install --production

# 9. Copy code & Run
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]