# 1. Chọn Base Image Python (Để hỗ trợ tốt nhất cho OpenCV và AI)
FROM python:3.10-slim

# 2. Thiết lập biến môi trường để tối ưu Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Cài đặt Node.js và các thư viện hệ thống cần thiết cho OpenCV (GL libraries)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 4. Thiết lập thư mục làm việc
WORKDIR /app

# --- BƯỚC TỐI ƯU CACHE (Quan trọng) ---
# Copy package.json trước để cài Node modules
COPY package*.json ./

# Tạo thư mục ocr_llm và chỉ copy file requirements.txt vào trước
# Mục đích: Nếu bạn chỉ sửa code mà không sửa thư viện, Docker sẽ bỏ qua bước pip install lâu lắc này
COPY ocr_llm/requirements.txt ./ocr_llm/

# 5. Cài đặt Dependencies
RUN npm install --production
RUN pip install --no-cache-dir -r ocr_llm/requirements.txt

# 6. Copy toàn bộ mã nguồn còn lại vào sau cùng
COPY . .

# 7. Mở port (Railway sẽ tự map, nhưng khai báo cho chuẩn)
EXPOSE 5000

# 8. Chạy server (File của bạn là server.js theo hình ảnh)
CMD ["node", "server.js"]