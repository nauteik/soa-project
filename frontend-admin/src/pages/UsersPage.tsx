import { Search, Filter, Edit, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'customer';
  status: 'active' | 'inactive';
  avatar: string;
  joinDate: string;
}

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data cho người dùng
  const users: User[] = [
    { 
      id: 'USR001', 
      name: 'Nguyễn Văn Admin', 
      email: 'admin@example.com', 
      phone: '0901234567',
      role: 'admin',
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      joinDate: '01/01/2023'
    },
    { 
      id: 'USR002', 
      name: 'Trần Thị Nhân Viên', 
      email: 'staff1@example.com', 
      phone: '0912345678',
      role: 'staff',
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      joinDate: '15/02/2023'
    },
    { 
      id: 'USR003', 
      name: 'Lê Văn Nhân Viên', 
      email: 'staff2@example.com', 
      phone: '0923456789',
      role: 'staff',
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      joinDate: '21/03/2023'
    },
    { 
      id: 'USR004', 
      name: 'Phạm Thị Khách', 
      email: 'customer1@example.com', 
      phone: '0934567890',
      role: 'customer',
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      joinDate: '10/04/2023'
    },
    { 
      id: 'USR005', 
      name: 'Hoàng Văn Khách', 
      email: 'customer2@example.com', 
      phone: '0945678901',
      role: 'customer',
      status: 'inactive',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
      joinDate: '05/05/2023'
    },
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Quản trị viên</span>;
      case 'staff':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Nhân viên</span>;
      case 'customer':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Khách hàng</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý người dùng</h1>
          <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
          <UserPlus size={18} className="mr-2" />
          Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50">
              <Filter size={18} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={user.avatar} alt={user.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">{user.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.joinDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> của <span className="font-medium">5</span> người dùng
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 border border-blue-500 rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UsersPage; 