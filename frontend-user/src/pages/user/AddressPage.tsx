import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import AddressFormModal from '../../components/common/AddressFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Home, Check, Edit2, Trash2, Star } from 'lucide-react';
import { 
  getUserAddresses, 
  deleteUserAddress, 
  setDefaultAddress, 
  addUserAddress, 
  updateUserAddress,
  Address as AddressType, 
  AddressResponse 
} from '../../services/addressApi';

const AddressPage = () => {
  const { user } = useAuth();
  
  // State cho danh sách địa chỉ
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State cho modal thêm/sửa địa chỉ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressType | undefined>(undefined);
  
  // State cho dialog xóa địa chỉ
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  
  // Fetch danh sách địa chỉ khi component được mount
  useEffect(() => {
    fetchAddresses();
  }, []);
  
  // Hàm lấy danh sách địa chỉ từ API
  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const addressesData = await getUserAddresses();
      setAddresses(addressesData);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoadingAddresses(false);
    }
  };
  
  // Xử lý đặt địa chỉ mặc định
  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      setIsUpdating(true);
      
      await setDefaultAddress(addressId);
      
      // Cập nhật UI - đảm bảo chỉ có một địa chỉ mặc định
      setAddresses(prevAddresses => 
        prevAddresses.map(address => ({
          ...address,
          isDefault: address.id === addressId
        }))
      );
      
      toast.success('Đã đặt địa chỉ mặc định');
    } catch (error) {
      toast.error('Không thể đặt địa chỉ mặc định');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Xử lý mở dialog xóa địa chỉ
  const handleDeleteClick = (addressId: number) => {
    setAddressToDelete(addressId);
    setIsDeleteDialogOpen(true);
  };
  
  // Xử lý xóa địa chỉ
  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    
    try {
      setIsUpdating(true);
      
      await deleteUserAddress(addressToDelete);
      
      // Cập nhật UI
      setAddresses(prevAddresses => 
        prevAddresses.filter(address => address.id !== addressToDelete)
      );
      
      toast.success('Đã xóa địa chỉ');
    } catch (error) {
      toast.error('Không thể xóa địa chỉ');
    } finally {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };
  
  // Xử lý mở modal thêm địa chỉ mới
  const handleAddNewAddress = () => {
    setCurrentAddress(undefined);
    setIsModalOpen(true);
  };
  
  // Xử lý mở modal chỉnh sửa địa chỉ
  const handleEditAddress = (address: AddressResponse) => {
    setCurrentAddress({
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
      isDefault: address.isDefault
    });
    setIsModalOpen(true);
  };
  
  // Xử lý lưu địa chỉ (thêm mới hoặc cập nhật)
  const handleSaveAddress = async (addressData: AddressType): Promise<void> => {
    try {
      // Đảm bảo không thay đổi trạng thái isDefault từ form
      const formData = { ...addressData, isDefault: false };
      
      if (formData.id) {
        // Cập nhật địa chỉ
        const updatedAddress = await updateUserAddress(formData.id, formData);
        
        // Cập nhật danh sách địa chỉ, giữ nguyên trạng thái isDefault hiện tại
        setAddresses(prevAddresses => 
          prevAddresses.map(address => 
            address.id === updatedAddress.id ? {
              ...updatedAddress,
              isDefault: address.isDefault // Giữ nguyên trạng thái isDefault hiện tại
            } : address
          )
        );
        
        toast.success('Đã cập nhật địa chỉ');
      } else {
        // Thêm địa chỉ mới
        const newAddress = await addUserAddress({
          ...formData,
          fullName: formData.fullName || user?.name || '',
          mobileNo: formData.mobileNo || user?.mobileNumber || ''
        });
        
        // Cập nhật danh sách địa chỉ
        setAddresses(prevAddresses => [...prevAddresses, newAddress]);
        
        toast.success('Đã thêm địa chỉ mới');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Không thể lưu địa chỉ');
      throw error; // Ném lỗi để modal xử lý
    }
  };

  // Sắp xếp địa chỉ: địa chỉ mặc định lên đầu tiên
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });
  
  // Phần hiển thị UI
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Địa chỉ của tôi</h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm transition-colors"
          onClick={handleAddNewAddress}
          disabled={isLoadingAddresses || isUpdating}
        >
          <Home className="mr-2 h-4 w-4" />
          Thêm địa chỉ mới
        </button>
      </div>
      
      {isLoadingAddresses ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
          <p className="text-lg font-medium">Bạn chưa có địa chỉ nào</p>
          <p className="mt-1 text-gray-500">Thêm địa chỉ mới để dễ dàng thanh toán</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
            onClick={handleAddNewAddress}
          >
            <Home className="mr-2 h-4 w-4" />
            Thêm địa chỉ mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedAddresses.map(address => (
            <div 
              key={address.id} 
              className={`relative rounded-lg border transition-all duration-200 ${
                address.isDefault 
                  ? 'border-primary shadow-md bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Badge cho địa chỉ mặc định */}
              {address.isDefault && (
                <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full px-2 py-1 text-xs font-semibold shadow-sm flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  Mặc định
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-base">{address.fullName}</div>
                    <div className="text-sm text-gray-600 mt-1">{address.mobileNo}</div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-600 border-t pt-3 border-dashed">
                  <div className="flex">
                    <MapPin className="min-w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      {address.fullAddress}
                      {address.postalCode && `, ${address.postalCode}`}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t flex justify-between">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="flex items-center text-gray-600 hover:text-primary transition-colors"
                      onClick={() => handleEditAddress(address)}
                      disabled={isUpdating}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      <span className="text-sm">Sửa</span>
                    </button>
                    
                    <button
                      type="button"
                      className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                      onClick={() => handleDeleteClick(address.id)}
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="text-sm">Xóa</span>
                    </button>
                  </div>
                  
                  {!address.isDefault && (
                    <button
                      type="button"
                      className="flex items-center text-primary hover:text-primary-dark transition-colors"
                      onClick={() => handleSetDefaultAddress(address.id)}
                      disabled={isUpdating}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      <span className="text-sm">Đặt mặc định</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal thêm/sửa địa chỉ */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        initialAddress={currentAddress}
      />

      {/* Dialog xác nhận xóa địa chỉ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa địa chỉ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressPage; 