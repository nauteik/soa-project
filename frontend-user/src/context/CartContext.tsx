import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import cartApi, { Cart, AddToCartPayload } from '../services/cartApi';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  error: string | null;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

// Tạo Context với giá trị mặc định
const CartContext = createContext<CartContextType>({
  cart: null,
  itemCount: 0,
  loading: false,
  error: null,
  addToCart: async () => {},
  updateCartItem: async () => {},
  removeCartItem: async () => {},
  clearCart: async () => {},
  fetchCart: async () => {},
});

// Hook tùy chỉnh để sử dụng CartContext
export const useCart = () => useContext(CartContext);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();

  // Lấy thông tin giỏ hàng khi người dùng đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Reset cart khi đăng xuất
      setCart(null);
      setItemCount(0);
    }
  }, [isAuthenticated]);

  // Lấy thông tin giỏ hàng từ API
  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const cartData = await cartApi.getCart();
      setCart(cartData);
      setItemCount(cartData.totalItems || 0);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      // Kiểm tra lỗi 401 và xử lý session hết hạn
      if (err.response?.status === 401) {
        handleAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Không thể tải giỏ hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lỗi xác thực
  const handleAuthError = (message: string) => {
    toast.error(message);
    // Tự động đăng xuất nếu token không hợp lệ hoặc hết hạn
    logout();
  };

  // Lấy số lượng sản phẩm trong giỏ hàng
  // const fetchCartCount = async () => {
  //   if (!isAuthenticated) return;
    
  //   try {
  //     const count = await cartApi.getCartItemsCount();
  //     setItemCount(count || 0);
  //   } catch (err: any) {
  //     console.error('Error fetching cart count:', err);
  //     if (err.response?.status === 401) {
  //       handleAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  //     }
  //   }
  // };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = async (payload: AddToCartPayload) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }
    
    setLoading(true);
    try {
      const updatedCart = await cartApi.addToCart(payload);
      setCart(updatedCart);
      setItemCount(updatedCart.totalItems || 0);
      
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        const errorMessage = err.response?.data?.message || 'Không thể thêm vào giỏ hàng';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateCartItem = async (cartItemId: number, quantity: number) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const updatedCart = await cartApi.updateCartItem(cartItemId, quantity);
      setCart(updatedCart);
      setItemCount(updatedCart.totalItems || 0);
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        const errorMessage = err.response?.data?.message || 'Không thể cập nhật giỏ hàng';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeCartItem = async (cartItemId: number) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const updatedCart = await cartApi.removeCartItem(cartItemId);
      setCart(updatedCart);
      setItemCount(updatedCart.totalItems || 0);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Không thể xóa sản phẩm khỏi giỏ hàng');
        toast.error('Không thể xóa sản phẩm khỏi giỏ hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xóa toàn bộ giỏ hàng
  const clearCart = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      await cartApi.clearCart();
      setCart(null);
      setItemCount(0);
      toast.success('Đã xóa giỏ hàng');
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Không thể xóa giỏ hàng');
        toast.error('Không thể xóa giỏ hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 