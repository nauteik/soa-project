import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UserLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Kiểm tra path hiện tại để active tab tương ứng
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-xl font-semibold mb-4">Bạn chưa đăng nhập</h1>
          <p>Vui lòng đăng nhập để xem thông tin tài khoản.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b">
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold">Hồ Sơ Của Tôi</h1>
            <p className="text-sm text-gray-500">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Tab Navigation */}
          <div className="w-full md:w-1/4 border-r">
            <div className="py-4">
              <Link
                to="/user/profile"
                className={`w-full px-6 py-3 text-left font-medium block ${
                  isActive('/user/profile') ? 'text-primary bg-blue-50' : 'text-gray-600'
                }`}
              >
                Thông tin tài khoản
              </Link>
              <Link
                to="/user/change-password"
                className={`w-full px-6 py-3 text-left font-medium block ${
                  isActive('/user/change-password') ? 'text-primary bg-blue-50' : 'text-gray-600'
                }`}
              >
                Đổi mật khẩu
              </Link>
              <Link
                to="/user/address"
                className={`w-full px-6 py-3 text-left font-medium block ${
                  isActive('/user/address') ? 'text-primary bg-blue-50' : 'text-gray-600'
                }`}
              >
                Địa chỉ của tôi
              </Link>
              <Link
                to="/user/orders"
                className={`w-full px-6 py-3 text-left font-medium block ${
                  isActive('/user/orders') ? 'text-primary bg-blue-50' : 'text-gray-600'
                }`}
              >
                Đơn hàng của tôi
              </Link>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="w-full md:w-3/4 p-6">
            {/* Container có chiều cao cố định và scroll */}
            <div className="min-h-[600px] overflow-y-auto p-1.5">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout; 