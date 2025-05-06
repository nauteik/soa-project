import axiosInstance from "../config/axios";

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressDetail: string;
}

export interface Order {
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalItems: number;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "COD" | "VNPAY" | "MOMO";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  cartItemIds: number[];
  shippingAddressId: number;
  paymentMethod: "COD" | "VNPAY" | "MOMO";
  note?: string;
}

export interface PaymentResponse {
  paymentUrl?: string;
  orderNumber: string;
  success: boolean;
}

const orderApi = {
  // Lấy danh sách đơn hàng của người dùng
  getUserOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get("/orders");
    return response.data;
  },

  // Lấy chi tiết đơn hàng bằng số đơn hàng
  getOrderDetail: async (orderNumber: string): Promise<Order> => {
    const response = await axiosInstance.get(`/orders/number/${orderNumber}`);
    return response.data;
  },

  // Tạo đơn hàng mới
  createOrder: async (orderData: CreateOrderRequest): Promise<PaymentResponse> => {
    const response = await axiosInstance.post("/orders", orderData);
    return response.data;
  },

  // Hủy đơn hàng
  cancelOrder: async (orderNumber: string): Promise<Order> => {
    const response = await axiosInstance.put(`/orders/number/${orderNumber}/cancel`);
    return response.data;
  },
};

export default orderApi; 