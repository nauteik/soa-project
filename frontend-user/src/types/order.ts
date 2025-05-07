// Định nghĩa enum cho trạng thái đơn hàng
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

// Định nghĩa enum cho trạng thái thanh toán
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Định nghĩa enum cho phương thức thanh toán
export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO'
}

// Định nghĩa enum cho trạng thái item trong đơn hàng
export enum OrderItemStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELED = 'CANCELED'
}

// Maps cho việc hiển thị tên trạng thái
export const orderStatusDisplayNames: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xác nhận',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPING]: 'Đang giao hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.PARTIALLY_RETURNED]: 'Trả hàng một phần',
  [OrderStatus.FULLY_RETURNED]: 'Trả hàng toàn bộ',
  [OrderStatus.CANCELED]: 'Đã hủy'
};

// Maps cho màu hiển thị của trạng thái
export const orderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.SHIPPING]: 'bg-purple-100 text-purple-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.PARTIALLY_RETURNED]: 'bg-orange-100 text-orange-800',
  [OrderStatus.FULLY_RETURNED]: 'bg-orange-100 text-orange-800',
  [OrderStatus.CANCELED]: 'bg-red-100 text-red-800'
};

// Định nghĩa các interfaces
export interface OrderStatusHistory {
  id: number;
  status: OrderStatus;
  statusDisplayName: string;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  productSlug?: string;
  price: number;
  discount?: number;
  quantity: number;
  subtotal: number;
  status: OrderItemStatus;
  statusDisplayName: string;
}

export interface ShippingAddress {
  id?: number;
  fullName: string;
  mobileNo: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userName: string;
  userEmail?: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  totalAmount: number;
  status: OrderStatus;
  statusDisplayName: string;
  paymentMethod: PaymentMethod;
  paymentMethodDisplayName: string;
  paymentStatus: PaymentStatus;
  paymentStatusDisplayName: string;
  paymentTransactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: OrderStatusHistory[];
} 