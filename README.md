# MERN Shop

Dự án **MERN Shop** là một ứng dụng thương mại điện tử cơ bản được xây dựng bằng **MongoDB, Express, React, Node.js**.  
Ngoài ra dự án có phần quản trị (admin) và các hợp đồng thông minh (contracts).

## Cấu trúc thư mục
- `admin/` : giao diện quản trị hệ thống  
- `backend/` : API server (Express + MongoDB)  
- `contracts/` : các file hợp đồng thông minh (Solidity)  
- `frontend/` : giao diện người dùng (React)  
- `node_modules/` : thư viện phụ thuộc Node.js  

## Yêu cầu hệ thống
- Node.js >= 16  
- MongoDB (cục bộ hoặc Atlas)  
- npm hoặc yarn  

## Cài đặt và chạy dự án

1. Clone repo:
   ```bash
   git clone https://github.com/VDTune/MERN_Shop.git
   cd MERN_Shop

2. Cài đặt dependencies cho toàn dự án:
npm install

3. Chạy backend:
cd backend
npm install
npm run start

4. Chạy frontend:
cd frontend
npm install
npm run start

5. (Tùy chọn) Chạy admin:
cd admin
npm install
npm start

Công nghệ sử dụng
- MongoDB: cơ sở dữ liệu NoSQL
- Express.js: backend API
- React.js: frontend UI
- Node.js: server runtime

Tác giả: Võ Đức Tuân