import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MapPin, ShoppingBag, Eye, Package, X } from 'lucide-react';
import { getUserById, deleteUser, updateUserStatus, UserResponse } from '../services/userApi';
import { getUserAddressesById, AddressResponse } from '../services/userApi';
import { getUserOrders, OrderResponse } from '../services/orderApi';
import { IMAGES_BASE_URL } from '../config/api';

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const data = await getUserById(Number(id));
        setUser(data);
        fetchUserAddresses();
        fetchUserOrders();
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);
  
  const fetchUserAddresses = async () => {
    if (!id) return;
    
    setIsLoadingAddresses(true);
    try {
      const addressesData = await getUserAddressesById(Number(id));
      setAddresses(addressesData);
    } catch (error) {
      console.error('Error fetching user addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchUserOrders = async () => {
    if (!id) return;
    
    setIsLoadingOrders(true);
    try {
      const ordersData = await getUserOrders(Number(id));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      // Hiển thị lỗi
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleEdit = () => {
    navigate(`/users/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      try {
        await deleteUser(Number(id));
        console.log('Đã xóa người dùng thành công');
        navigate('/users');
      } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        alert('Không thể xóa người dùng. Vui lòng thử lại sau.');
      }
    }
  };

 

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Không có";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return "Không có";
    }
  };

  // Lấy label vai trò
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Quản lý</span>;
      case 'ORDER_STAFF':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Nhân viên đơn hàng</span>;
      case 'PRODUCT_STAFF':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Nhân viên sản phẩm</span>;
      case 'USER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Khách hàng</span>;
      default:
        return null;
    }
  };

  const handleViewOrder = (order: OrderResponse) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Lấy label trạng thái đơn hàng
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>;
      case 'SHIPPING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Đang giao hàng</span>;
      case 'DELIVERED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã giao hàng</span>;
      case 'COMPLETED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>;
      case 'CANCELED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Đã hủy</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Lấy label trạng thái thanh toán
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ thanh toán</span>;
      case 'PAID':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã thanh toán</span>;
      case 'FAILED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Thanh toán thất bại</span>;
      case 'REFUNDED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Đã hoàn tiền</span>;
      case 'COD_PENDING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">COD - Chờ thanh toán</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Format tiền tệ VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy người dùng</h2>
          <p className="text-gray-600 mb-4">Người dùng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button 
            onClick={() => navigate('/users')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Quay lại danh sách người dùng
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/users')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit size={16} className="mr-1.5" />
            Chỉnh sửa
          </button>
          
          
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin cơ bản</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {user.profileImage ? (
                  <img 
                    className="h-20 w-20 rounded-full object-cover border border-gray-200" 
                    src={`${IMAGES_BASE_URL}${user.profileImage}`} 
                    alt={user.name} 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Họ tên</p>
                <p className="mt-1 text-sm text-gray-900">{user.name}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Vai trò</p>
              <div className="mt-1 flex items-center">
                {getRoleBadge(user.role)}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
              <p className="mt-1 text-sm text-gray-900">{user.mobileNumber || 'Chưa cập nhật'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Trạng thái</p>
              <p className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isEnabled ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thời gian</h2>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2">
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
              <div className="grid grid-cols-2">
                <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                <p className="text-sm">{formatDate(user.updatedAt ?? "Không có")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Phần hiển thị địa chỉ */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Địa chỉ giao hàng</h2>
            <div className="flex items-center">
              <MapPin size={18} className="text-gray-500 mr-1" />
              <span className="text-sm text-gray-500">{addresses.length} địa chỉ</span>
            </div>
          </div>
          
          {isLoadingAddresses ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-gray-50 rounded-md p-4 text-center">
              <p className="text-gray-500">Người dùng chưa có địa chỉ nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(address => (
                <div 
                  key={address.id}
                  className={`border rounded-md p-4 ${address.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{address.fullName}</div>
                    {address.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Mặc định</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">{address.mobileNo}</div>
                  <div className="text-sm">{address.fullAddress}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Phần hiển thị đơn hàng */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Đơn hàng gần đây</h2>
            <div className="flex items-center">
              <ShoppingBag size={18} className="text-gray-500 mr-1" />
              <span className="text-sm text-gray-500">{orders.length} đơn hàng</span>
            </div>
          </div>
          
          {isLoadingOrders ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 rounded-md p-4 text-center">
              <p className="text-gray-500">Người dùng chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày đặt hàng
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getOrderStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal xem chi tiết đơn hàng */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/20 transition-opacity" 
              aria-hidden="true"
              onClick={closeOrderModal}
              style={{ zIndex: 1 }}
            ></div>
            
            {/* Modal */}
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative"
              style={{ zIndex: 2 }}
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={closeOrderModal}
                >
                  <span className="sr-only">Đóng</span>
                  <X size={24} />
                </button>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-0 ml-4 text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Chi tiết đơn hàng #{selectedOrder.orderNumber}
                    </h3>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin đơn hàng</h4>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Mã đơn hàng:</span>
                        <span className="text-sm font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Ngày đặt hàng:</span>
                        <span className="text-sm">{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Trạng thái:</span>
                        <span>{getOrderStatusBadge(selectedOrder.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Phương thức thanh toán:</span>
                        <span className="text-sm">{selectedOrder.paymentMethodDisplayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Trạng thái thanh toán:</span>
                        <span>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</span>
                      </div>
                      {selectedOrder.paymentTransactionId && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Mã giao dịch:</span>
                          <span className="text-sm font-mono">{selectedOrder.paymentTransactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Địa chỉ giao hàng</h4>
                    {selectedOrder.shippingAddress ? (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="font-medium">{selectedOrder.shippingAddress.fullName}</div>
                        <div className="text-sm text-gray-500 mb-1">{selectedOrder.shippingAddress.mobileNo}</div>
                        <div className="text-sm">{selectedOrder.shippingAddress.fullAddress}</div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-500">
                        Không có thông tin địa chỉ
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Sản phẩm đã đặt</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sản phẩm
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Đơn giá
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số lượng
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {item.productImage ? (
                                    <img
                                      className="h-10 w-10 rounded object-cover"
                                      src={`${IMAGES_BASE_URL}${item.productImage}`}
                                      alt={item.productName}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                      <Package size={16} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                  {item.discount > 0 && (
                                    <div className="text-xs text-green-600">Giảm giá {item.discount}%</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            Tổng cộng:
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                            {formatCurrency(selectedOrder.totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Ghi chú đơn hàng</h4>
                    <div className="bg-gray-50 p-3 rounded-md text-sm">{selectedOrder.notes}</div>
                  </div>
                )}
                
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Lịch sử đơn hàng</h4>
                    <div className="space-y-2">
                      {selectedOrder.statusHistory.map((history, index) => (
                        <div key={history.id} className="bg-gray-50 p-3 rounded-md flex justify-between">
                          <div>
                            <span className="text-sm">{history.statusDisplayName}</span>
                            {history.notes && (
                              <p className="text-xs text-gray-500 mt-1">{history.notes}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(history.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={closeOrderModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetailPage; 