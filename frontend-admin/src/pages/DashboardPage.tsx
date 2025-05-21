import { API_BASE_URL } from '@/config/api';
import { formatCurrency } from '@/utils/formatter';
import axios from 'axios';
import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/statistics/dashboard`);
      setDashboardData(response.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard');
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p className="font-medium">Lỗi khi tải dữ liệu</p>
        <p>{error}</p>
      </div>
    );
  }

  // Lấy dữ liệu từ backend
  const { totalRevenue, totalOrders, newOrders, totalUsers, newUsers, totalProducts, latestOrders } = dashboardData || {};

  const stats = [
    { 
      title: 'Tổng doanh thu', 
      value: formatCurrency(totalRevenue), 
      icon: DollarSign, 
      change: `+${newOrders} mới`, 
      color: 'bg-green-500 text-white',
      bgColor: 'bg-green-50', 
      iconColor: 'text-green-500' 
    },
    { 
      title: 'Đơn hàng', 
      value: totalOrders, 
      icon: ShoppingCart, 
      change: `+${newOrders} mới`, 
      color: 'bg-blue-500 text-white',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500' 
    },
    { 
      title: 'Người dùng', 
      value: totalUsers, 
      icon: Users, 
      change: `+${newUsers} mới`, 
      color: 'bg-purple-500 text-white',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500' 
    },
    { 
      title: 'Sản phẩm', 
      value: totalProducts, 
      icon: Package, 
      change: '', 
      color: 'bg-orange-500 text-white',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500' 
    },
  ];

  // Định dạng dữ liệu đơn hàng để hiển thị
  const formattedOrders = latestOrders?.map((order: any) => ({
    id: `#${order.orderNumber || order.id}`,
    customer: order.user?.name || 'Không có tên',
    date: new Date(order.createdAt).toLocaleDateString('vi-VN'),
    amount: formatCurrency(order.totalAmount),
    status: order.status
  })) || [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'SHIPPING': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      case 'PARTIALLY_RETURNED': return 'bg-yellow-100 text-yellow-800';
      case 'FULLY_RETURNED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPING': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'CANCELED': return 'Đã hủy';
      case 'PARTIALLY_RETURNED': return 'Trả hàng một phần';
      case 'FULLY_RETURNED': return 'Trả hàng toàn bộ';
      default: return status;
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Chào mừng trở lại, {user?.name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-lg shadow-sm p-6 ${stat.bgColor} border border-gray-100`}>
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-full ${stat.color} mr-3`}>
                {React.createElement(stat.icon, { size: 20 })}
              </div>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
            </div>
            <h3 className="text-2xl font-bold mt-1 text-gray-800">{stat.value}</h3>
            {stat.change && (
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp size={14} className="mr-1" />
                <span className="text-xs font-medium">{stat.change}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
            <Link to="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</Link>
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
                {formattedOrders.map((order: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order.amount}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                        {getStatusName(order.status)}
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
          
          <div className="space-y-4">
            <Link 
              to="/products"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-blue-500 rounded-lg mr-4 text-white group-hover:bg-blue-600 transition-colors">
                <Package size={18} />
              </div>
              <div>
                <h3 className="font-medium">Quản lý sản phẩm</h3>
                <p className="text-sm text-gray-500">Thêm, sửa, xóa sản phẩm</p>
              </div>
            </Link>
            
            <Link 
              to="/orders"
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-purple-500 rounded-lg mr-4 text-white group-hover:bg-purple-600 transition-colors">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h3 className="font-medium">Quản lý đơn hàng</h3>
                <p className="text-sm text-gray-500">Cập nhật trạng thái đơn hàng</p>
              </div>
            </Link>
            
            <Link 
              to="/users"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-green-500 rounded-lg mr-4 text-white group-hover:bg-green-600 transition-colors">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-medium">Quản lý người dùng</h3>
                <p className="text-sm text-gray-500">Phân quyền, quản lý tài khoản</p>
              </div>
            </Link>

            <Link 
              to="/reports"
              className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-orange-500 rounded-lg mr-4 text-white group-hover:bg-orange-600 transition-colors">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="font-medium">Báo cáo & Thống kê</h3>
                <p className="text-sm text-gray-500">Xem báo cáo doanh thu</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage; 