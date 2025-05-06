import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

// Tạo context với giá trị mặc định undefined
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Component AuthProvider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem đã đăng nhập chưa khi ứng dụng khởi động
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Nếu có token, lấy thông tin user từ localStorage trước
          const storedUser = authService.getUserInfo();
          if (storedUser) {
            setUser(storedUser);
          }
          
          try {
            // Đồng thời kiểm tra token có hợp lệ không bằng cách gọi API
            const userData = await authService.getCurrentUser();
            setUser(userData);
            // Cập nhật lại thông tin user trong localStorage
            localStorage.setItem('admin-user', JSON.stringify(userData));
          } catch (error) {
            // Nếu token không hợp lệ, đăng xuất
            authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Lỗi xác thực:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Hàm đăng nhập
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('admin-token', response.token);
      localStorage.setItem('admin-user', JSON.stringify(response.user));
      setUser(response.user);
      return response; // Trả về response để có thể xử lý thêm ở component
    } catch (error) {
      // Ném lỗi để xử lý ở component gọi hàm
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
}; 