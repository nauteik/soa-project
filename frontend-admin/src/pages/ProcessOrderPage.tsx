import { ArrowLeft, CheckCircle, CreditCard, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IMAGES_BASE_URL } from '../config/api';
import {
  formatDate,
  formatPrice,
  getOrderByIdForAdmin,
  getOrderStatusColor,
  getPaymentStatusColor,
  OrderItemStatus,
  OrderStatus,
  orderStatusDisplayNames,
  PaymentStatus,
  updateOrderItemStatus,
  updateOrderStatus,
  updatePaymentStatus,
} from '../services/adminOrderApi';
import { OrderResponse } from '../services/orderApi';


const ProcessOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho form cập nhật trạng thái
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Tải thông tin đơn hàng
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getOrderByIdForAdmin(parseInt(id, 10));
        setOrder(data);
        setSelectedStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin đơn hàng');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);

  // Định nghĩa các trạng thái tiếp theo hợp lệ cho OrderStatus hiện tại
  const getNextValidOrderStatuses = (currentStatus: string): OrderStatus[] => {
    // Quy trình cơ bản: PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return [OrderStatus.CONFIRMED, OrderStatus.CANCELED];
      case OrderStatus.CONFIRMED:
        return [OrderStatus.PROCESSING, OrderStatus.CANCELED];
      case OrderStatus.PROCESSING:
        return [OrderStatus.SHIPPING, OrderStatus.CANCELED];
      case OrderStatus.SHIPPING:
        return [OrderStatus.DELIVERED, OrderStatus.CANCELED];
      case OrderStatus.DELIVERED:
        return [OrderStatus.FULLY_RETURNED]; // Chỉ cho phép trả hàng toàn bộ, không còn tùy chọn trả một phần
      case OrderStatus.PARTIALLY_RETURNED:
        return [OrderStatus.FULLY_RETURNED];
      case OrderStatus.FULLY_RETURNED:
      case OrderStatus.CANCELED:
        return []; // Không có trạng thái tiếp theo
      default:
        return [];
    }
  };

  // Xử lý cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = async () => {
    if (!order || !id || !selectedStatus) return;
    
    if (selectedStatus === order.status) {
      alert('Vui lòng chọn trạng thái khác với trạng thái hiện tại');
      return;
    }
    
    setIsUpdating(true);
    setUpdateSuccess(false);
    
    try {
      const updatedOrder = await updateOrderStatus(
        parseInt(id, 10),
        selectedStatus,
        notes
      );
      
      setOrder(updatedOrder);
      setUpdateSuccess(true);
      setNotes('');
      
      // Hiện thông báo thành công trong 3 giây
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đơn hàng');
      console.error('Error updating order status:', err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Xử lý cập nhật trạng thái thanh toán
  const handleUpdatePaymentStatus = async (newStatus: PaymentStatus) => {
    if (!order || !id) return;
    
    setIsUpdating(true);
    try {
      const updatedOrder = await updatePaymentStatus(
        parseInt(id, 10),
        newStatus,
        undefined // Transaction ID (nếu cần)
      );
      
      setOrder(updatedOrder);
      setUpdateSuccess(true);
      
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái thanh toán');
      console.error('Error updating payment status:', err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Xử lý cập nhật trạng thái cho một mục đơn hàng
  const handleUpdateOrderItemStatus = async (itemId: number, newStatus: OrderItemStatus) => {
    if (!order || !id) return;
    
    setIsUpdating(true);
    try {
      const updatedOrder = await updateOrderItemStatus(
        parseInt(id, 10),
        itemId,
        newStatus
      );
      
      setOrder(updatedOrder);
      setUpdateSuccess(true);
      
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái mục đơn hàng');
      console.error('Error updating order item status:', err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Lấy các trạng thái hợp lệ tiếp theo cho mục đơn hàng
  const getNextValidItemStatuses = (currentStatus: string, orderStatus: string): OrderItemStatus[] => {
    // Nếu mục đơn hàng đã giao, không cho phép hủy
    if (currentStatus === OrderItemStatus.DELIVERED) {
      // Chỉ cho phép trả lại nếu đơn hàng ở trạng thái DELIVERED hoặc PARTIALLY_RETURNED
      if (orderStatus === OrderStatus.DELIVERED || orderStatus === OrderStatus.PARTIALLY_RETURNED) {
        return [OrderItemStatus.RETURNED];
      }
      return [];
    }
    
    // Nếu đơn hàng đang ở 4 trạng thái đầu, chỉ cho phép CANCEL mục đơn hàng chưa bị hủy
    if (orderStatus === OrderStatus.PENDING || 
        orderStatus === OrderStatus.CONFIRMED || 
        orderStatus === OrderStatus.PROCESSING || 
        orderStatus === OrderStatus.SHIPPING) {
      // Nếu mục đơn hàng chưa bị hủy, cho phép hủy
      if (currentStatus !== OrderItemStatus.CANCELED) {
        return [OrderItemStatus.CANCELED];
      }
    }
    
    return []; // Các trường hợp khác không có trạng thái hợp lệ
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/orders')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Quay lại danh sách đơn hàng</span>
        </button>
        
        <h1 className="text-2xl font-semibold text-gray-800 mt-4">
          Xử lý đơn hàng {order?.orderNumber}
        </h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <p className="font-medium">Lỗi</p>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/orders')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Quay lại
          </button>
        </div>
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột bên trái - Thông tin đơn hàng và xử lý trạng thái */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông báo cập nhật thành công */}
            {updateSuccess && (
              <div className="bg-green-50 p-4 rounded-md text-green-800 flex items-start">
                <CheckCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Cập nhật thành công</p>
                  <p>Đơn hàng đã được cập nhật.</p>
                </div>
              </div>
            )}

            {/* Thông tin đơn hàng */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin đơn hàng</h2>
              
              <div className="flex flex-wrap -mx-3">
                <div className="w-full md:w-1/2 px-3 mb-4">
                  <p className="text-sm text-gray-600">Mã đơn hàng</p>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-4">
                  <p className="text-sm text-gray-600">Ngày đặt hàng</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-4">
                  <p className="text-sm text-gray-600">Tổng tiền</p>
                  <p className="font-medium text-blue-600">{formatPrice(order.totalAmount)}</p>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-4">
                  <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                  <p className="font-medium">{order.paymentMethodDisplayName}</p>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-4">
                  <p className="text-sm text-gray-600">Trạng thái đơn hàng</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                    {order.statusDisplayName}
                  </span>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-4">
                  <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatusDisplayName}
                  </span>
                </div>
                {order.notes && (
                  <div className="w-full px-3 mb-4">
                    <p className="text-sm text-gray-600">Ghi chú của khách hàng</p>
                    <p className="italic">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form cập nhật trạng thái đơn hàng */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cột trái - Cập nhật trạng thái */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Cập nhật trạng thái đơn hàng</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái đơn hàng
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isUpdating || getNextValidOrderStatuses(order.status).length === 0}
                    >
                      <option value={order.status}>{order.statusDisplayName} (Hiện tại)</option>
                      {getNextValidOrderStatuses(order.status).map((status) => (
                        <option key={status} value={status}>
                          {orderStatusDisplayNames[status]}
                        </option>
                      ))}
                    </select>
                    {getNextValidOrderStatuses(order.status).length === 0 && (
                      <p className="mt-1 text-sm text-yellow-600">
                        Đơn hàng này đã ở trạng thái cuối và không thể thay đổi trạng thái.
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập ghi chú cho việc thay đổi trạng thái"
                      disabled={isUpdating || getNextValidOrderStatuses(order.status).length === 0}
                    ></textarea>
                  </div>
                  
                  <button
                    onClick={handleUpdateOrderStatus}
                    disabled={isUpdating || selectedStatus === order.status || getNextValidOrderStatuses(order.status).length === 0}
                    className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none ${
                      isUpdating || selectedStatus === order.status || getNextValidOrderStatuses(order.status).length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                  </button>
                </div>

                {/* Cột phải - Lịch sử trạng thái */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Lịch sử trạng thái</h2>
                  
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {[...order.statusHistory]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(history => (
                        <div key={history.id} className="border-l-2 border-blue-500 pl-4 py-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-3">
                              <p className="font-medium text-sm">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${getOrderStatusColor(history.status)}`}>
                                  {history.statusDisplayName}
                                </span>
                              </p>
                              {history.notes && <p className="text-sm mt-1 text-gray-600 break-words">{history.notes}</p>}
                            </div>
                            <p className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                              {formatDate(history.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa có lịch sử trạng thái</p>
                  )}
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm trong đơn hàng */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Sản phẩm trong đơn hàng ({order.items.length})
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item: any) => {
                      const validItemStatuses = getNextValidItemStatuses(item.status, order.status);
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img 
                                  className="h-10 w-10 rounded-md object-cover" 
                                  src={item.productImage ? `${IMAGES_BASE_URL}${item.productImage}` : 'https://via.placeholder.com/50'} 
                                  alt={item.productName} 
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                <div className="text-sm text-gray-500">ID: {item.productId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatPrice(item.price)}
                            </div>
                            {item.discount > 0 && (
                              <div className="text-sm text-red-600">-{item.discount}%</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === OrderItemStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                              item.status === OrderItemStatus.CANCELED ? 'bg-red-100 text-red-800' :
                              item.status === OrderItemStatus.RETURNED ? 'bg-purple-100 text-purple-800' :
                              item.status === OrderItemStatus.SHIPPING ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.statusDisplayName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {validItemStatuses.length > 0 ? (
                              <div className="flex justify-end space-x-2">
                                {validItemStatuses.map(status => {
                                  // Hiển thị icon phù hợp với trạng thái
                                  let icon;
                                  let tooltipText;
                                  let btnClass = "text-blue-600 hover:text-blue-900";

                                  if (status === OrderItemStatus.CANCELED) {
                                    icon = <XCircle size={18} />;
                                    tooltipText = "Hủy mục này";
                                    btnClass = "text-red-600 hover:text-red-900";
                                  } else if (status === OrderItemStatus.RETURNED) {
                                    icon = <ArrowLeft size={18} />;
                                    tooltipText = "Trả lại hàng";
                                    btnClass = "text-orange-600 hover:text-orange-900";
                                  }

                                  return (
                                    <button
                                      key={status}
                                      onClick={() => handleUpdateOrderItemStatus(item.id, status)}
                                      disabled={isUpdating}
                                      className={`${btnClass} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title={tooltipText}
                                    >
                                      {icon}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-400">Không có thao tác</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Cột bên phải - Thông tin khách hàng và thanh toán */}
          <div className="space-y-6">
            {/* Thông tin khách hàng */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin khách hàng</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Họ tên</p>
                  <p className="font-medium">{order.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{order.userEmail || 'Không có'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID khách hàng</p>
                  <p className="font-medium">{order.userId}</p>
                </div>
              </div>
            </div>
            
            {/* Địa chỉ giao hàng */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Địa chỉ giao hàng</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Họ tên người nhận</p>
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                    <p className="font-medium">{order.shippingAddress.mobileNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ</p>
                    <p>{order.shippingAddress.fullAddress}</p>
                    <p>
                      {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.postalCode && (
                      <p>Mã bưu điện: {order.shippingAddress.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Cập nhật trạng thái thanh toán */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Thanh toán</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Phương thức</p>
                  <p className="font-medium">{order.paymentMethodDisplayName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatusDisplayName}
                  </span>
                </div>
                {order.paymentTransactionId && (
                  <div>
                    <p className="text-sm text-gray-600">Mã giao dịch</p>
                    <p className="font-medium">{order.paymentTransactionId}</p>
                  </div>
                )}
                
                {/* Nút cập nhật trạng thái thanh toán */}
                {order.paymentStatus !== PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.REFUNDED && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái thanh toán</p>
                    <div className="flex space-x-2">
                      {order.paymentStatus !== PaymentStatus.PAID && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(PaymentStatus.PAID)}
                          disabled={isUpdating}
                          className={`px-3 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <CreditCard size={16} className="inline-block mr-1" />
                          Đã thanh toán
                        </button>
                      )}
                      {order.paymentStatus === PaymentStatus.PAID && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(PaymentStatus.REFUNDED)}
                          disabled={isUpdating}
                          className={`px-3 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <ArrowLeft size={16} className="inline-block mr-1" />
                          Đã hoàn tiền
                        </button>
                      )}
                      {order.paymentStatus === PaymentStatus.PENDING && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(PaymentStatus.FAILED)}
                          disabled={isUpdating}
                          className={`px-3 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <XCircle size={16} className="inline-block mr-1" />
                          Thất bại
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          <p className="font-medium">Không có dữ liệu</p>
          <p>Không tìm thấy thông tin đơn hàng.</p>
          <button 
            onClick={() => navigate('/orders')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessOrderPage; 