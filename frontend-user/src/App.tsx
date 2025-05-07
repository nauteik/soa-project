import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductDetail from './pages/ProductDetail';
import MainLayout from './components/layout/MainLayout';
// import CategoryProducts from './pages/CategoryProducts';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyAccountPage from './pages/VerifyAccountPage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/common/PrivateRoute';
import { Toaster } from 'sonner'

// Layout và các trang cá nhân của người dùng
import UserLayout from './components/layout/UserLayout';
import ProfilePage from './pages/user/ProfilePage';
import ChangePasswordPage from './pages/user/ChangePasswordPage';
import AddressPage from './pages/user/AddressPage';
import OrdersPage from './pages/user/OrdersPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/:categorySlug/:productSlug" element={<ProductDetail />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              {/* <Route path="/category/:slug" element={<CategoryProducts />} /> */}
              <Route path="/:categorySlug" element={<ProductPage />} />
              <Route path="/category/:slug" element={<ProductPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-account" element={<VerifyAccountPage />} />
              <Route path="/cart" element={<CartPage />} />
              
              {/* Định tuyến cho checkout và đơn hàng */}
              <Route path="/checkout" element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              } />
              <Route path="/order-success/:orderNumber" element={
                <PrivateRoute>
                  <OrderSuccessPage />
                </PrivateRoute>
              } />
              
              {/* Định tuyến cho trang cá nhân người dùng */}
              <Route path="/user" element={
                <PrivateRoute>
                  <UserLayout />
                </PrivateRoute>
              }>
                <Route index element={<ProfilePage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
                <Route path="address" element={<AddressPage />} />
                <Route path="orders" element={<OrdersPage />} />
              </Route>
              
              {/* Add more routes as needed */}
            </Routes>
          </MainLayout>
          <Toaster richColors position="top-right" expand={true} duration={2000} closeButton={true} />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
