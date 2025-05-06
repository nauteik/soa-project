import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ChevronRight } from "lucide-react";
import orderApi, { Order } from "../services/orderApi";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";

const OrderSuccessPage = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchCart } = useCart();
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (orderNumber && !fetchAttempted.current) {
      fetchAttempted.current = true;
      fetchOrderDetails(orderNumber);
      
      // Reload giỏ hàng sau khi đặt hàng thành công
      fetchCart();
    }
  }, [orderNumber, fetchCart]);

  const fetchOrderDetails = async (orderNumber: string) => {
    setLoading(true);
    try {
      const orderData = await orderApi.getOrderDetail(orderNumber);
      setOrder(orderData);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format địa chỉ
  const formatAddress = (order: Order) => {
    if (!order?.shippingAddress) return "";
    const addr = order.shippingAddress;
    return `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`;
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6 md:p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được đơn hàng của bạn và sẽ
          xử lý trong thời gian sớm nhất.
        </p>

        {order && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h2 className="font-semibold mb-3">Chi tiết đơn hàng</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phương thức thanh toán:</span>
                <span className="font-medium">
                  {order.paymentMethod === "COD"
                    ? "Thanh toán khi nhận hàng"
                    : order.paymentMethod === "VNPAY"
                    ? "Thanh toán qua VNPAY"
                    : "Thanh toán qua MoMo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái thanh toán:</span>
                <span className={`font-medium ${order.paymentStatus === "COMPLETED" ? "text-green-600" : "text-yellow-600"}`}>
                  {order.paymentStatus === "COMPLETED"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Địa chỉ giao hàng:</span>
                <div className="font-medium mt-1">{formatAddress(order)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/user/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Xem đơn hàng của tôi
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              Tiếp tục mua sắm
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;