import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, LaptopIcon, Loader2, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

// Schema xác thực form đăng nhập
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Xóa thông báo lỗi cũ nếu có
      setErrorMessage(null);
      
      // Gọi API đăng nhập
      const response = await login(data.email, data.password);
      
      // Kiểm tra kết quả đăng nhập thành công
      if (response && response.token && response.user) {
        toast.success('Đăng nhập thành công');
        navigate('/dashboard');
      } else {
        // Trường hợp hiếm gặp: đăng nhập thành công nhưng không có dữ liệu
        setErrorMessage('Đã xảy ra lỗi khi lấy thông tin người dùng');
        toast.error('Đăng nhập thất bại');
      }
    } catch (error: any) {
      // Xử lý các loại lỗi khác nhau
      let message = 'Đăng nhập thất bại';
      
      if (error.response) {
        // Lỗi từ server với response
        if (error.response.status === 400 || error.response.status === 401) {
          message = error.response.data?.message || 'Email hoặc mật khẩu không chính xác';
          
          // Đặt lỗi cho trường cụ thể
          if (message.toLowerCase().includes('email')) {
            setError('email', { type: 'manual', message });
          } else if (message.toLowerCase().includes('mật khẩu')) {
            setError('password', { type: 'manual', message });
          } else {
            // Lỗi chung
            setErrorMessage(message);
          }
        } else if (error.response.status === 500) {
          message = 'Lỗi hệ thống, vui lòng thử lại sau';
          setErrorMessage(message);
        } else {
          message = error.response.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
          setErrorMessage(message);
        }
      } else if (error.request) {
        // Đã gửi request nhưng không nhận được response
        message = 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
        setErrorMessage(message);
      } else {
        // Lỗi khác
        message = error.message || 'Đã xảy ra lỗi không xác định';
        setErrorMessage(message);
      }
      
      toast.error(message);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center mb-4 shadow-md">
              <LaptopIcon size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-blue-600">Admin Portal</h1>
            <p className="text-gray-500 mt-1">Hệ thống quản lý bán laptop</p>
          </div>
          
          <div className="w-full h-px bg-gray-200 my-6"></div>
          
          {/* Hiển thị thông báo lỗi chung */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircleIcon size={20} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className={cn(
                    "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.email ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="your@email.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.password ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="******"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOffIcon size={20} />
                  ) : (
                    <EyeIcon size={20} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Đang xử lý...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} Hệ thống quản lý bán laptop
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 