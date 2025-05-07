import { API_BASE_URL } from '../config/api';
import { OrderResponse } from './orderApi';
import { handleApiError } from '../utils/errorHandler';

// Hàm helper để tạo request
const createRequest = (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin-token');
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

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
    console.error('API Error:', error);
    throw new Error(handleApiError(error));
  });
};

// Lấy tất cả đơn hàng (dành cho admin)
export const getAllOrders = async (): Promise<OrderResponse[]> => {
  try {
    return createRequest('/admin/orders');
  } catch (error) {
    console.error('Lỗi lấy tất cả đơn hàng:', error);
    throw new Error(handleApiError(error));
  }
};

// Lấy chi tiết đơn hàng (dành cho admin)
export const getOrderByIdForAdmin = async (orderId: number): Promise<OrderResponse> => {
  try {
    return createRequest(`/admin/orders/${orderId}`);
  } catch (error) {
    console.error(`Lỗi lấy chi tiết đơn hàng ${orderId}:`, error);
    throw new Error(handleApiError(error));
  }
};

// Lấy danh sách đơn hàng của người dùng cụ thể (dành cho admin)
export const getUserOrdersForAdmin = async (userId: number): Promise<OrderResponse[]> => {
  try {
    return createRequest(`/admin/users/${userId}/orders`);
  } catch (error) {
    console.error(`Lỗi lấy đơn hàng của người dùng ${userId}:`, error);
    throw new Error(handleApiError(error));
  }
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (
  orderId: number, 
  status: string, 
  notes?: string
): Promise<OrderResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    if (notes) {
      queryParams.append('notes', notes);
    }
    
    return createRequest(`/admin/orders/${orderId}/status?${queryParams.toString()}`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error(`Lỗi cập nhật trạng thái đơn hàng ${orderId}:`, error);
    throw new Error(handleApiError(error));
  }
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (
  orderId: number, 
  status: string, 
  transactionId?: string
): Promise<OrderResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    if (transactionId) {
      queryParams.append('transactionId', transactionId);
    }
    
    return createRequest(`/admin/orders/${orderId}/payment-status?${queryParams.toString()}`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error(`Lỗi cập nhật trạng thái thanh toán đơn hàng ${orderId}:`, error);
    throw new Error(handleApiError(error));
  }
};

// Cập nhật trạng thái của một mục đơn hàng
export const updateOrderItemStatus = async (
  orderId: number, 
  itemId: number, 
  status: string
): Promise<OrderResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    
    return createRequest(`/admin/orders/${orderId}/items/${itemId}/status?${queryParams.toString()}`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error(`Lỗi cập nhật trạng thái mục đơn hàng ${orderId}, mục ${itemId}:`, error);
    throw new Error(handleApiError(error));
  }
};

// Enum cho OrderStatus (tương ứng với backend)
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
  FULLY_RETURNED = 'FULLY_RETURNED',
  CANCELED = 'CANCELED'
}

// Tên hiển thị tiếng Việt cho OrderStatus
export const orderStatusDisplayNames: Record<string, string> = {
  [OrderStatus.PENDING]: 'Chờ xác nhận',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPING]: 'Đang giao hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.PARTIALLY_RETURNED]: 'Đã trả hàng một phần',
  [OrderStatus.FULLY_RETURNED]: 'Đã trả hàng toàn bộ',
  [OrderStatus.CANCELED]: 'Đã hủy'
};

// Enum cho PaymentStatus (tương ứng với backend)
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  COD_PENDING = 'COD_PENDING'
}

// Tên hiển thị tiếng Việt cho PaymentStatus
export const paymentStatusDisplayNames: Record<string, string> = {
  [PaymentStatus.PENDING]: 'Chờ thanh toán',
  [PaymentStatus.PAID]: 'Đã thanh toán',
  [PaymentStatus.FAILED]: 'Thanh toán thất bại',
  [PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
  [PaymentStatus.COD_PENDING]: 'Chờ thanh toán COD'
};

// Enum cho OrderItemStatus (tương ứng với backend)
export enum OrderItemStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELED = 'CANCELED'
}

// Tên hiển thị tiếng Việt cho OrderItemStatus
export const orderItemStatusDisplayNames: Record<string, string> = {
  [OrderItemStatus.PENDING]: 'Chờ xác nhận',
  [OrderItemStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderItemStatus.PROCESSING]: 'Đang xử lý',
  [OrderItemStatus.SHIPPING]: 'Đang giao hàng',
  [OrderItemStatus.DELIVERED]: 'Đã giao hàng',
  [OrderItemStatus.RETURNED]: 'Đã trả hàng',
  [OrderItemStatus.CANCELED]: 'Đã hủy'
};

// Lấy màu badge dựa trên trạng thái đơn hàng
export const getOrderStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [OrderStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.SHIPPING]: 'bg-purple-100 text-purple-800',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
    [OrderStatus.PARTIALLY_RETURNED]: 'bg-orange-100 text-orange-800',
    [OrderStatus.FULLY_RETURNED]: 'bg-red-100 text-red-800',
    [OrderStatus.CANCELED]: 'bg-gray-100 text-gray-800'
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

// Lấy màu badge dựa trên trạng thái thanh toán
export const getPaymentStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
    [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
    [PaymentStatus.COD_PENDING]: 'bg-blue-100 text-blue-800'
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

// Format số tiền
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(price)
    .replace(/\s/g, '');
};

// Format ngày tháng
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit' 
  }).format(date);
}; 