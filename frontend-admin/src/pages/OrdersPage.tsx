import { Search, Filter, Eye, Check, X } from 'lucide-react';
import { useState } from 'react';

interface Order {
  id: string;
  customerName: string;
  date: string;
  total: string;
  status: 'completed' | 'processing' | 'pending' | 'cancelled';
  payment: 'paid' | 'unpaid';
  items: number;
}

const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data cho đơn hàng
  const orders: Order[] = [
    { 
      id: 'ORD-1234', 
      customerName: 'Nguyễn Văn A', 
      date: '15/07/2023', 
      total: '1,250,000đ',
      status: 'completed',
      payment: 'paid',
      items: 3
    },
    { 
      id: 'ORD-1235', 
      customerName: 'Trần Thị B', 
      date: '14/07/2023', 
      total: '2,450,000đ',
      status: 'processing',
      payment: 'paid',
      items: 5
    },
    { 
      id: 'ORD-1236', 
      customerName: 'Lê Văn C', 
      date: '14/07/2023', 
      total: '850,000đ',
      status: 'pending',
      payment: 'unpaid',
      items: 2
    },
    { 
      id: 'ORD-1237', 
      customerName: 'Phạm Thị D', 
      date: '13/07/2023', 
      total: '3,200,000đ',
      status: 'completed',
      payment: 'paid',
      items: 7
    },
    { 
      id: 'ORD-1238', 
      customerName: 'Hoàng Văn E', 
      date: '12/07/2023', 
      total: '1,650,000đ',
      status: 'cancelled',
      payment: 'unpaid',
      items: 4
    },
  ];

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'processing':
        return 'Đang giao';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý đơn hàng</h1>
          <p className="text-gray-600">Quản lý và xử lý đơn hàng</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50">
              <Filter size={18} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">{order.id}</div>
                    <div className="text-xs text-gray-500">{order.items} sản phẩm</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.total}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.payment === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="Xem chi tiết">
                        <Eye size={18} />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900" title="Xác nhận">
                            <Check size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Hủy">
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> của <span className="font-medium">5</span> đơn hàng
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 border border-blue-500 rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersPage; 