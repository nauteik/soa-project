import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from './api';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Thêm token vào header nếu có
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi xác thực 401
    if (error.response && error.response.status === 401) {
      // Nếu có lỗi 401 (Unauthorized), có thể xử lý đăng xuất hoặc chuyển hướng
      const errorMessage = error.response.data?.message || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      
      // Kiểm tra nếu chưa ở trang đăng nhập, thì thông báo và xử lý đăng xuất
      if (!window.location.pathname.includes('/login')) {
        toast.error(errorMessage);
        
        // Xóa token và user data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Chuyển hướng đến trang đăng nhập
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    
    // Xử lý lỗi chung
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.message || 'Đã xảy ra lỗi';
      if (error.response.status !== 401) { // Không hiển thị thông báo 401 vì đã xử lý ở trên
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // Yêu cầu đã được tạo nhưng không nhận được phản hồi
      toast.error('Không thể kết nối đến máy chủ, vui lòng thử lại sau');
    } else {
      // Có lỗi khi thiết lập yêu cầu
      toast.error('Đã xảy ra lỗi, vui lòng thử lại sau');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 