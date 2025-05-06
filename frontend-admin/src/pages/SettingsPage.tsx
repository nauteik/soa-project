import { Save, User, Shield, Bell, Globe, Database } from 'lucide-react';
import { useState } from 'react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: <User size={18} /> },
    { id: 'security', label: 'Bảo mật', icon: <Shield size={18} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} /> },
    { id: 'site', label: 'Cài đặt trang web', icon: <Globe size={18} /> },
    { id: 'backup', label: 'Sao lưu & Phục hồi', icon: <Database size={18} /> },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Cài đặt</h1>
        <p className="text-gray-600">Quản lý tất cả cài đặt hệ thống</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="md:flex">
          {/* Sidebar */}
          <div className="md:w-64 border-r border-gray-200 bg-gray-50">
            <nav className="p-4">
              <ul className="space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-md text-left text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`mr-3 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`}>
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-medium mb-6">Thông tin cá nhân</h2>
                
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-24 h-24 relative">
                      <img 
                        src="https://randomuser.me/api/portraits/men/1.jpg" 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full">
                        <User size={16} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-base font-medium">Ảnh đại diện</h3>
                      <p className="text-sm text-gray-500">JPG, GIF hoặc PNG. Kích thước tối đa 1MB</p>
                      <button className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                        Thay đổi ảnh
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        Họ
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="Nguyễn"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Tên
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="Văn Admin"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="admin@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="0901234567"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
                      <Save size={18} className="mr-2" />
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-medium mb-6">Cài đặt bảo mật</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-4">Thay đổi mật khẩu</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          id="current-password"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          id="new-password"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          id="confirm-password"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
                      <Save size={18} className="mr-2" />
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'profile' && activeTab !== 'security' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-800">Nội dung đang được phát triển</h3>
                <p className="text-gray-500 mt-2">Chức năng này sẽ sớm được cập nhật</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage; 