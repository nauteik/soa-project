import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import * as authApi from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Kiểm tra xem có token đã lưu trong localStorage không
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        if (storedToken && storedUser) {
          // Kiểm tra token hợp lệ bằng cách gọi API
          const currentUser = await authApi.getCurrentUser(storedToken);
          setToken(storedToken);
          setUser(currentUser);
        }
      } catch (err) {
        // Nếu token không hợp lệ, xóa dữ liệu khỏi localStorage
        console.error('Token không hợp lệ:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  const saveAuthData = (authData: AuthResponse) => {
    setUser(authData.user);
    setToken(authData.token);
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('auth_user', JSON.stringify(authData.user));
  };
  
  const login = async (data: LoginRequest) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      saveAuthData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (data: RegisterRequest) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      saveAuthData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };
  
  const updateProfile = async (userData: Partial<User>) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!user || !token) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      const updatedUser = await authApi.updateUserProfile(token, user.id, userData);
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thông tin thất bại');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!token) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      await authApi.updatePassword(token, { currentPassword, newPassword });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 