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
import SettingsPage from '@/pages/SettingsPage';

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
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Redirect to login if not authenticated */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </Router>
  );
}

export default App;
