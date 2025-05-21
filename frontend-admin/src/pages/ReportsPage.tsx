import { API_BASE_URL } from '@/config/api';
import { formatCurrency, formatDate } from '@/utils/formatter';
import axios from 'axios';
import {
  BanknoteIcon,
  Calendar,
  ChevronDown,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('doanh-thu');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [dateFilterLabel, setDateFilterLabel] = useState('Tùy chỉnh');

  useEffect(() => {
    fetchData();
  }, [activeTab, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = '';
      let queryParams = '';
      
      if (startDate && endDate) {
        queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      switch (activeTab) {
        case 'doanh-thu':
          url = `${API_BASE_URL}/admin/statistics/revenue${queryParams}`;
          const revenueData = await axios.get(url);
          setRevenueStats(revenueData.data.data);
          break;
        case 'san-pham':
          url = `${API_BASE_URL}/admin/statistics/products`;
          const productData = await axios.get(url);
          setProductStats(productData.data.data);
          break;
        case 'nguoi-dung':
          url = `${API_BASE_URL}/admin/statistics/users${queryParams}`;
          const userData = await axios.get(url);
          setUserStats(userData.data.data);
          break;
        case 'don-hang':
          url = `${API_BASE_URL}/admin/statistics/orders${queryParams}`;
          const orderData = await axios.get(url);
          setOrderStats(orderData.data.data);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tạo các ngày cho mốc thời gian
  const getDateRangeByType = (type: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (type) {
      case 'today':
        // Hôm nay (giữ nguyên ngày)
        setDateFilterLabel('Hôm nay');
        break;
      case 'week':
        // Tuần này (từ Chủ nhật trước đến hôm nay)
        start.setDate(today.getDate() - today.getDay());
        setDateFilterLabel('Tuần này');
        break;
      case 'month':
        // Tháng này (từ ngày 1 đến ngày hiện tại)
        start.setDate(1);
        setDateFilterLabel('Tháng này');
        break;
      case 'quarter':
        // Quý này
        const currentMonth = today.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        setDateFilterLabel('Quý này');
        break;
      case 'year':
        // Năm nay
        start = new Date(today.getFullYear(), 0, 1);
        setDateFilterLabel('Năm nay');
        break;
      case 'custom':
        // Giữ nguyên và cho phép người dùng tùy chỉnh
        setDateFilterLabel('Tùy chỉnh');
        return;
    }
    
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setShowDateOptions(false);
  };

  // Chuyển đổi định dạng ngày cho input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Xử lý thay đổi ngày
  const handleDateChange = () => {
    fetchData();
  };

  // Hiển thị nội dung tab theo loại báo cáo được chọn
  const renderTabContent = () => {
    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
    
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    switch (activeTab) {
      case 'doanh-thu':
        return renderRevenueTab();
      case 'san-pham':
        return renderProductTab();
      case 'nguoi-dung':
        return renderUserTab();
      case 'don-hang':
        return renderOrderTab();
      default:
        return null;
    }
  };

  // Hiển thị tab doanh thu
  const renderRevenueTab = () => {
    if (!revenueStats) return null;

    const { totalRevenue, dailyRevenue, revenueByPaymentMethod, ordersByStatus } = revenueStats;
    
    // Chuyển đổi dữ liệu cho biểu đồ
    const chartData = Object.entries(dailyRevenue || {}).map(([date, amount]) => ({
      date: formatDate(date),
      amount: Number(amount)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Chuyển đổi dữ liệu phương thức thanh toán
    const paymentMethodData = Object.entries(revenueByPaymentMethod || {}).map(([method, amount]) => ({
      method,
      amount: Number(amount)
    }));
    
    // Chuyển đổi dữ liệu trạng thái đơn hàng
    const orderStatusData = Object.entries(ordersByStatus || {}).map(([status, count]) => ({
      status,
      count: Number(count)
    }));

    return (
      <div className="space-y-6">
        {/* Thống kê tổng quan */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2 text-blue-100">Tổng doanh thu</h2>
          <div className="flex items-baseline mb-4">
            <span className="text-4xl font-bold">{formatCurrency(totalRevenue)}</span>
            <span className="ml-4 px-2 py-1 bg-green-500 rounded-full text-xs font-medium flex items-center">
              <TrendingUp size={12} className="mr-1" />
              +12% so với tháng trước
            </span>
          </div>
          <p className="text-sm text-blue-100 opacity-75">Doanh thu được tính trên các đơn hàng đã hoàn thành</p>
        </div>
        
        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Đơn hàng</p>
                <h3 className="text-2xl font-bold mt-1">{orderStatusData.reduce((sum, item) => sum + item.count, 0)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
                <ShoppingBag size={22} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Đã giao</p>
                <h3 className="text-2xl font-bold mt-1">
                  {orderStatusData.find(item => item.status === 'DELIVERED')?.count || 0}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-green-500">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Đang xử lý</p>
                <h3 className="text-2xl font-bold mt-1">
                  {(orderStatusData.find(item => item.status === 'PROCESSING')?.count || 0) + 
                   (orderStatusData.find(item => item.status === 'SHIPPING')?.count || 0)}
                </h3>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-yellow-500">
                <Package size={22} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Đã huỷ</p>
                <h3 className="text-2xl font-bold mt-1">
                  {orderStatusData.find(item => item.status === 'CANCELED')?.count || 0}
                </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-red-500">
                <TrendingDown size={22} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Biểu đồ doanh thu theo ngày */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Doanh thu theo ngày</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              <Download size={14} className="mr-1" />
              Xuất báo cáo
            </button>
          </div>
          <div className="h-80 w-full">
            {/* Placeholder cho biểu đồ - thêm hiệu ứng gradient */}
            <div className="relative h-full">
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-50 to-transparent opacity-50 z-0"></div>
              <div className="flex items-end justify-between h-full w-full border-b border-l relative z-10">
                {chartData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center group" style={{ width: `${100 / chartData.length}%` }}>
                    <div className="relative">
                      <div 
                        className="bg-gradient-to-t from-blue-400 to-blue-600 w-10 mx-auto rounded-t-lg transition-all duration-200 group-hover:from-blue-500 group-hover:to-blue-700" 
                        style={{ height: `${(Number(item.amount) / Math.max(...chartData.map(d => Number(d.amount)))) * 200}px` }}
                      ></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs transition-opacity duration-200">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                    <div className="text-xs mt-2 text-gray-600 font-medium">{item.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thống kê theo phương thức thanh toán */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Phân bổ phương thức thanh toán</h2>
            <div className="overflow-hidden">
              <div className="space-y-4">
                {paymentMethodData.map((item, index) => {
                  const percentage = ((Number(item.amount) / Number(totalRevenue)) * 100).toFixed(1);
                  const getMethodColor = (method: string) => {
                    switch (method) {
                      case 'CREDIT_CARD': return { bg: 'bg-blue-500', text: 'text-blue-500' };
                      case 'BANK_TRANSFER': return { bg: 'bg-green-500', text: 'text-green-500' };
                      case 'CASH_ON_DELIVERY': return { bg: 'bg-yellow-500', text: 'text-yellow-500' };
                      default: return { bg: 'bg-gray-500', text: 'text-gray-500' };
                    }
                  };
                  
                  const methodColor = getMethodColor(item.method);
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${methodColor.bg.replace('bg-', 'bg-opacity-10')} ${methodColor.text}`}>
                            {item.method === 'CREDIT_CARD' ? (
                              <CreditCard size={18} />
                            ) : (
                              <BanknoteIcon size={18} />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {item.method === 'CREDIT_CARD' ? 'Thẻ tín dụng' : 
                             item.method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 
                             item.method === 'CASH_ON_DELIVERY' ? 'Tiền mặt (COD)' : item.method}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${methodColor.bg} h-2 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Thống kê đơn hàng theo trạng thái */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">Đơn hàng theo trạng thái</h2>
            <div className="grid grid-cols-2 gap-4">
              {orderStatusData.map((item, index) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
                    case 'PROCESSING': return 'bg-purple-100 text-purple-800 border-purple-200';
                    case 'SHIPPING': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                    case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
                    case 'PARTIALLY_RETURNED': return 'bg-orange-100 text-orange-800 border-orange-200';
                    case 'FULLY_RETURNED': return 'bg-red-100 text-red-800 border-red-200';
                    case 'CANCELED': return 'bg-gray-100 text-gray-800 border-gray-200';
                    default: return 'bg-gray-100 text-gray-800 border-gray-200';
                  }
                };
                
                const getStatusName = (status: string) => {
                  switch (status) {
                    case 'PENDING': return 'Chờ xác nhận';
                    case 'CONFIRMED': return 'Đã xác nhận';
                    case 'PROCESSING': return 'Đang xử lý';
                    case 'SHIPPING': return 'Đang giao hàng';
                    case 'DELIVERED': return 'Đã giao hàng';
                    case 'PARTIALLY_RETURNED': return 'Trả hàng một phần';
                    case 'FULLY_RETURNED': return 'Trả hàng toàn bộ';
                    case 'CANCELED': return 'Đã hủy';
                    default: return status;
                  }
                };
                
                return (
                  <div key={index} className={`p-4 rounded-xl border ${getStatusColor(item.status)}`}>
                    <div className="text-3xl font-bold">{item.count}</div>
                    <div className="text-sm mt-1 font-medium">
                      {getStatusName(item.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị tab sản phẩm
  const renderProductTab = () => {
    if (!productStats) return null;

    const { totalProducts, productsByCategory, productsByBrand, bestSellingProducts, lowStockProducts } = productStats;

    // Chuyển đổi dữ liệu sản phẩm theo danh mục
    const categoryData = Object.entries(productsByCategory || {}).map(([category, count]) => ({
      category,
      count: Number(count)
    })).sort((a, b) => b.count - a.count);

    // Chuyển đổi dữ liệu sản phẩm theo thương hiệu
    const brandData = Object.entries(productsByBrand || {}).map(([brand, count]) => ({
      brand,
      count: Number(count)
    })).sort((a, b) => b.count - a.count);

    return (
      <div className="space-y-6">
        {/* Thống kê tổng quan */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-xl p-6 shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2 text-orange-100">Tổng số sản phẩm</h2>
          <div className="flex items-baseline mb-4">
            <span className="text-4xl font-bold">{totalProducts}</span>
            <span className="ml-4 px-2 py-1 bg-orange-400 bg-opacity-30 rounded-full text-xs font-medium">
              Trên hệ thống
            </span>
          </div>
          <p className="text-sm text-orange-100 opacity-75">Sản phẩm đang được kinh doanh và quản lý</p>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Danh mục</p>
                <h3 className="text-2xl font-bold mt-1">{categoryData.length}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-purple-500">
                <Package size={22} />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="font-medium text-purple-600">{categoryData[0]?.category}</span> là danh mục nhiều nhất
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Thương hiệu</p>
                <h3 className="text-2xl font-bold mt-1">{brandData.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
                <ShoppingBag size={22} />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="font-medium text-blue-600">{brandData[0]?.brand}</span> là thương hiệu nhiều nhất
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Hết hàng</p>
                <h3 className="text-2xl font-bold mt-1">
                  {lowStockProducts?.filter((p: any) => p.quantityInStock === 0).length || 0}
                </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-red-500">
                <TrendingDown size={22} />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="font-medium text-red-600">{lowStockProducts?.length || 0}</span> sản phẩm cần nhập thêm
            </div>
          </div>
        </div>

        {/* Sản phẩm theo danh mục và thương hiệu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sản phẩm theo danh mục */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <Package size={18} className="mr-2 text-purple-500" />
              Sản phẩm theo danh mục
            </h2>
            <div className="overflow-y-auto max-h-96">
              <div className="space-y-4">
                {categoryData.slice(0, 10).map((item, index) => {
                  const percentage = Math.round((item.count / totalProducts) * 100);
                  // Generate a color based on the index
                  const colors = [
                    'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
                    'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500'
                  ];
                  const bgColor = colors[index % colors.length];
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${bgColor} mr-3`}></div>
                          <span className="text-sm font-medium truncate max-w-[200px]" title={item.category}>
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{item.count}</span>
                          <span className="text-xs text-gray-500">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${bgColor} h-2 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {categoryData.length > 10 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    +{categoryData.length - 10} danh mục khác
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sản phẩm theo thương hiệu */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <ShoppingBag size={18} className="mr-2 text-blue-500" />
              Sản phẩm theo thương hiệu
            </h2>
            <div className="overflow-y-auto max-h-96">
              <div className="space-y-4">
                {brandData.slice(0, 10).map((item, index) => {
                  const percentage = Math.round((item.count / totalProducts) * 100);
                  // Generate a color based on the index using a different palette
                  const colors = [
                    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
                    'bg-pink-500', 'bg-rose-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500'
                  ];
                  const bgColor = colors[index % colors.length];
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${bgColor} mr-3`}></div>
                          <span className="text-sm font-medium truncate max-w-[200px]" title={item.brand}>
                            {item.brand}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{item.count}</span>
                          <span className="text-xs text-gray-500">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${bgColor} h-2 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {brandData.length > 10 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    +{brandData.length - 10} thương hiệu khác
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top sản phẩm bán chạy */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <TrendingUp size={18} className="mr-2 text-green-500" />
              Sản phẩm bán chạy nhất
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              <Download size={14} className="mr-1" />
              Xuất báo cáo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Giá
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Đã bán
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tồn kho
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bestSellingProducts?.map((product: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                          {index + 1}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {product.quantitySold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${product.quantityInStock < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {product.quantityInStock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sản phẩm sắp hết hàng */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <TrendingDown size={18} className="mr-2 text-red-500" />
              Sản phẩm tồn kho thấp
            </h2>
            <button className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Giá
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Đã bán
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tồn kho
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts?.map((product: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {product.quantitySold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-red-600">
                        {product.quantityInStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.quantityInStock === 0 
                          ? 'bg-red-100 text-red-800' 
                          : product.quantityInStock < 5 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.quantityInStock === 0 ? 'Hết hàng' : 'Sắp hết'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị tab người dùng
  const renderUserTab = () => {
    if (!userStats) return null;

    const { totalUsers, usersByRole, newUsers, newUsersByDay, topUsers } = userStats;
    
    // Chuyển đổi dữ liệu người dùng theo vai trò
    const roleData = Object.entries(usersByRole || {}).map(([role, count]) => ({
      role,
      count: Number(count)
    }));

    // Chuyển đổi dữ liệu người dùng mới theo ngày
    const newUserData = Object.entries(newUsersByDay || {}).map(([date, count]) => ({
      date: formatDate(date),
      count: Number(count)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="space-y-8">
        {/* Thống kê tổng quan */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-800 mb-2">Tổng số người dùng</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-purple-700">{totalUsers}</span>
            <span className="ml-4 text-sm font-medium text-green-600 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              {newUsers} người dùng mới
            </span>
          </div>
        </div>
        
        {/* Người dùng theo vai trò */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Người dùng theo vai trò</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roleData.map((item, index) => {
              const getRoleColor = (role: string) => {
                switch (role) {
                  case 'USER': return 'bg-blue-100 text-blue-800';
                  case 'MANAGER': return 'bg-purple-100 text-purple-800';
                  case 'STAFF': return 'bg-green-100 text-green-800';
                  case 'ORDER_STAFF': return 'bg-yellow-100 text-yellow-800';
                  case 'PRODUCT_STAFF': return 'bg-orange-100 text-orange-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };
              
              const getRoleName = (role: string) => {
                switch (role) {
                  case 'USER': return 'Người dùng';
                  case 'MANAGER': return 'Quản lý';
                  case 'STAFF': return 'Nhân viên';
                  case 'ORDER_STAFF': return 'NV Đơn hàng';
                  case 'PRODUCT_STAFF': return 'NV Sản phẩm';
                  default: return role;
                }
              };
              
              return (
                <div key={index} className="p-4 rounded-lg border">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getRoleColor(item.role)}`}>
                    {getRoleName(item.role)}
                  </div>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm text-gray-500">người dùng</div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Biểu đồ người dùng mới theo ngày */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Người dùng mới theo ngày</h2>
          <div className="h-64 w-full">
            {/* Placeholder cho biểu đồ - Có thể sử dụng thư viện Chart.js hoặc Recharts */}
            <div className="flex items-end justify-between h-full w-full border-b border-l">
              {newUserData.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${100 / newUserData.length}%` }}>
                  <div 
                    className="bg-purple-500 w-8 mx-auto rounded-t" 
                    style={{ height: `${(item.count / Math.max(...newUserData.map(d => d.count), 1)) * 100}%` }}
                  ></div>
                  <div className="text-xs mt-2 text-gray-600 -rotate-45 origin-top-left">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Top người dùng */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Top người dùng (theo số đơn hàng)</h2>
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số đơn hàng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers?.map((user: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị tab đơn hàng
  const renderOrderTab = () => {
    if (!orderStats) return null;

    const { totalOrders, ordersByStatus, ordersByPaymentMethod, ordersByPaymentStatus, ordersByDay, revenueByDay } = orderStats;

    // Chuyển đổi dữ liệu đơn hàng theo trạng thái
    const statusData = Object.entries(ordersByStatus || {}).map(([status, count]) => ({
      status,
      count: Number(count)
    }));

    // Chuyển đổi dữ liệu đơn hàng theo phương thức thanh toán
    const paymentMethodData = Object.entries(ordersByPaymentMethod || {}).map(([method, count]) => ({
      method,
      count: Number(count)
    }));

    // Chuyển đổi dữ liệu đơn hàng theo trạng thái thanh toán
    const paymentStatusData = Object.entries(ordersByPaymentStatus || {}).map(([status, count]) => ({
      status,
      count: Number(count)
    }));

    // Chuyển đổi dữ liệu đơn hàng theo ngày
    const orderDailyData = Object.entries(ordersByDay || {}).map(([date, count]) => ({
      date: formatDate(date),
      count: Number(count)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Chuyển đổi dữ liệu doanh thu theo ngày
    const revenueDailyData = Object.entries(revenueByDay || {}).map(([date, amount]) => ({
      date: formatDate(date),
      amount: Number(amount)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="space-y-8">
        {/* Thống kê tổng quan */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Tổng số đơn hàng</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-blue-700">{totalOrders}</span>
          </div>
        </div>

        {/* Đơn hàng theo trạng thái */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Đơn hàng theo trạng thái</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusData.map((item, index) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'PENDING': return 'bg-yellow-100 text-yellow-800';
                  case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
                  case 'PROCESSING': return 'bg-purple-100 text-purple-800';
                  case 'SHIPPING': return 'bg-indigo-100 text-indigo-800';
                  case 'DELIVERED': return 'bg-green-100 text-green-800';
                  case 'PARTIALLY_RETURNED': return 'bg-orange-100 text-orange-800';
                  case 'FULLY_RETURNED': return 'bg-red-100 text-red-800';
                  case 'CANCELED': return 'bg-gray-100 text-gray-800';
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
                  case 'PARTIALLY_RETURNED': return 'Trả hàng một phần';
                  case 'FULLY_RETURNED': return 'Trả hàng toàn bộ';
                  case 'CANCELED': return 'Đã hủy';
                  default: return status;
                }
              };
              
              return (
                <div key={index} className="p-4 rounded-lg border">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(item.status)}`}>
                    {getStatusName(item.status)}
                  </div>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm text-gray-500">đơn hàng</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Đơn hàng theo phương thức thanh toán */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Đơn hàng theo phương thức thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethodData.map((item, index) => {
              const getMethodColor = (method: string) => {
                switch (method) {
                  case 'CREDIT_CARD': return 'bg-blue-100 text-blue-800';
                  case 'BANK_TRANSFER': return 'bg-green-100 text-green-800';
                  case 'CASH_ON_DELIVERY': return 'bg-yellow-100 text-yellow-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };
              
              const getMethodName = (method: string) => {
                switch (method) {
                  case 'CREDIT_CARD': return 'Thẻ tín dụng';
                  case 'BANK_TRANSFER': return 'Chuyển khoản';
                  case 'CASH_ON_DELIVERY': return 'Tiền mặt (COD)';
                  default: return method;
                }
              };
              
              return (
                <div key={index} className="p-4 rounded-lg border">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getMethodColor(item.method)}`}>
                    {getMethodName(item.method)}
                  </div>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm text-gray-500">đơn hàng</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Đơn hàng theo trạng thái thanh toán */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Đơn hàng theo trạng thái thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentStatusData.map((item, index) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'PENDING': return 'bg-yellow-100 text-yellow-800';
                  case 'PAID': return 'bg-green-100 text-green-800';
                  case 'FAILED': return 'bg-red-100 text-red-800';
                  case 'REFUNDED': return 'bg-orange-100 text-orange-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };
              
              const getStatusName = (status: string) => {
                switch (status) {
                  case 'PENDING': return 'Chờ thanh toán';
                  case 'PAID': return 'Đã thanh toán';
                  case 'FAILED': return 'Thanh toán thất bại';
                  case 'REFUNDED': return 'Đã hoàn tiền';
                  default: return status;
                }
              };
              
              return (
                <div key={index} className="p-4 rounded-lg border">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(item.status)}`}>
                    {getStatusName(item.status)}
                  </div>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm text-gray-500">đơn hàng</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Biểu đồ đơn hàng theo ngày */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Đơn hàng theo ngày</h2>
          <div className="h-64 w-full">
            {/* Placeholder cho biểu đồ - Có thể sử dụng thư viện Chart.js hoặc Recharts */}
            <div className="flex items-end justify-between h-full w-full border-b border-l">
              {orderDailyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${100 / orderDailyData.length}%` }}>
                  <div 
                    className="bg-blue-500 w-8 mx-auto rounded-t" 
                    style={{ height: `${(item.count / Math.max(...orderDailyData.map(d => d.count), 1)) * 100}%` }}
                  ></div>
                  <div className="text-xs mt-2 text-gray-600 -rotate-45 origin-top-left">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biểu đồ doanh thu theo ngày */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo ngày</h2>
          <div className="h-64 w-full">
            {/* Placeholder cho biểu đồ - Có thể sử dụng thư viện Chart.js hoặc Recharts */}
            <div className="flex items-end justify-between h-full w-full border-b border-l">
              {revenueDailyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${100 / revenueDailyData.length}%` }}>
                  <div 
                    className="bg-green-500 w-8 mx-auto rounded-t" 
                    style={{ height: `${(item.amount / Math.max(...revenueDailyData.map(d => d.amount), 1)) * 100}%` }}
                  ></div>
                  <div className="text-xs mt-2 text-gray-600 -rotate-45 origin-top-left">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header với title và bộ lọc thời gian */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo & Thống kê</h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowDateOptions(!showDateOptions)}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Calendar size={18} className="mr-2" />
                <span>{dateFilterLabel}</span>
                <ChevronDown size={16} className="ml-2" />
              </button>
              
              {showDateOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10 border">
                  <div className="py-1">
                    <button 
                      onClick={() => getDateRangeByType('today')} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Hôm nay
                    </button>
                    <button 
                      onClick={() => getDateRangeByType('week')} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Tuần này
                    </button>
                    <button 
                      onClick={() => getDateRangeByType('month')} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Tháng này
                    </button>
                    <button 
                      onClick={() => getDateRangeByType('quarter')} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Quý này
                    </button>
                    <button 
                      onClick={() => getDateRangeByType('year')} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Năm nay
                    </button>
                    <button 
                      onClick={() => getDateRangeByType('custom')} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Tùy chỉnh
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button 
                onClick={handleDateChange}
                className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Thanh tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex flex-wrap border-b">
          <button
            className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'doanh-thu' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('doanh-thu')}
          >
            <DollarSign size={18} className="mr-2" />
            Doanh thu
          </button>
          <button
            className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'don-hang' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('don-hang')}
          >
            <ShoppingBag size={18} className="mr-2" />
            Đơn hàng
          </button>
          <button
            className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'san-pham' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('san-pham')}
          >
            <Package size={18} className="mr-2" />
            Sản phẩm
          </button>
          <button
            className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'nguoi-dung' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('nguoi-dung')}
          >
            <Users size={18} className="mr-2" />
            Người dùng
          </button>
        </div>
        
        {/* Trạng thái loading */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 rounded-lg m-6">
            <div className="flex items-center">
              <div className="mr-3 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {renderTabContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage; 