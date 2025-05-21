import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import OrdersPage from '@/pages/OrdersPage';
import UsersPage from '@/pages/UsersPage';
import ReportsPage from '@/pages/ReportsPage';

// Các trang mới cho sản phẩm
import ProductDetailPage from '@/pages/product/ProductDetailPage';
import ProductCreatePage from '@/pages/product/ProductCreatePage';
import ProductEditPage from '@/pages/product/ProductEditPage';

// Các trang cho danh mục
import CategoriesPage from '@/pages/CategoriesPage'; 
import CategoryDetailPage from '@/pages/category/CategoryDetailPage';
import CategoryCreatePage from '@/pages/category/CategoryCreatePage';
import CategoryEditPage from '@/pages/category/CategoryEditPage';

// Các trang mới cho người dùng
import UserDetailPage from '@/pages/UserDetailPage';
import CreateUserPage from '@/pages/CreateUserPage';
import EditUserPage from '@/pages/EditUserPage';

// Trang xử lý đơn hàng
import ProcessOrderPage from '@/pages/ProcessOrderPage';

function App() {
  // Protected Route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      // Đang tải, có thể hiển thị loading spinner
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  // Chuyển hướng nếu đã đăng nhập
  const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (isAuthenticated) {
      // Nếu đã đăng nhập, chuyển hướng về trang dashboard
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  };

  const AppRoutes = () => {
    return (
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          } 
        />

        {/* Protected Routes with Admin Layout */}
        <Route element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Routes sản phẩm */}
          <Route path="/products" element={<Navigate to="/products/list" replace />} />
          <Route path="/products/list" element={<ProductsPage />} />
          <Route path="/products/create" element={<ProductCreatePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/edit/:id" element={<ProductEditPage />} />
          
          {/* Routes danh mục */}
          <Route path="/categories" element={<Navigate to="/categories/list" replace />} />
          <Route path="/categories/list" element={<CategoriesPage />} />
          <Route path="/categories/create" element={<CategoryCreatePage />} />
          <Route path="/categories/:id" element={<CategoryDetailPage />} />
          <Route path="/categories/edit/:id" element={<CategoryEditPage />} />
          
          {/* Routes người dùng */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/create" element={<CreateUserPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/users/edit/:id" element={<EditUserPage />} />
          
          {/* Routes đơn hàng */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/process/:id" element={<ProcessOrderPage />} />
          
          {/* Route báo cáo */}
          <Route path="/reports" element={<ReportsPage />} />
          
        </Route>

        {/* Redirect to login if not authenticated */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  };

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
