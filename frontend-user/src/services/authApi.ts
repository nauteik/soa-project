import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS } from '../config/api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

/**
 * Đăng ký người dùng mới
 */
export const register = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  const url = `${API_BASE_URL}${ENDPOINTS.AUTH}/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(registerData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Đăng ký thất bại');
  }

  return response.json();
};

/**
 * Đăng nhập người dùng
 */
export const login = async (loginData: LoginRequest): Promise<AuthResponse> => {
  const url = `${API_BASE_URL}${ENDPOINTS.AUTH}/login`;

  const response = await fetch(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(loginData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Đăng nhập thất bại');
  }

  return response.json();
};

/**
 * Lấy thông tin người dùng hiện tại
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  const url = `${API_BASE_URL}${ENDPOINTS.AUTH}/me`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Không thể lấy thông tin người dùng');
  }

  return response.json();
};

/**
 * Cập nhật thông tin hồ sơ người dùng
 */
export const updateUserProfile = async (token: string, userId: number, userData: Partial<User>): Promise<User> => {
  const url = `${API_BASE_URL}${ENDPOINTS.AUTH}/update-profile`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...DEFAULT_HEADERS,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể cập nhật thông tin');
  }

  return response.json();
};

/**
 * Cập nhật mật khẩu người dùng
 */
export const updatePassword = async (token: string, passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  const url = `${API_BASE_URL}${ENDPOINTS.AUTH}/update-password`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...DEFAULT_HEADERS,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(passwordData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể cập nhật mật khẩu');
  }
  
  // Chỉ trả về void vì endpoint trả về 204 No Content
  return;
}; 