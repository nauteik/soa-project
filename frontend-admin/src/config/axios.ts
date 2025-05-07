import axios from 'axios';
import { DEFAULT_HEADERS } from './api';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: '/api', // Đường dẫn tương đối, Vite proxy sẽ chuyển tiếp đến backend
  headers: DEFAULT_HEADERS,
});

// Interceptor để thêm token vào header của request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý response
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 - Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 