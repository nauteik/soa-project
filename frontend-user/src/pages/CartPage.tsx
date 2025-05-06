import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, PlusCircle, MinusCircle, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { IMAGES_BASE_URL } from '../config/api';
import { formatCurrency } from "@/utils/format";
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const CartPage = () => {
  const { cart, loading, updateCartItem, removeCartItem, clearCart } = useCart();
  const [processingItems, setProcessingItems] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const navigate = useNavigate();

  // Xử lý thay đổi số lượng sản phẩm
  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setProcessingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await updateCartItem(cartItemId, newQuantity);
    } finally {
      setProcessingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const handleRemoveItem = async (cartItemId: number) => {
    setProcessingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await removeCartItem(cartItemId);
      // Xóa item khỏi danh sách đã chọn nếu có
      setSelectedItems(prev => prev.filter(id => id !== cartItemId));
    } finally {
      setProcessingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  // Xóa toàn bộ giỏ hàng
  const handleClearCart = async () => {
    await clearCart();
    setSelectedItems([]);
    setShowClearCartDialog(false);
  };

  // Xử lý chọn/bỏ chọn sản phẩm
  const handleSelectItem = (cartItemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, cartItemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== cartItemId));
    }
  };

  // Chọn tất cả sản phẩm
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cart?.items.map(item => item.id) || []);
    } else {
      setSelectedItems([]);
    }
  };

  // Tính tổng tiền của các sản phẩm đã chọn
  const calculateSelectedTotal = () => {
    if (!cart) return 0;
    return cart.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Số lượng sản phẩm đã chọn
  const selectedItemsCount = selectedItems.length;

  // Kiểm tra xem tất cả sản phẩm có được chọn không
  const isAllSelected = cart?.items.length === selectedItems.length && cart?.items.length > 0;

  // Xử lý chuyển đến trang thanh toán
  const handleProceedToCheckout = () => {
    if (selectedItemsCount > 0) {
      // Lưu danh sách sản phẩm đã chọn vào localStorage
      localStorage.setItem("selectedCartItems", JSON.stringify(selectedItems));
      // Chuyển đến trang thanh toán
      navigate("/checkout");
    } else {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán");
    }
  };

  // Hiển thị khi đang tải
  if (loading && !cart) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Hiển thị khi giỏ hàng trống
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-gray-500 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
          <Link 
            to="/" 
            className="inline-block bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Danh sách sản phẩm */}
        <div className="lg:w-2/3">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium">
              <div className="col-span-1 flex items-center justify-center">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={(checked: boolean | "indeterminate") => handleSelectAll(checked === true)}
                  aria-label="Chọn tất cả sản phẩm"
                />
              </div>
              <div className="col-span-5">Sản phẩm</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>
            
            <div className="divide-y">
              {cart.items.map(item => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                  {/* Checkbox chọn sản phẩm */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked: boolean | "indeterminate") => handleSelectItem(item.id, checked === true)}
                      aria-label={`Chọn ${item.productName}`}
                    />
                  </div>
                  
                  {/* Sản phẩm */}
                  <div className="col-span-1 md:col-span-5">
                    <div className="flex gap-4 items-center">
                      <div className="md:hidden">
                        <Checkbox 
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked: boolean | "indeterminate") => handleSelectItem(item.id, checked === true)}
                          aria-label={`Chọn ${item.productName}`}
                        />
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={item.productImage && item.productImage.startsWith('http') 
                            ? item.productImage 
                            : `${IMAGES_BASE_URL}${item.productImage}`} 
                          alt={item.productName} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/product/${item.productSlug}`} 
                          className="text-sm font-medium text-gray-900 hover:text-primary line-clamp-2"
                        >
                          {item.productName}
                        </Link>
                        <button 
                          className="mt-2 flex items-center text-xs text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={processingItems[item.id]}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Đơn giá */}
                  <div className="col-span-1 md:col-span-2 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.productPrice * (1 - item.productDiscount / 100))}
                      </span>
                      {item.productDiscount > 0 && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatCurrency(item.productPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Số lượng */}
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        className="text-gray-500 hover:text-primary disabled:opacity-50"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || processingItems[item.id]}
                      >
                        <MinusCircle className="h-5 w-5" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        className="text-gray-500 hover:text-primary disabled:opacity-50"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={processingItems[item.id]}
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Thành tiền */}
                  <div className="col-span-1 md:col-span-2 text-right font-medium text-primary">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Xóa giỏ hàng */}
            <div className="p-4 border-t flex justify-between items-center">
              <AlertDialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
                <AlertDialogTrigger asChild>
                  <button 
                    className="text-sm text-red-500 hover:text-red-700 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa giỏ hàng
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa giỏ hàng</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCart} className="bg-red-500 hover:bg-red-600">
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Link 
                to="/" 
                className="text-sm text-primary hover:text-primary-dark"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
        
        {/* Thanh toán */}
        <div className="lg:w-1/3">
          <div className="bg-white shadow-sm rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Đã chọn {selectedItemsCount}/{cart.totalItems} sản phẩm</span>
                <span>{formatCurrency(calculateSelectedTotal())}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
            </div>
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-semibold text-xl text-primary">{formatCurrency(calculateSelectedTotal())}</span>
              </div>
            </div>
            
            <button 
              className="w-full bg-primary text-white py-3 px-4 rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleProceedToCheckout}
              disabled={selectedItemsCount === 0}
            >
              Tiến hành thanh toán ({selectedItemsCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 