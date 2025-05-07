import axios from 'axios';
import { ENDPOINTS, DEFAULT_HEADERS } from '../config/api';
import { handleApiError } from '../utils/errorHandler';

// Định nghĩa các interfaces
interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
  profileImage?: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

// Tạo instance axios với cấu hình mặc định - sử dụng đường dẫn tương đối để tận dụng proxy của Vite
const api = axios.create({
  baseURL: '/api', // Đường dẫn tương đối, Vite proxy sẽ chuyển tiếp đến backend
  headers: DEFAULT_HEADERS,
});

// Interceptor để thêm token vào header của request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Service xác thực
const authService = {
  // Đăng nhập admin (sử dụng endpoint dành riêng cho admin)
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Gửi yêu cầu đăng nhập admin đến:', `/api${ENDPOINTS.AUTH}/admin/login`);
      const response = await api.post<AuthResponse>(`${ENDPOINTS.AUTH}/admin/login`, credentials);
      console.log('Kết quả đăng nhập:', response);
      return response.data;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw new Error(handleApiError(error));
    }
  },

  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>(`${ENDPOINTS.AUTH}/me`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      throw new Error(handleApiError(error));
    }
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<User>(`${ENDPOINTS.AUTH}/update-profile`, userData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật thông tin cá nhân:', error);
      throw new Error(handleApiError(error));
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<void> => {
    try {
      await api.put(`${ENDPOINTS.AUTH}/update-password`, passwordData);
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      throw new Error(handleApiError(error));
    }
  },

  // Đăng xuất (xử lý phía client)
  logout: (): void => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
  },

  // Kiểm tra xem người dùng đã đăng nhập chưa
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('admin-token');
  },

  // Lấy thông tin người dùng từ localStorage
  getUserInfo: (): User | null => {
    const userStr = localStorage.getItem('admin-user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (error) {
        return null;
      }
    }
    return null;
  },
};

export default authService;
export type { LoginCredentials, User, AuthResponse }; 