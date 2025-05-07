import { API_BASE_URL } from '../config/api';
import { handleApiError } from '../utils/errorHandler';

export interface OrderItemDTO {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  productSlug: string;
  price: number;
  discount: number;
  quantity: number;
  subtotal: number;
}

export interface AddressDto {
  id: number;
  fullName: string;
  mobileNo: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface OrderStatusHistoryDTO {
  id: number;
  status: string;
  statusDisplayName: string;
  notes?: string;
  createdAt: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  shippingAddress?: AddressDto;
  totalAmount: number;
  status: string;
  statusDisplayName: string;
  paymentMethod: string;
  paymentMethodDisplayName: string;
  paymentStatus: string;
  paymentStatusDisplayName: string;
  paymentTransactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
  statusHistory?: OrderStatusHistoryDTO[];
}

// Hàm helper để tạo request
const createRequest = (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin-token');
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  // Đảm bảo API_BASE_URL không thêm / ở cuối và endpoint bắt đầu bằng /
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    ...options,
    headers
  }).then(response => {
    if (response.status === 401) {
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin-user');
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response.json();
  }).catch(error => {
    // Xử lý lỗi fetch
    console.error('API Error:', error);
    throw new Error(handleApiError(error));
  });
};

// Lấy danh sách đơn hàng của người dùng (dành cho admin)
export const getUserOrders = async (userId: number): Promise<OrderResponse[]> => {
  try {
    return createRequest(`/admin/users/${userId}/orders`);
  } catch (error) {
    console.error(`Lỗi lấy đơn hàng của người dùng ${userId}:`, error);
    throw new Error(handleApiError(error));
  }
};

// Lấy chi tiết đơn hàng (dành cho admin)
export const getOrderById = async (orderId: number): Promise<OrderResponse> => {
  try {
    return createRequest(`/admin/orders/${orderId}`);
  } catch (error) {
    console.error(`Lỗi lấy chi tiết đơn hàng ${orderId}:`, error);
    throw new Error(handleApiError(error));
  }
};

