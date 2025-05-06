import { Search, Filter, Edit, Trash2, UserPlus, X, ArrowUp, ArrowDown, UserCog, UserCircle, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllUsers, 
  updateUserStatus, 
  updateUserRole, 
  deleteUser, 
  UserResponse 
} from '../services/userApi';

interface FilterOptions {
  status: 'all' | 'active' | 'inactive';
  role: 'all' | 'USER' | 'STAFF' | 'MANAGER';
  joinDate: 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';
  sort: 'name_asc' | 'name_desc' | 'email_asc' | 'email_desc' | 'date_asc' | 'date_desc';
}

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Lọc và sắp xếp
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    role: 'all',
    joinDate: 'all',
    sort: 'date_desc'
  });

  // Effect để tải danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Xem chi tiết người dùng
  const handleViewDetail = (id: number) => {
    navigate(`/users/${id}`);
  };

  // Chỉnh sửa người dùng
  const handleEdit = (id: number) => {
    navigate(`/users/edit/${id}`);
  };

  // Đổi trạng thái người dùng
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await updateUserStatus(id, !currentStatus);
      // Cập nhật danh sách người dùng sau khi đổi trạng thái
      setUsers(users.map(user => 
        user.id === id ? { ...user, isEnabled: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái người dùng:', error);
      alert('Không thể thay đổi trạng thái người dùng. Vui lòng thử lại sau.');
    }
  };

  // Xóa người dùng
  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      try {
        await deleteUser(id);
        // Cập nhật danh sách người dùng sau khi xóa
        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        alert('Không thể xóa người dùng. Vui lòng thử lại sau.');
      }
    }
  };

  // Đổi vai trò người dùng
  const handleChangeRole = async (id: number, newRole: 'USER' | 'STAFF' | 'MANAGER') => {
    try {
      await updateUserRole(id, newRole);
      // Cập nhật danh sách người dùng sau khi đổi vai trò
      setUsers(users.map(user => 
        user.id === id ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Lỗi khi thay đổi vai trò người dùng:', error);
      alert('Không thể thay đổi vai trò người dùng. Vui lòng thử lại sau.');
    }
  };

  // Hiển thị badge vai trò người dùng
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

  // Format ngày tham gia
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Không có";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      return "Không có";
    }
  };

  // Lọc và sắp xếp người dùng
  const getFilteredAndSortedUsers = () => {
    return users
      .filter(user => {
        // Lọc theo từ khóa tìm kiếm
        const matchesSearch = 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.mobileNumber && user.mobileNumber.includes(searchTerm));
        
        if (!matchesSearch) return false;
        
        // Lọc theo trạng thái
        if (filterOptions.status === 'active' && !user.isEnabled) return false;
        if (filterOptions.status === 'inactive' && user.isEnabled) return false;
        
        // Lọc theo vai trò
        if (filterOptions.role !== 'all' && user.role !== filterOptions.role) return false;
        
        // Lọc theo ngày tham gia
        if (filterOptions.joinDate !== 'all') {
          const userDate = new Date(user.createdAt);
          const now = new Date();
          
          switch (filterOptions.joinDate) {
            case 'today':
              if (userDate.toDateString() !== now.toDateString()) return false;
              break;
            case 'this_week':
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - now.getDay());
              if (userDate < weekStart) return false;
              break;
            case 'this_month':
              if (userDate.getMonth() !== now.getMonth() || userDate.getFullYear() !== now.getFullYear()) return false;
              break;
            case 'this_year':
              if (userDate.getFullYear() !== now.getFullYear()) return false;
              break;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sắp xếp theo tiêu chí đã chọn
        switch (filterOptions.sort) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'email_asc':
            return a.email.localeCompare(b.email);
          case 'email_desc':
            return b.email.localeCompare(a.email);
          case 'date_asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'date_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  };

  // Áp dụng phân trang cho người dùng đã lọc
  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredAndSortedUsers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const paginatedUsers = getPaginatedUsers();
  const filteredUsers = getFilteredAndSortedUsers();
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions({
      ...filterOptions,
      [key]: value
    });
  };
  
  const resetFilters = () => {
    setFilterOptions({
      status: 'all',
      role: 'all',
      joinDate: 'all',
      sort: 'date_desc'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Thêm người dùng mới
  const handleAddUser = () => {
    navigate('/users/create');
  };

  // Lấy icon cho tiêu chí sắp xếp
  const getSortIcon = (sortKey: string) => {
    if (filterOptions.sort === `${sortKey}_asc`) {
      return <ArrowUp size={16} className="ml-1" />;
    } else if (filterOptions.sort === `${sortKey}_desc`) {
      return <ArrowDown size={16} className="ml-1" />;
    }
    return null;
  };
  
  // Xử lý khi click vào tiêu đề cột để sắp xếp
  const handleSort = (sortKey: string) => {
    if (filterOptions.sort === `${sortKey}_asc`) {
      handleFilterChange('sort', `${sortKey}_desc`);
    } else {
      handleFilterChange('sort', `${sortKey}_asc`);
    }
  };

  // Lấy hình đại diện
  const getAvatar = (user: UserResponse) => {
    if (user.profileImage) {
      return (
        <img 
          className="h-10 w-10 rounded-full object-cover" 
          src={user.profileImage} 
          alt={user.name} 
        />
      );
    }
    
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
        <UserCircle size={32} />
      </div>
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý người dùng</h1>
          <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <UserPlus size={18} className="mr-2" />
          Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
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
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md text-gray-700 flex items-center hover:bg-gray-50 ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'}`}
            >
              <Filter size={18} className="mr-2" />
              Bộ lọc {showFilters ? <X size={16} className="ml-2" /> : null}
            </button>
            {(filterOptions.status !== 'all' || 
              filterOptions.role !== 'all' || 
              filterOptions.joinDate !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-red-600 flex items-center hover:bg-gray-50"
              >
                <X size={18} className="mr-2" />
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={filterOptions.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Đã khóa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select
                  value={filterOptions.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="MANAGER">Quản trị viên</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="USER">Khách hàng</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
                <select
                  value={filterOptions.joinDate}
                  onChange={(e) => handleFilterChange('joinDate', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="this_week">Tuần này</option>
                  <option value="this_month">Tháng này</option>
                  <option value="this_year">Năm nay</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Tải lại
            </button>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center focus:outline-none font-medium"
                    onClick={() => handleSort('name')}
                  >
                    Người dùng
                    {getSortIcon('name')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center focus:outline-none font-medium"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {getSortIcon('email')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center focus:outline-none font-medium"
                    onClick={() => handleSort('date')}
                  >
                    Ngày tham gia
                    {getSortIcon('date')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {getAvatar(user)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.mobileNumber || 'Chưa cập nhật'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">ID: {user.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        } cursor-pointer`}
                        onClick={() => handleToggleStatus(user.id, user.isEnabled)}
                        title={user.isEnabled ? 'Nhấn để khóa' : 'Nhấn để kích hoạt'}
                      >
                        {user.isEnabled ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetail(user.id)}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(user.id)}
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="Đổi quyền"
                          onClick={() => {
                            const newRole = user.role === 'USER' 
                              ? 'STAFF' 
                              : user.role === 'STAFF' 
                                ? 'MANAGER' 
                                : 'USER';
                            handleChangeRole(user.id, newRole as 'USER' | 'STAFF' | 'MANAGER');
                          }}
                        >
                          <UserCog size={18} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            {filteredUsers.length > 0 && (
              <>Hiển thị <span className="font-medium">{Math.min(paginatedUsers.length, itemsPerPage)}</span> trên <span className="font-medium">{filteredUsers.length}</span> người dùng</>
            )}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                &laquo;
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => {
                  // Thêm dấu ... nếu có khoảng cách giữa các nút
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <span className="px-3 py-1 rounded-md bg-gray-100">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })
              }
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                &raquo;
              </button>
            </div>
          )}

          {/* Số người dùng mỗi trang */}
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-700">Hiển thị:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default UsersPage; 