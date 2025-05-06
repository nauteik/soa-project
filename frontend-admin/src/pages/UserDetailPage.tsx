import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, UserCog } from 'lucide-react';
import { getUserById, deleteUser, updateUserStatus, updateUserRole, UserResponse } from '../services/userApi';

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const data = await getUserById(Number(id));
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/users/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      try {
        await deleteUser(Number(id));
        console.log('Đã xóa người dùng thành công');
        navigate('/users');
      } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        alert('Không thể xóa người dùng. Vui lòng thử lại sau.');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      const newStatus = !user.isEnabled;
      const message = newStatus 
        ? 'Bạn có chắc chắn muốn kích hoạt người dùng này?' 
        : 'Bạn có chắc chắn muốn vô hiệu hóa người dùng này?';
      
      if (window.confirm(message)) {
        const updatedUser = await updateUserStatus(user.id, newStatus);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái người dùng:', error);
      alert('Không thể thay đổi trạng thái người dùng. Vui lòng thử lại sau.');
    }
  };

  const handleChangeRole = async () => {
    if (!user) return;
    
    try {
      const newRole = user.role === 'USER' 
        ? 'STAFF' 
        : user.role === 'STAFF' 
          ? 'MANAGER' 
          : 'USER';
      
      const roleLabels = {
        USER: 'Khách hàng',
        STAFF: 'Nhân viên',
        MANAGER: 'Quản trị viên'
      };
      
      if (window.confirm(`Bạn có chắc chắn muốn đổi vai trò của người dùng này thành ${roleLabels[newRole]}?`)) {
        const updatedUser = await updateUserRole(user.id, newRole as 'USER' | 'STAFF' | 'MANAGER');
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi vai trò người dùng:', error);
      alert('Không thể thay đổi vai trò người dùng. Vui lòng thử lại sau.');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Không có";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return "Không có";
    }
  };

  // Lấy label vai trò
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Quản trị viên</span>;
      case 'STAFF':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Nhân viên</span>;
      case 'USER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Khách hàng</span>;
      default:
        return null;
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
            onClick={() => navigate('/users')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit size={16} className="mr-1.5" />
            Chỉnh sửa
          </button>
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              user.isEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {user.isEnabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 size={16} className="mr-1.5" />
            Xóa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin cơ bản</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {user.profileImage ? (
                  <img 
                    className="h-20 w-20 rounded-full object-cover border border-gray-200" 
                    src={user.profileImage} 
                    alt={user.name} 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Vai trò</p>
                <div className="mt-1 flex items-center">
                  {getRoleBadge(user.role)}
                  <button 
                    onClick={handleChangeRole}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    title="Đổi vai trò"
                  >
                    <UserCog size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Họ tên</p>
              <p className="mt-1 text-sm text-gray-900">{user.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
              <p className="mt-1 text-sm text-gray-900">{user.mobileNumber || 'Chưa cập nhật'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Trạng thái</p>
              <p className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isEnabled ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thời gian</h2>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2">
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
              <div className="grid grid-cols-2">
                <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                <p className="text-sm">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailPage; 