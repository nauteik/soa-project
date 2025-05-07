import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { createStaffUser, CreateStaffRequest } from '../services/userApi';
import { z } from 'zod';
import { toast } from 'sonner';

// Định nghĩa schema validation với Zod
const userSchema = z.object({
  name: z.string()
    .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
    .max(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
    .regex(/^[A-Za-zÀ-ỹ\s]+$/, { message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' }),
  email: z.string()
    .min(1, { message: 'Email là bắt buộc' })
    .email({ message: 'Email không hợp lệ' }),
  password: z.string()
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  mobileNumber: z.string()
    .refine(val => !val || /(0|\+84)[35789][0-9]{8}$/.test(val), {
      message: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 hoặc +84 và có 10 số.'
    }).optional().nullable(),
  role: z.enum(['ORDER_STAFF', 'PRODUCT_STAFF', 'MANAGER'])
});

const CreateUserPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateStaffRequest>({
    name: '',
    email: '',
    password: '',
    mobileNumber: '',
    role: 'ORDER_STAFF'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Xóa lỗi khi người dùng sửa trường
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      // Xác thực dữ liệu bằng Zod
      userSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Chuyển các lỗi Zod thành định dạng của chúng ta
        error.errors.forEach((err) => {
          if (err.path) {
            const fieldName = err.path[0].toString();
            newErrors[fieldName] = err.message;
          }
        });
      } else {
        console.error('Lỗi không xác định:', error);
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const user = await createStaffUser(formData);
      toast.success('Tạo tài khoản thành công!');
      navigate(`/users/${user.id}`);
    } catch (error: any) {
      console.error('Lỗi khi tạo tài khoản:', error);
      if (error.response?.data?.message) {
        toast.error(`Lỗi: ${error.response.data.message}`);
      } else {
        toast.error('Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/users')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Tạo tài khoản mới</h1>
            <p className="text-gray-600">Thêm nhân viên mới</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X size={16} className="mr-1.5" />
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-1.5" />
            {isSubmitting ? 'Đang xử lý...' : 'Lưu tài khoản'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin cơ bản</h2>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>
            
            {/* Thông tin bổ sung */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin bổ sung</h2>
              </div>
              
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  id="mobileNumber"
                  value={formData.mobileNumber || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${errors.mobileNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                  placeholder=""
                />
                {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>}
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ORDER_STAFF">Nhân viên xử lý đơn hàng</option>
                  <option value="PRODUCT_STAFF">Nhân viên quản lý sản phẩm</option>
                  <option value="MANAGER">Quản lý</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Trường bắt buộc
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateUserPage; 