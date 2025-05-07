import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/constants';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Kiểm tra token có hợp lệ không khi component được mount
    const validateToken = async () => {
      if (!token) {
        setError('Token không hợp lệ.');
        setIsCheckingToken(false);
        return;
      }

      try {
        await axios.get(`${API_URL}/api/auth/validate-reset-token?token=${token}`);
        setIsValidToken(true);
      } catch (err) {
        setError('Token không hợp lệ hoặc đã hết hạn.');
      } finally {
        setIsCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword,
        confirmPassword
      });
      setSuccess(true);
      
      // Chuyển hướng về trang đăng nhập sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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

  if (isCheckingToken) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p>Đang kiểm tra token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Đặt lại mật khẩu</h1>
        
        {!isValidToken && !success ? (
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || 'Token không hợp lệ hoặc đã hết hạn.'}
            </div>
            <p className="mt-4">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Yêu cầu đặt lại mật khẩu mới
              </Link>
            </p>
          </div>
        ) : success ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Đặt lại mật khẩu thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây.
            </div>
            <p className="mt-4">
              <Link to="/login" className="text-primary hover:underline">
                Đến trang đăng nhập ngay
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập mật khẩu mới"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng.
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập lại mật khẩu mới"
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
              {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 