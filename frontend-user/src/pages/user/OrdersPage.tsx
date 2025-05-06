import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import orderApi, { Order as ApiOrder, OrderItem as ApiOrderItem } from '../../services/orderApi';
import { IMAGES_BASE_URL } from '../../config/api';
import { formatCurrency } from '../../utils/format';

// Component AlertDialog đơn giản
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {children}
      </div>
    </div>
  );
};

const AlertDialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

const AlertDialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

const AlertDialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h2 className="text-xl font-semibold">{children}</h2>;
};

const AlertDialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <p className="text-gray-600 mt-2">{children}</p>;
};

const AlertDialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-end space-x-2 mt-6">{children}</div>;
};

const AlertDialogCancel: React.FC<{ 
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ disabled, children }) => {
  return (
    <button 
      className={`px-4 py-2 border border-gray-300 rounded-md ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const AlertDialogAction: React.FC<{ 
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ disabled, onClick, className, children }) => {
  return (
    <button 
      className={`px-4 py-2 rounded-md ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Định nghĩa interface cho đơn hàng
interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  imageUrl?: string;
}

interface Order {
  orderNumber: string;
  createdAt: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalItems: number;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  items: OrderItem[];
}

// Hàm format tiền
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Hàm chuyển đổi status sang tiếng Việt
const getStatusText = (status: Order['status']) => {
  const statusMap: Record<Order['status'], string> = {
    PENDING: 'Chờ xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    CANCELLED: 'Đã hủy',
  };
  return statusMap[status] || 'Không xác định';
};

// Hàm tạo màu tương ứng với status
const getStatusClass = (status: Order['status']) => {
  const statusColorMap: Record<Order['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return statusColorMap[status] || 'bg-gray-100 text-gray-800';
};

// Hàm chuyển đổi từ API order sang Order
const mapApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  // Format địa chỉ
  const address = apiOrder.shippingAddress;
  const formattedAddress = address ? `${address.street || ''}, ${address.ward || ''}, ${address.district || ''}, ${address.province || ''}` : 'Không có địa chỉ';
  
  // Map các item
  const items: OrderItem[] = apiOrder.items.map(item => ({
    id: item.id,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    totalPrice: item.subtotal,
    imageUrl: item.productImage && (
      item.productImage.startsWith('http') 
        ? item.productImage 
        : `${IMAGES_BASE_URL}${item.productImage}`
    )
  }));
  
  // Map phương thức thanh toán
  let paymentMethod = '';
  switch (apiOrder.paymentMethod) {
    case 'COD':
      paymentMethod = 'COD - Thanh toán khi nhận hàng';
      break;
    case 'VNPAY':
      paymentMethod = 'VNPAY - Thẻ ATM/Internet Banking';
      break;
    case 'MOMO':
      paymentMethod = 'MOMO - Ví điện tử';
      break;
    default:
      paymentMethod = apiOrder.paymentMethod;
  }
  
  return {
    orderNumber: apiOrder.orderNumber,
    createdAt: apiOrder.createdAt,
    status: apiOrder.status,
    totalItems: apiOrder.totalItems,
    totalAmount: apiOrder.totalAmount,
    shippingAddress: formattedAddress,
    paymentMethod,
    items
  };
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Lấy danh sách đơn hàng khi component được mount
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const apiOrders = await orderApi.getUserOrders();
      const mappedOrders = apiOrders.map(mapApiOrderToOrder);
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Hàm toggle hiển thị chi tiết đơn hàng
  const toggleOrderDetails = (orderNumber: string) => {
    if (expandedOrder === orderNumber) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderNumber);
    }
  };
  
  // Chuẩn bị hủy đơn hàng
  const prepareToCancel = (orderNumber: string) => {
    setOrderToCancel(orderNumber);
    setShowCancelDialog(true);
  };
  
  // Hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setIsCancelling(true);
    try {
      await orderApi.cancelOrder(orderToCancel);
      
      // Cập nhật trạng thái đơn hàng trong state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderNumber === orderToCancel ? { ...order, status: 'CANCELLED' } : order
        )
      );
      
      toast.success('Đã hủy đơn hàng thành công');
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      setOrderToCancel(null);
    }
  };
  
  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Đơn hàng của tôi</h2>
      
      {isLoading ? (
        <div className="py-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-4 text-center text-gray-500">
          Bạn chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.orderNumber} className="border rounded-lg overflow-hidden">
              {/* Header của đơn hàng */}
              <div className="bg-gray-50 p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-medium">Đơn hàng #{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      Ngày đặt: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Thông tin tổng quan đơn hàng */}
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Tổng tiền:</span> {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Số lượng:</span> {order.totalItems} sản phẩm
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                    onClick={() => toggleOrderDetails(order.orderNumber)}
                  >
                    {expandedOrder === order.orderNumber ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </button>
                </div>
              </div>
              
              {/* Chi tiết đơn hàng - hiển thị khi click vào Xem chi tiết */}
              {expandedOrder === order.orderNumber && (
                <div className="p-4">
                  {/* Địa chỉ giao hàng và phương thức thanh toán */}
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Địa chỉ giao hàng</h4>
                      <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Phương thức thanh toán</h4>
                      <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                    </div>
                  </div>
                  
                  {/* Danh sách sản phẩm */}
                  <h4 className="text-sm font-medium mb-2">Sản phẩm</h4>
                  <div className="space-y-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-start gap-4 pb-3 border-b last:border-0">
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h5 className="font-medium">{item.productName}</h5>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Hành động với đơn hàng */}
                  <div className="mt-4 flex justify-end">
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => prepareToCancel(order.orderNumber)}
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Dialog xác nhận hủy đơn hàng */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Không</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelOrder} 
              className="bg-red-500 hover:bg-red-600"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Đang hủy...
                </span>
              ) : (
                'Hủy đơn hàng'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersPage; 