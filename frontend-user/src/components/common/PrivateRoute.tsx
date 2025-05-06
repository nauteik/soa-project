import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Hiển thị loading trong khi kiểm tra xác thực
  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, hiển thị nội dung bảo vệ
  return <>{children}</>;
};

export default PrivateRoute; 