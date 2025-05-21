import Slider from '@mui/material/Slider';
import { ArrowDown, ArrowUp, ClipboardList, Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  formatDate,
  formatPrice,
  getAllOrders,
  getOrderStatusColor,
  getPaymentStatusColor,
  OrderStatus,
  PaymentStatus,
} from '../services/adminOrderApi';
import { OrderResponse } from '../services/orderApi';

// Interface cho các tùy chọn lọc
interface FilterOptions {
  status: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  sort: 'date_asc' | 'date_desc' | 'amount_asc' | 'amount_desc' | 'status_asc' | 'status_desc';
}

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Lọc và sắp xếp
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: null,
    paymentStatus: null,
    paymentMethod: null,
    minAmount: null,
    maxAmount: null,
    startDate: null,
    endDate: null,
    sort: 'date_desc'
  });
  
  // Thêm state để lưu giá trị min/max của tổng tiền
  const [amountRange, setAmountRange] = useState<{min: number, max: number}>({min: 0, max: 10000000});

  // Tải dữ liệu đơn hàng
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getAllOrders();
        setOrders(data);
        
        // Tính toán giá trị min/max của tổng tiền
        if (data.length > 0) {
          const amounts = data.map(order => order.totalAmount);
          const minAmount = Math.min(...amounts);
          const maxAmount = Math.max(...amounts);
          
          setAmountRange({
            min: minAmount, 
            max: maxAmount > minAmount ? maxAmount : minAmount + 1000000
          });
          
          // Đảm bảo filterOptions luôn có giá trị hợp lệ
          setFilterOptions(prev => ({
            ...prev,
            minAmount: prev.minAmount ?? minAmount,
            maxAmount: prev.maxAmount ?? (maxAmount > minAmount ? maxAmount : minAmount + 1000000)
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Hàm xử lý thay đổi bộ lọc
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions({
      ...filterOptions,
      [key]: value
    });
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
  };
  
  // Hàm xử lý reset bộ lọc
  const resetFilters = () => {
    setFilterOptions({
      status: null,
      paymentStatus: null,
      paymentMethod: null,
      minAmount: amountRange.min,
      maxAmount: amountRange.max,
      startDate: null,
      endDate: null,
      sort: 'date_desc'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Lọc và sắp xếp đơn hàng
  const getFilteredAndSortedOrders = () => {
    return orders
      .filter(order => {
        // Lọc theo từ khóa tìm kiếm
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.shippingAddress?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Lọc theo trạng thái đơn hàng
        if (filterOptions.status && order.status !== filterOptions.status) return false;
        
        // Lọc theo trạng thái thanh toán
        if (filterOptions.paymentStatus && order.paymentStatus !== filterOptions.paymentStatus) return false;
        
        // Lọc theo phương thức thanh toán
        if (filterOptions.paymentMethod && order.paymentMethod !== filterOptions.paymentMethod) return false;
        
        // Lọc theo khoảng tiền
        if (filterOptions.minAmount !== null && order.totalAmount < filterOptions.minAmount) return false;
        if (filterOptions.maxAmount !== null && order.totalAmount > filterOptions.maxAmount) return false;
        
        // Lọc theo khoảng thời gian
        if (filterOptions.startDate) {
          const startDate = new Date(filterOptions.startDate);
          const orderDate = new Date(order.createdAt);
          if (orderDate < startDate) return false;
        }
        
        if (filterOptions.endDate) {
          const endDate = new Date(filterOptions.endDate);
          endDate.setHours(23, 59, 59, 999); // Kết thúc của ngày
          const orderDate = new Date(order.createdAt);
          if (orderDate > endDate) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sắp xếp theo tiêu chí đã chọn
        switch (filterOptions.sort) {
          case 'date_asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'date_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'amount_asc':
            return a.totalAmount - b.totalAmount;
          case 'amount_desc':
            return b.totalAmount - a.totalAmount;
          case 'status_asc':
            return a.status.localeCompare(b.status);
          case 'status_desc':
            return b.status.localeCompare(a.status);
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  };

  // Áp dụng phân trang
  const getPaginatedOrders = () => {
    const filteredOrders = getFilteredAndSortedOrders();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const paginatedOrders = getPaginatedOrders();
  const filteredOrders = getFilteredAndSortedOrders();
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Xử lý khi click vào nút xử lý đơn hàng
  const handleProcessOrder = (id: number) => {
    navigate(`/orders/process/${id}`);
  };

  // Xử lý khi click vào tiêu đề cột để sắp xếp
  const handleSort = (sortKey: string) => {
    if (filterOptions.sort === `${sortKey}_asc`) {
      handleFilterChange('sort', `${sortKey}_desc`);
    } else {
      handleFilterChange('sort', `${sortKey}_asc`);
    }
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

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý đơn hàng</h1>
          <p className="text-gray-600">Quản lý tất cả đơn hàng trong hệ thống</p>
        </div>
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
              placeholder="Tìm kiếm đơn hàng theo mã, tên khách hàng..."
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
            {(filterOptions.status !== null || 
              filterOptions.paymentStatus !== null || 
              filterOptions.paymentMethod !== null ||
              filterOptions.minAmount !== null || 
              filterOptions.maxAmount !== null ||
              filterOptions.startDate !== null ||
              filterOptions.endDate !== null) && (
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
            {/* Hàng đầu tiên - các select option */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn hàng</label>
                <select
                  value={filterOptions.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(OrderStatus).map(([key, value]) => (
                    <option key={key} value={value}>{key}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                <select
                  value={filterOptions.paymentStatus || ''}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value || null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả trạng thái thanh toán</option>
                  {Object.entries(PaymentStatus).map(([key, value]) => (
                    <option key={key} value={value}>{key}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <select
                  value={filterOptions.paymentMethod || ''}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value || null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả phương thức</option>
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="MOMO">MoMo</option>
                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                </select>
              </div>
            </div>

            {/* Hàng thứ hai - khoảng thời gian và tiền */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng thời gian</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                      <input
                        type="date"
                        value={filterOptions.startDate || ''}
                        onChange={(e) => handleFilterChange('startDate', e.target.value || null)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                      <input
                        type="date"
                        value={filterOptions.endDate || ''}
                        onChange={(e) => handleFilterChange('endDate', e.target.value || null)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng tiền</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Từ: <span className="font-medium text-blue-600">{formatPrice(filterOptions.minAmount ?? amountRange.min)}</span></span>
                    <span>Đến: <span className="font-medium text-blue-600">{formatPrice(filterOptions.maxAmount ?? amountRange.max)}</span></span>
                  </div>
                  
                  <div className="mb-5">
                    <div className="text-xs text-gray-500 mb-1">Giá thấp nhất</div>
                    <Slider
                      value={filterOptions.minAmount ?? amountRange.min}
                      onChange={(event: Event, newValue: number | number[]) => {
                        if (event.target === null) {
                          console.log('event.target is null');
                        }
                        const value = newValue as number;
                        // Chỉ cập nhật nếu minAmount <= maxAmount
                        if (value <= (filterOptions.maxAmount ?? amountRange.max)) {
                          handleFilterChange('minAmount', value);
                        }
                      }}
                      min={amountRange.min}
                      max={amountRange.max}
                      step={(amountRange.max - amountRange.min) / 10000}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatPrice(value)}
                      sx={{
                        color: '#3b82f6',
                        '& .MuiSlider-rail': { backgroundColor: '#e2e8f0' },
                        '& .MuiSlider-thumb': {
                          height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                          '&:focus, &:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)' },
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#3b82f6',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Giá cao nhất</div>
                    <Slider
                      value={filterOptions.maxAmount ?? amountRange.max}
                      onChange={(event: Event, newValue: number | number[]) => {
                        if (event.target === null) {
                          console.log('event.target is null');
                        }
                        const value = newValue as number;
                        // Chỉ cập nhật nếu maxAmount >= minAmount
                        if (value >= (filterOptions.minAmount ?? amountRange.min)) {
                          handleFilterChange('maxAmount', value);
                        }
                      }}
                      min={amountRange.min}
                      max={amountRange.max}
                      step={(amountRange.max - amountRange.min) / 10000}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatPrice(value)}
                      sx={{
                        color: '#f97316', // Orange-500
                        '& .MuiSlider-rail': { backgroundColor: '#e2e8f0' },
                        '& .MuiSlider-thumb': {
                          height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                          '&:focus, &:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(249, 115, 22, 0.16)' },
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#f97316',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </div>
                </div>
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
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('date')}
                      >
                        Mã đơn / Ngày đặt
                        {getSortIcon('date')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người đặt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người nhận / Địa chỉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('amount')}
                      >
                        Tổng tiền
                        {getSortIcon('amount')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('status')}
                      >
                  Trạng thái
                        {getSortIcon('status')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Không tìm thấy đơn hàng
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.userName}</div>
                          <div className="text-sm text-gray-500">{order.userEmail || 'Không có'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.shippingAddress?.fullName || 'Không có'}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {order.shippingAddress ? `${order.shippingAddress.fullAddress}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}` : 'Không có'}
                          </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} sản phẩm
                          </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.statusDisplayName}
                          </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatusDisplayName}
                            </span>
                            <div className="text-sm text-gray-500">{order.paymentMethodDisplayName}</div>
                          </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleProcessOrder(order.id)}
                        className="text-green-600 hover:text-green-900"
                              title="Xử lý đơn hàng"
                      >
                        <ClipboardList size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            {filteredOrders.length > 0 && (
              <>Hiển thị <span className="font-medium">{paginatedOrders.length}</span> / <span className="font-medium">{filteredOrders.length}</span> đơn hàng</>
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

          {/* Số đơn hàng mỗi trang */}
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-700">Đơn hàng/trang:</span>
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
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersPage; 