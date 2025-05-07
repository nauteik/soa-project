import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Shield } from 'lucide-react';
import { getUserById, updateUserInfo, updateUserRole, updateUserStatus, UserResponse } from '../services/userApi';
import { IMAGES_BASE_URL } from '../config/api';
import { z } from 'zod';
import { toast } from 'sonner';

// Định nghĩa schema validation với Zod
const userSchema = z.object({
  name: z.string()
    .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
    .max(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
    .regex(/^[A-Za-zÀ-ỹ\s]+$/, { message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' }),
  mobileNumber: z.string()
    .refine(val => !val || /(0|\+84)[35789][0-9]{8}$/.test(val), {
      message: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 hoặc +84 và có 10 số.'
    }).optional().nullable()
});

interface UserUpdateRequest {
  name: string;
  mobileNumber?: string | null;
}

const EditUserPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  
  const [formData, setFormData] = useState<UserUpdateRequest>({
    name: '',
    mobileNumber: '',
  });

  const [role, setRole] = useState<'USER' | 'ORDER_STAFF' | 'PRODUCT_STAFF' | 'MANAGER'>('USER');
  const [isEnabled, setIsEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tải thông tin người dùng khi trang được tải
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const data = await getUserById(Number(id));
        setUser(data);
        
        // Khởi tạo formData với dữ liệu người dùng
        setFormData({
          name: data.name || '',
          mobileNumber: data.mobileNumber || '',
        });
        setRole(data.role);
        setIsEnabled(data.isEnabled);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as 'USER' | 'ORDER_STAFF' | 'PRODUCT_STAFF' | 'MANAGER');
  };

  const handleStatusChange = () => {
    setIsEnabled(!isEnabled);
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
      // Cập nhật thông tin cơ bản, giữ nguyên profileImage
      let updatedUser = await updateUserInfo(
        Number(id), 
        {
          ...formData,
          profileImage: user?.profileImage // Giữ nguyên hình ảnh hiện tại
        }
      );
      
      // Cập nhật vai trò nếu đã thay đổi
      if (user && user.role !== role) {
        updatedUser = await updateUserRole(Number(id), role);
      }
      
      // Cập nhật trạng thái nếu đã thay đổi
      if (user && user.isEnabled !== isEnabled) {
        updatedUser = await updateUserStatus(Number(id), isEnabled);
      }
      
      setUser(updatedUser);
      
      toast.success('Cập nhật thông tin thành công!');
      // navigate(`/users/${id}`);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      if (error.response?.data?.message) {
        toast.error(`Lỗi: ${error.response.data.message}`);
      } else {
        toast.error('Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy người dùng</h2>
          <p className="text-gray-600 mb-4">Người dùng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button 
            onClick={() => navigate('/users')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Quay lại danh sách người dùng
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/users/${id}`)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Chỉnh sửa người dùng</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/users/${id}`)}
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
            {isSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}
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
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm py-2 px-3 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex items-center">
                  <select
                    id="role"
                    value={role}
                    onChange={handleRoleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USER">Khách hàng</option>
                    <option value="ORDER_STAFF">Nhân viên xử lý đơn hàng</option>
                    <option value="PRODUCT_STAFF">Nhân viên quản lý sản phẩm</option>
                    <option value="MANAGER">Quản lý</option>
                  </select>
                  <div className="ml-2">
                    <Shield size={20} className="text-blue-500" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Lưu ý: Phân quyền sẽ ảnh hưởng đến các chức năng người dùng có thể truy cập
                </p>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Trạng thái
                </label>
                <div className="mt-1 flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={handleStatusChange}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-700">
                      {isEnabled ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {isEnabled 
                    ? 'Tài khoản đang hoạt động bình thường' 
                    : 'Tài khoản bị khóa sẽ không thể đăng nhập'}
                </p>
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
                  placeholder="Ví dụ: 0912345678"
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
                )}
               
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hình ảnh đại diện
                </label>
                {user.profileImage ? (
                  <div className="mt-2 flex items-center space-x-3">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-gray-200">
                      <img 
                        src={`${IMAGES_BASE_URL}${user.profileImage}`} 
                        alt={user.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      Hình ảnh đại diện hiện tại<br />
                      <span className="italic text-xs">Không thể thay đổi tại đây</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500 italic">Người dùng chưa có hình đại diện</p>
                )}
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Ngày tạo: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </p>
                {user.updatedAt && (
                  <p className="text-sm text-gray-500">
                    Cập nhật lần cuối: {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
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

export default EditUserPage; 