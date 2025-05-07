import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/constants';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Quên mật khẩu</h1>
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
            </div>
            <p className="mt-4">
              <Link to="/login" className="text-primary hover:underline">
                Quay lại trang đăng nhập
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-4 text-gray-600">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một đường link để đặt lại mật khẩu.
            </p>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập email của bạn"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition duration-200 disabled:opacity-70"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu đặt lại mật khẩu'}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-primary hover:underline">
                  Quay lại trang đăng nhập
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 