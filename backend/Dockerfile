# 1. Chọn Base Image
FROM python:3.10-slim

# 2. Thiết lập biến môi trường
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Cài đặt Node.js và thư viện hệ thống
# LƯU Ý: Đã đổi 'libgl1-mesa-glx' thành 'libgl1' để sửa lỗi
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 4. Thiết lập thư mục làm việc
WORKDIR /app

# 5. TỐI ƯU CACHE
COPY package*.json ./
COPY ocr_llm/requirements.txt ./ocr_llm/

# 6. Cài đặt Dependencies
RUN npm install --production
RUN pip install --no-cache-dir -r ocr_llm/requirements.txt

# 7. Copy mã nguồn
COPY . .

# 8. Mở port
EXPOSE 5000

# 9. Chạy server
CMD ["node", "server.js"]