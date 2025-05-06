import { useState } from 'react';
import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Eye,
  Plus,
  Edit as EditIcon,
  List,
  UserPlus
} from 'lucide-react';

// Cấu trúc dữ liệu cho các mục menu
interface MenuItem {
  icon: JSX.Element;
  title: string;
  path: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { icon: <LayoutDashboard size={20} />, title: 'Dashboard', path: '/dashboard' },
    { 
      icon: <Package size={20} />, 
      title: 'Sản phẩm', 
      path: '/products',
      isOpen: false,
      children: [
        { icon: <List size={16} />, title: 'Danh sách', path: '/products/list' },
        { icon: <Plus size={16} />, title: 'Thêm mới', path: '/products/create' },
      ]
    },
    { icon: <ShoppingCart size={20} />, title: 'Đơn hàng', path: '/orders' },
    { 
      icon: <Users size={20} />, 
      title: 'Người dùng', 
      path: '/users',
      isOpen: false,
      children: [
        { icon: <List size={16} />, title: 'Danh sách', path: '/users' },
        { icon: <UserPlus size={16} />, title: 'Thêm mới', path: '/users/create' },
      ]
    },
    { icon: <Settings size={20} />, title: 'Cài đặt', path: '/settings' },
  ]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSubmenu = (index: number) => {
    setMenuItems(menuItems.map((item, i) => {
      if (i === index && item.children) {
        return { ...item, isOpen: !item.isOpen };
      }
      return item;
    }));
  };

  // Hàm render các mục menu
  const renderMenuItems = (items: MenuItem[], isMobile = false) => {
    return items.map((item, index) => (
      <div key={index} className="space-y-0.5">
        {item.children ? (
          <>
            <button
              onClick={() => toggleSubmenu(index)}
              className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md group transition duration-150 ${item.isOpen ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              <div className="flex items-center">
                <span className="mr-3 text-gray-500 group-hover:text-blue-600">{item.icon}</span>
                {item.title}
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${item.isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {item.isOpen && (
              <div className="mt-1 mb-1">
                {item.children.map((child, childIndex) => (
                  <NavLink
                    key={childIndex}
                    to={child.path}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md group transition duration-150 ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="w-4 h-4 mr-3 flex items-center justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
                        </span>
                        {child.title}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </>
        ) : (
          <NavLink
            to={item.path}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={({ isActive }) => `flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md group transition duration-150 ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <span className="mr-3 text-gray-500 group-hover:text-blue-600">{item.icon}</span>
            {item.title}
          </NavLink>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/50" aria-hidden="true"></div>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-600">Lapstore</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {renderMenuItems(menuItems, true)}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md w-full"
              >
                <LogOut size={20} className="mr-3" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-white shadow-lg">
          <div className="flex items-center h-16 px-4  border-gray-200">
            <h2 className="text-xl font-bold text-blue-600">Lapstore</h2>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 p-4 space-y-1">
              {renderMenuItems(menuItems)}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md w-full"
              >
                <LogOut size={20} className="mr-3" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="md:hidden text-gray-500 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:flex items-center">
                    <span className="text-sm font-medium">{user?.name || 'User'}</span>
                    <ChevronDown size={16} className="ml-1 text-gray-500" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 