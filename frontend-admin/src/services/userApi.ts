import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { handleApiError } from '../utils/errorHandler';

// Endpoints
const USERS_ENDPOINT = `${API_BASE_URL}/users`;

// Types
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string | null;
  profileImage?: string | null;
  role: 'USER' | 'MANAGER' | 'ORDER_STAFF' | 'PRODUCT_STAFF';
  isEnabled: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AddressResponse {
  id: number;
  fullName: string;
  mobileNo: string;
  fullAddress: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  profileImage?: string;
  role: 'MANAGER' | 'ORDER_STAFF' | 'PRODUCT_STAFF';
}

// Hàm lấy header Authorization từ localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('admin-token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Lấy danh sách tất cả người dùng
 */
export const getAllUsers = async (): Promise<UserResponse[]> => {
  try {
    const response = await axios.get(USERS_ENDPOINT, {
      headers: getAuthHeader(),
    });
    console.log('API Response getAllUsers:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Lấy danh sách người dùng theo vai trò
 */
export const getUsersByRole = async (role: 'USER' | 'MANAGER' | 'ORDER_STAFF' | 'PRODUCT_STAFF'): Promise<UserResponse[]> => {
  try {
    const response = await axios.get(`${USERS_ENDPOINT}/role/${role}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching users by role ${role}:`, error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Lấy thông tin người dùng theo ID
 */
export const getUserById = async (id: number): Promise<UserResponse> => {
  try {
    const response = await axios.get(`${USERS_ENDPOINT}/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Cập nhật trạng thái người dùng
 */
export const updateUserStatus = async (id: number, enabled: boolean): Promise<UserResponse> => {
  try {
    const response = await axios.put(`${USERS_ENDPOINT}/${id}/status`, 
      { enabled }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id} status:`, error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Cập nhật vai trò của người dùng
 */
export const updateUserRole = async (id: number, role: 'USER' | 'MANAGER' | 'ORDER_STAFF' | 'PRODUCT_STAFF'): Promise<UserResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/${id}/role`, 
      { role }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id} role:`, error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Xóa người dùng
 */
export const deleteUser = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${USERS_ENDPOINT}/${id}`, {
      headers: getAuthHeader(),
    });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Tạo tài khoản nhân viên mới
 */
export const createStaffUser = async (userData: CreateStaffRequest): Promise<UserResponse> => {
  try {
    const response = await axios.post(`${USERS_ENDPOINT}/staff`, 
      userData, 
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating staff user:', error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Cập nhật thông tin người dùng
 */
export const updateUserInfo = async (id: number, userData: {
  name: string;
  mobileNumber?: string | null;
  profileImage?: string | null;
}): Promise<UserResponse> => {
  try {
    const response = await axios.put(`${USERS_ENDPOINT}/${id}`, 
      userData, 
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id} info:`, error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Lấy danh sách địa chỉ của người dùng theo ID
 */
export const getUserAddressesById = async (userId: number): Promise<AddressResponse[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/addresses/user/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching addresses for user ${userId}:`, error);
    throw new Error(handleApiError(error));
  }
}; 