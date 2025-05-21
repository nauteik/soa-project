import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import PrivateRoute from './components/common/PrivateRoute';
import MainLayout from './components/layout/MainLayout';
import UserLayout from './components/layout/UserLayout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProductDetail from './pages/ProductDetail';
import ProductPage from './pages/ProductPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SearchPage from './pages/SearchPage';
import AddressPage from './pages/user/AddressPage';
import ChangePasswordPage from './pages/user/ChangePasswordPage';
import OrdersPage from './pages/user/OrdersPage';
import ProfilePage from './pages/user/ProfilePage';
import VerifyAccountPage from './pages/VerifyAccountPage';

// import CategoryProducts from './pages/CategoryProducts';
// Layout và các trang cá nhân của người dùng
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
              <Route path="/search" element={<SearchPage />} />
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
