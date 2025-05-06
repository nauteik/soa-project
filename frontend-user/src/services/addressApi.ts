import axios, { AxiosError } from 'axios';
import { API_BASE_URL, DEFAULT_HEADERS, ENDPOINTS } from '../config/api';

const API_URL = API_BASE_URL;
const ADDRESSES_ENDPOINT = ENDPOINTS.ADDRESSES;

export interface Address {
  id?: number;
  fullName: string;
  mobileNo: string;
  fullAddress: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface AddressResponse {
  id: number;
  fullName: string;
  mobileNo: string;
  fullAddress: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper function để lấy auth headers
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return {
    ...DEFAULT_HEADERS,
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Lấy danh sách địa chỉ của người dùng
 */
export const getUserAddresses = async (): Promise<AddressResponse[]> => {
  try {
    const response = await axios.get(`${API_URL}${ADDRESSES_ENDPOINT}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    
    throw error;
  }
};

/**
 * Thêm địa chỉ mới
 * @param addressData Dữ liệu địa chỉ cần thêm
 */
export const addUserAddress = async (addressData: Address): Promise<AddressResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}${ADDRESSES_ENDPOINT}`,
      addressData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding user address:', error);
    throw error;
  }
};

/**
 * Cập nhật địa chỉ
 * @param addressId ID của địa chỉ cần cập nhật
 * @param addressData Dữ liệu địa chỉ mới
 */
export const updateUserAddress = async (addressId: number, addressData: Address): Promise<AddressResponse> => {
  try {
    const response = await axios.put(
      `${API_URL}${ADDRESSES_ENDPOINT}/${addressId}`,
      addressData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating user address:', error);
    throw error;
  }
};

/**
 * Xóa địa chỉ
 * @param addressId ID của địa chỉ cần xóa
 */
export const deleteUserAddress = async (addressId: number): Promise<void> => {
  try {
    await axios.delete(
      `${API_URL}${ADDRESSES_ENDPOINT}/${addressId}`,
      { headers: getAuthHeader() }
    );
  } catch (error) {
    console.error('Error deleting user address:', error);
    throw error;
  }
};

/**
 * Đặt địa chỉ làm mặc định
 * @param addressId ID của địa chỉ cần đặt làm mặc định
 */
export const setDefaultAddress = async (addressId: number): Promise<void> => {
  try {
    await axios.put(
      `${API_URL}${ADDRESSES_ENDPOINT}/${addressId}/default`,
      {},
      { headers: getAuthHeader() }
    );
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};

/**
 * Lấy địa chỉ mặc định của người dùng
 */
export const getDefaultAddress = async (): Promise<AddressResponse | null> => {
  try {
    const response = await axios.get(
      `${API_URL}${ADDRESSES_ENDPOINT}/default`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching default address:', error);
    // Trả về null nếu không có địa chỉ mặc định
    if (axios.isAxiosError(error) && (error as AxiosError).response?.status === 404) {
      return null;
    }
    throw error;
  }
}; 