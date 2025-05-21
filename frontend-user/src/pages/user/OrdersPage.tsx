import { AlertCircle, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import OrderDetailModal from '../../components/user/OrderDetailModal';
import orderApi from '../../services/orderApi';
import { Order, OrderStatus, orderStatusColors } from '../../types/order';
import { formatCurrency } from '../../utils/format';

// Component AlertDialog cho xác nhận hủy đơn hàng
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, children }) => {
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

// Hàm format ngày giờ
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

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
      setOrders(apiOrders);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sắp xếp đơn hàng mới nhất lên đầu
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Xem chi tiết đơn hàng
  const handleViewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
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
          order.orderNumber === orderToCancel 
            ? { ...order, status: OrderStatus.CANCELED, statusDisplayName: 'Đã hủy' } 
            : order
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
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">Không có đơn hàng nào</h3>
          <p className="mt-1 text-gray-500">Bạn chưa đặt đơn hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map(order => (
            <div key={order.orderNumber} className="bg-white rounded-md shadow-sm hover:shadow border border-gray-100">
              <div className="p-5">
                <div className="flex flex-col">
                  {/* Dòng 1: Tiêu đề đơn hàng và trạng thái */}
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        Đơn hàng #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${orderStatusColors[order.status]}`}>
                        {order.statusDisplayName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Dòng 2: Thông tin cơ bản */}
                  <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-gray-500">TỔNG TIỀN</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">SẢN PHẨM</p>
                      <p>{order.items.length} món</p>
                    </div>
                    <div>
                      <p className="text-gray-500">THANH TOÁN</p>
                      <p>Thanh toán khi nhận hàng</p>
                    </div>
                  </div>
                  
                  {/* Dòng 3: Nút tương tác */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleViewOrderDetail(order)}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                    >
                      Xem chi tiết
                    </button>
                    
                    {order.status === OrderStatus.PENDING && (
                      <button
                        onClick={() => prepareToCancel(order.orderNumber)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal xem chi tiết đơn hàng */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
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
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
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