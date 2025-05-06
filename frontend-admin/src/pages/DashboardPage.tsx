import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, ShoppingCart, Package, DollarSign, Zap } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();

  const stats = [
    { title: 'Tổng doanh thu', value: '120,000,000đ', icon: <DollarSign className="text-green-500" size={24} />, change: '+12%', color: 'bg-green-100 text-green-800' },
    { title: 'Đơn hàng mới', value: '32', icon: <ShoppingCart className="text-blue-500" size={24} />, change: '+8%', color: 'bg-blue-100 text-blue-800' },
    { title: 'Người dùng mới', value: '48', icon: <Users className="text-purple-500" size={24} />, change: '+24%', color: 'bg-purple-100 text-purple-800' },
    { title: 'Sản phẩm', value: '120', icon: <Package className="text-orange-500" size={24} />, change: '+6', color: 'bg-orange-100 text-orange-800' },
  ];

  const recentOrders = [
    { id: '#ORD-123', customer: 'Nguyễn Văn A', date: '15/07/2023', amount: '1,200,000đ', status: 'Hoàn thành' },
    { id: '#ORD-124', customer: 'Trần Thị B', date: '14/07/2023', amount: '2,500,000đ', status: 'Đang giao' },
    { id: '#ORD-125', customer: 'Lê Văn C', date: '14/07/2023', amount: '850,000đ', status: 'Chờ xác nhận' },
    { id: '#ORD-126', customer: 'Phạm Thị D', date: '13/07/2023', amount: '3,200,000đ', status: 'Hoàn thành' },
    { id: '#ORD-127', customer: 'Hoàng Văn E', date: '12/07/2023', amount: '1,650,000đ', status: 'Hủy' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Chào mừng trở lại, {user?.name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${stat.color}`}>
                  <TrendingUp size={12} className="mr-1" />
                  {stat.change}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
            <a href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order.amount}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 
                          order.status === 'Đang giao' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick access */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Truy cập nhanh</h2>
          
          <div className="space-y-3">
            <a 
              href="/products"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Quản lý sản phẩm</h3>
                <p className="text-sm text-gray-500">Thêm, sửa, xóa sản phẩm</p>
              </div>
            </a>
            
            <a 
              href="/orders"
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <ShoppingCart size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Quản lý đơn hàng</h3>
                <p className="text-sm text-gray-500">Cập nhật trạng thái đơn hàng</p>
              </div>
            </a>
            
            <a 
              href="/users"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Users size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Quản lý người dùng</h3>
                <p className="text-sm text-gray-500">Phân quyền, quản lý tài khoản</p>
              </div>
            </a>

            <a 
              href="/reports"
              className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <Zap size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Báo cáo & Thống kê</h3>
                <p className="text-sm text-gray-500">Xem báo cáo doanh thu</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage; 