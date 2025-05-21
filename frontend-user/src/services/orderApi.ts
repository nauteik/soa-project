import axiosInstance from '../config/axios';
import { Order, PaymentMethod } from '../types/order';

export interface CreateOrderRequest {
  cartItemIds: number[];
  shippingAddressId: number;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface PaymentResponse {
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
    const response = await axiosInstance.post(`/orders/number/${orderNumber}/cancel`);
    return response.data;
  },
};

export default orderApi; 