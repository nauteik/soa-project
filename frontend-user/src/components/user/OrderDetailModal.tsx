import React from 'react';
import { 
  Order, 
  OrderItem, 
  orderStatusColors, 
  OrderStatus 
} from '../../types/order';
import { formatCurrency } from '../../utils/format';
import { IMAGES_BASE_URL } from '../../config/api';
import { X } from 'lucide-react';

type OrderDetailModalProps = {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
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

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chi tiết đơn hàng #{order.orderNumber}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Thông tin chung đơn hàng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Thông tin đơn hàng</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đặt hàng:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusColors[order.status]}`}>
                      {order.statusDisplayName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Thanh toán</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phương thức:</span>
                    <span>{order.paymentMethodDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.paymentStatusDisplayName}
                    </span>
                  </div>
                  {order.paymentTransactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-mono">{order.paymentTransactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Địa chỉ giao hàng */}
            {order.shippingAddress && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Địa chỉ giao hàng</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p className="text-sm">{order.shippingAddress.mobileNo}</p>
                  <p className="text-sm mt-1">
                    {order.shippingAddress.fullAddress}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                  </p>
                </div>
              </div>
            )}
            
            {/* Lịch sử trạng thái */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Lịch sử trạng thái</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 bg-gray-50 p-3 rounded-md">
                  {[...order.statusHistory]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(history => (
                    <div key={history.id} className="border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          <p className="font-medium text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${orderStatusColors[history.status]}`}>
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
              </div>
            )}
            
            {/* Danh sách sản phẩm */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Sản phẩm</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item: OrderItem) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {item.productImage ? (
                                <img 
                                  className="h-10 w-10 rounded-md object-cover" 
                                  src={item.productImage.startsWith('http') 
                                    ? item.productImage 
                                    : `${IMAGES_BASE_URL}${item.productImage}`} 
                                  alt={item.productName} 
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                  No img
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                              {item.discount && item.discount > 0 && (
                                <div className="text-xs text-red-600">-{item.discount}%</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {item.statusDisplayName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Tổng cộng:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Ghi chú */}
            {order.notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Ghi chú</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm italic">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal; 