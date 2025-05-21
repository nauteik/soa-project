import axiosInstance from '../config/axios';

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  productSlug: string;
  productPrice: number;
  productDiscount: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface Cart {
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface AddToCartPayload {
  productId: number;
  quantity: number;
}

const cartApi = {
  // Lấy thông tin giỏ hàng
  getCart: async (): Promise<Cart> => {
    const response = await axiosInstance.get('/cart');
    return response.data;
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (payload: AddToCartPayload): Promise<Cart> => {
    const response = await axiosInstance.post('/cart/add', payload);
    return response.data;
  },

  // Cập nhật số lượng sản phẩm trong giỏ
  updateCartItem: async (cartItemId: number, quantity: number): Promise<Cart> => {
    const response = await axiosInstance.put(
      `/cart/items/${cartItemId}?quantity=${quantity}`,
      {}
    );
    return response.data;
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeCartItem: async (cartItemId: number): Promise<Cart> => {
    const response = await axiosInstance.delete(
      `/cart/items/${cartItemId}`
    );
    return response.data;
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async (): Promise<void> => {
    await axiosInstance.delete('/cart/clear');
  },

  // Lấy số lượng sản phẩm trong giỏ hàng
  getCartItemsCount: async (): Promise<number> => {
    const response = await axiosInstance.get('/cart/count');
    return response.data;
  },
};

export default cartApi; 