import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { getUserById, updateUserInfo, UserResponse } from '../services/userApi';

interface UserUpdateRequest {
  name: string;
  mobileNumber?: string | null;
  profileImage?: string | null;
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
    profileImage: '',
  });

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
          profileImage: data.profileImage || '',
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        alert('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Sử dụng API updateUserInfo
      const updated = await updateUserInfo(Number(id), formData);
      setUser(updated);
      
      alert('Cập nhật thông tin thành công!');
      navigate(`/users/${id}`);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      if (error.response?.data?.message) {
        alert(`Lỗi: ${error.response.data.message}`);
      } else {
        alert('Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại.');
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
                  className={`mt-1 block w-full border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                  Đường dẫn hình ảnh
                </label>
                <input
                  type="text"
                  name="profileImage"
                  id="profileImage"
                  value={formData.profileImage || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nhập URL hình ảnh từ internet. Hệ thống hiện chưa hỗ trợ tải lên hình ảnh trực tiếp.
                </p>
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Vai trò
                </label>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'MANAGER' 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.role === 'STAFF' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'MANAGER' 
                      ? 'Quản trị viên' 
                      : user.role === 'STAFF' 
                        ? 'Nhân viên' 
                        : 'Khách hàng'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">(Thay đổi vai trò ở trang chi tiết)</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Trạng thái
                </label>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isEnabled ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">(Thay đổi trạng thái ở trang chi tiết)</span>
                </div>
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