import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { IMAGES_BASE_URL } from "../config/api";
import { formatCurrency } from "../utils/format";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import orderApi, { CreateOrderRequest } from "../services/orderApi";
import { PaymentMethod } from "../types/order";
import { useAuth } from "../context/AuthContext";
import AddressFormModal from "../components/common/AddressFormModal";
import * as addressApi from "../services/addressApi";

// Schema cho form thanh toán
const checkoutSchema = z.object({
  shippingAddressId: z.number({
    required_error: "Vui lòng chọn địa chỉ giao hàng",
  }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    required_error: "Vui lòng chọn phương thức thanh toán",
  }),
  note: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "Bạn phải đồng ý với điều khoản và điều kiện",
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const { cart, loading: cartLoading } = useCart();
  const [addresses, setAddresses] = useState<addressApi.AddressResponse[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<addressApi.Address | undefined>(undefined);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form với validation
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.COD,
      agreeToTerms: false,
      note: "",
    },
  });

  // Lấy thông tin từ LocalStorage và tải địa chỉ từ API
  useEffect(() => {
    const storedItems = localStorage.getItem("selectedCartItems");
    if (storedItems) {
      setSelectedItems(JSON.parse(storedItems));
    } else {
      // Nếu không có sản phẩm nào được chọn, quay lại trang giỏ hàng
      navigate("/cart");
      toast.error("Vui lòng chọn sản phẩm trước khi thanh toán");
    }

    fetchAddresses();
  }, [navigate, user]);

  // Lấy danh sách địa chỉ từ API
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const addressList = await addressApi.getUserAddresses();
      setAddresses(addressList);
      
      // Đặt địa chỉ mặc định nếu có
      const defaultAddress = addressList.find(addr => addr.isDefault);
      if (defaultAddress) {
        setValue("shippingAddressId", defaultAddress.id || 0);
      } else if (addressList.length > 0) {
        setValue("shippingAddressId", addressList[0].id || 0);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Không thể tải danh sách địa chỉ");
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Xử lý thêm hoặc cập nhật địa chỉ
  const handleSaveAddress = async (addressData: addressApi.Address) => {
    try {
      let savedAddress;
      
      if (addressData.id) {
        savedAddress = await addressApi.updateUserAddress(addressData.id, addressData);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        savedAddress = await addressApi.addUserAddress(addressData);
        toast.success("Thêm địa chỉ mới thành công");
      }
      
      // Làm mới danh sách địa chỉ
      await fetchAddresses();
      
      // Tự động chọn địa chỉ vừa thêm/cập nhật
      setValue("shippingAddressId", savedAddress.id || 0);
      
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Không thể lưu địa chỉ");
    }
  };

  // Lọc các sản phẩm đã chọn từ giỏ hàng
  const selectedCartItems = cart?.items.filter((item) => 
    selectedItems.includes(item.id)
  ) || [];

  // Tính tổng tiền của các sản phẩm đã chọn
  const calculateTotal = () => {
    if (!selectedCartItems.length) return 0;
    return selectedCartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Format địa chỉ đầy đủ
  const formatFullAddress = (address: addressApi.AddressResponse) => {
    return address.fullAddress || `${address.street || ""}, ${address.ward || ""}, ${address.district || ""}, ${address.city || ""}, ${address.country || ""}`.replace(/^[, ]+|[, ]+$/g, '');
  };

  // Xử lý khi gửi form
  const onSubmit = async (values: CheckoutFormValues) => {
    if (selectedCartItems.length === 0) {
      toast.error("Không có sản phẩm nào được chọn để thanh toán");
      return;
    }

    setProcessingOrder(true);
    try {
      const orderData: CreateOrderRequest = {
        cartItemIds: selectedItems,
        shippingAddressId: values.shippingAddressId,
        paymentMethod: values.paymentMethod,
        note: values.note,
      };

      // Gửi yêu cầu tạo đơn hàng
      const response = await orderApi.createOrder(orderData);

      // Xóa dữ liệu đã chọn khỏi localStorage
      localStorage.removeItem("selectedCartItems");

      // Hiển thị thông báo thành công và chuyển hướng đến trang thành công
      toast.success("Đặt hàng thành công!");
      navigate(`/order-success/${response.orderNumber}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Có lỗi xảy ra khi đặt hàng");
    } finally {
      setProcessingOrder(false);
    }
  };

  // Mở modal thêm địa chỉ mới
  const handleAddNewAddress = () => {
    setEditingAddress(undefined);
    setIsAddressModalOpen(true);
  };

  // Mở modal chỉnh sửa địa chỉ
  const handleEditAddress = (address: addressApi.AddressResponse) => {
    // Chuyển đổi từ AddressResponse sang Address để truyền vào form
    const formAddress: addressApi.Address = {
      id: address.id,
      fullName: address.fullName,
      mobileNo: address.mobileNo,
      fullAddress: address.fullAddress,
      street: address.street,
      ward: address.ward,
      district: address.district,
      city: address.city,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    };
    
    setEditingAddress(formAddress);
    setIsAddressModalOpen(true);
  };

  // Hiển thị khi đang tải
  if (cartLoading || loadingAddresses) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form thanh toán */}
        <div className="lg:w-2/3 space-y-6">
          {/* Địa chỉ giao hàng */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
            
            {addresses.length === 0 ? (
              <div className="py-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-md">
                <p className="mb-4">Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới.</p>
                <button
                  onClick={handleAddNewAddress}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                >
                  + Thêm địa chỉ mới
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border p-4 rounded-md cursor-pointer ${
                        watch("shippingAddressId") === address.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      }`}
                      onClick={() => setValue("shippingAddressId", address.id || 0)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <input 
                            type="radio"
                            id={`address-${address.id}`}
                            name="shippingAddressId"
                            value={address.id || 0}
                            checked={watch("shippingAddressId") === address.id}
                            onChange={() => setValue("shippingAddressId", address.id || 0)}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {address.fullName}
                            </span>
                            <span className="text-gray-600">
                              {address.mobileNo}
                            </span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">
                            {formatFullAddress(address)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.shippingAddressId && (
                  <p className="text-sm text-red-500 mt-1">{errors.shippingAddressId.message}</p>
                )}
                
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
                    onClick={handleAddNewAddress}
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
            <div className="space-y-4">
              <label 
                className={`block border p-4 rounded-md cursor-pointer ${watch("paymentMethod") === PaymentMethod.COD ? "border-primary bg-primary/5" : "border-gray-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="radio"
                      id="payment-cod"
                      value={PaymentMethod.COD}
                      {...register("paymentMethod")}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                    <p className="text-gray-600 mt-1">
                      Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng
                    </p>
                  </div>
                </div>
              </label>

              <label 
                className={`block border p-4 rounded-md cursor-pointer ${watch("paymentMethod") === PaymentMethod.VNPAY ? "border-primary bg-primary/5" : "border-gray-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="radio"
                      id="payment-vnpay"
                      value={PaymentMethod.VNPAY}
                      {...register("paymentMethod")}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <span className="font-medium">Thanh toán qua VNPAY</span>
                    <p className="text-gray-600 mt-1">
                      Thanh toán bằng QR Code, thẻ nội địa, thẻ quốc tế qua cổng VNPAY
                    </p>
                  </div>
                </div>
              </label>

              <label 
                className={`block border p-4 rounded-md cursor-pointer ${watch("paymentMethod") === PaymentMethod.MOMO ? "border-primary bg-primary/5" : "border-gray-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="radio"
                      id="payment-momo"
                      value={PaymentMethod.MOMO}
                      {...register("paymentMethod")}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <span className="font-medium">Thanh toán qua Ví MoMo</span>
                    <p className="text-gray-600 mt-1">
                      Thanh toán bằng ví điện tử MoMo
                    </p>
                  </div>
                </div>
              </label>
            </div>
            {errors.paymentMethod && (
              <p className="text-sm text-red-500 mt-1">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Ghi chú đơn hàng */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Ghi chú đơn hàng</h2>
            <textarea
              placeholder="Nhập ghi chú về đơn hàng, ví dụ: thời gian hay địa điểm giao hàng chi tiết"
              className="w-full border border-gray-300 rounded-md p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              rows={3}
              {...register("note")}
            />
            {errors.note && (
              <p className="text-sm text-red-500 mt-1">{errors.note.message}</p>
            )}
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:w-1/3">
          <div className="bg-white shadow-sm rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>

            {/* Danh sách sản phẩm đã chọn */}
            <div className="max-h-80 overflow-y-auto mb-4 pr-1">
              {selectedCartItems.map((item) => (
                <div key={item.id} className="flex gap-4 py-3 border-b last:border-b-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.productImage && item.productImage.startsWith('http') 
                        ? item.productImage 
                        : `${IMAGES_BASE_URL}${item.productImage}`}
                      alt={item.productName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium line-clamp-2">{item.productName}</h3>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-gray-500">
                        {formatCurrency(item.productPrice * (1 - item.productDiscount / 100))} x {item.quantity}
                      </span>
                      <span className="text-sm font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chi tiết thanh toán */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tạm tính</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
            </div>

            {/* Tổng thanh toán */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-semibold text-xl text-primary">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Điều khoản và đặt hàng */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  {...register("agreeToTerms")}
                  className="h-5 w-5 rounded border cursor-pointer mt-0.5 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <label htmlFor="agreeToTerms" className="text-sm cursor-pointer">
                    Tôi đồng ý với các điều khoản và điều kiện
                  </label>
                  {errors.agreeToTerms && (
                    <p className="text-sm text-red-500 mt-1">{errors.agreeToTerms.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  processingOrder || selectedCartItems.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark'
                } text-white transition-colors`}
                disabled={
                  processingOrder ||
                  selectedCartItems.length === 0
                }
              >
                {processingOrder ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  "Đặt hàng"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal thêm/sửa địa chỉ */}
      <AddressFormModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialAddress={editingAddress}
      />
    </div>
  );
};

export default CheckoutPage;