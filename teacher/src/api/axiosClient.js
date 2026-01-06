import axios from 'axios';

// Tự động lấy link Railway khi lên mạng, hoặc dùng localhost khi chạy ở nhà
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;