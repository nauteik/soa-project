import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AddressFormData {
  id?: number;
  fullName: string;
  mobileNo: string;
  fullAddress: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isDefault: boolean;
}

interface ValidationErrors {
  fullName?: string;
  mobileNo?: string;
  fullAddress?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressFormData) => Promise<void>;
  initialAddress?: AddressFormData;
}

const AddressFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialAddress
}: AddressFormModalProps) => {
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: '',
    mobileNo: '',
    fullAddress: '',
    street: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    postalCode: '',
    isDefault: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldUpdateFullAddress, setShouldUpdateFullAddress] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialAddress) {
      setFormData(initialAddress);
      // Khi chỉnh sửa địa chỉ, không tự động cập nhật địa chỉ đầy đủ ngay lập tức
      setShouldUpdateFullAddress(false);
    } else {
      setFormData({
        fullName: '',
        mobileNo: '',
        fullAddress: '',
        street: '',
        ward: '',
        district: '',
        city: '',
        country: 'Việt Nam',
        postalCode: '',
        isDefault: false
      });
      setShouldUpdateFullAddress(true);
    }
    // Reset errors và touched khi mở modal mới
    setErrors({});
    setTouched({});
  }, [initialAddress, isOpen]);

  // Tự động cập nhật địa chỉ đầy đủ khi các trường con thay đổi
  useEffect(() => {
    if (!shouldUpdateFullAddress) return;
    
    const addressParts = [
      formData.street,
      formData.ward,
      formData.district,
      formData.city,
      formData.country !== 'Việt Nam' ? formData.country : ''
    ].filter(part => part && part.trim() !== '');
    
    if (addressParts.length > 0) {
      const fullAddress = addressParts.join(', ');
      setFormData(prev => ({
        ...prev,
        fullAddress
      }));
    }
  }, [formData.street, formData.ward, formData.district, formData.city, formData.country, shouldUpdateFullAddress]);

  // Xác thực dữ liệu
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Họ tên không được để trống';
        if (value.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
        if (value.trim().length > 100) return 'Họ tên không được vượt quá 100 ký tự';
        if (!/^[A-Za-zÀ-ỹ\s]+$/.test(value.trim())) return 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
        break;
      case 'mobileNo':
        if (!value.trim()) return 'Số điện thoại không được để trống';
        if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(value.trim())) 
          return 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 10 số)';
        break;
      case 'fullAddress':
        if (!value.trim()) return 'Địa chỉ đầy đủ không được để trống';
        if (value.trim().length < 10) return 'Địa chỉ đầy đủ phải có ít nhất 10 ký tự';
        break;
      case 'street': 
        if (value.trim() && value.trim().length > 255) return 'Đường/Số nhà không được vượt quá 255 ký tự';
        break;
      case 'ward': 
        if (value.trim() && value.trim().length > 100) return 'Phường/Xã không được vượt quá 100 ký tự';
        break;
      case 'district': 
        if (value.trim() && value.trim().length > 100) return 'Quận/Huyện không được vượt quá 100 ký tự';
        break;
      case 'city': 
        if (value.trim() && value.trim().length > 100) return 'Tỉnh/Thành phố không được vượt quá 100 ký tự';
        break;
      case 'postalCode':
        if (value.trim() && !/^\d{5,6}$/.test(value.trim())) return 'Mã bưu điện phải có 5-6 chữ số';
        break;
      default:
        return undefined;
    }
    return undefined;
  };

  // Validate toàn bộ form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validate từng trường
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const fieldError = validateField(key, value);
        if (fieldError) {
          newErrors[key as keyof ValidationErrors] = fieldError;
        }
      }
    });
    
    setErrors(newErrors);
    
    // Form hợp lệ nếu không có lỗi
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý khi trường bị thay đổi
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    // Cập nhật giá trị
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Đánh dấu trường đã được tương tác
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate trường khi thay đổi
    if (typeof value === 'string') {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }

    // Khi người dùng thay đổi một trong các trường địa chỉ, bật lại auto update
    if (['street', 'ward', 'district', 'city', 'country'].includes(name)) {
      setShouldUpdateFullAddress(true);
    }
  };

  // Xử lý khi trường bị mất focus
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Đánh dấu trường đã được tương tác
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate trường khi mất focus
    if (typeof value === 'string') {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Xử lý lưu địa chỉ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Đánh dấu tất cả các trường đã được tương tác
    const allTouched = Object.keys(formData).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    // Validate toàn bộ form
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Không thể lưu địa chỉ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý khi người dùng thủ công tạo lại địa chỉ từ các trường nhỏ
  const handleGenerateFullAddress = () => {
    const addressParts = [
      formData.street,
      formData.ward,
      formData.district,
      formData.city,
      formData.country
    ].filter(part => part && part.trim() !== '');
    
    if (addressParts.length > 0) {
      const fullAddress = addressParts.join(', ');
      setFormData(prev => ({
        ...prev,
        fullAddress
      }));
      
      // Validate lại địa chỉ đầy đủ
      const error = validateField('fullAddress', fullAddress);
      setErrors(prev => ({
        ...prev,
        fullAddress: error
      }));
      
      toast.success('Đã tạo địa chỉ đầy đủ');
    } else {
      toast.error('Vui lòng nhập ít nhất một thành phần địa chỉ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">
            {initialAddress?.id ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {/* Thông tin cá nhân */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.fullName && touched.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  required
                />
                {errors.fullName && touched.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                )}
              </div>
              <div>
                <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="mobileNo"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.mobileNo && touched.mobileNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  required
                />
                {errors.mobileNo && touched.mobileNo && (
                  <p className="mt-1 text-xs text-red-500">{errors.mobileNo}</p>
                )}
              </div>
            </div>

            {/* Thông tin địa chỉ chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Đường/Số nhà <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.street && touched.street ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="VD: 468 Lê Trọng Tấn"
                  required
                />
                {errors.street && touched.street && (
                  <p className="mt-1 text-xs text-red-500">{errors.street}</p>
                )}
              </div>
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                  Phường/Xã <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ward"
                  name="ward"
                  value={formData.ward || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.ward && touched.ward ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="VD: Phường Tây Thạnh"
                  required
                />
                {errors.ward && touched.ward && (
                  <p className="mt-1 text-xs text-red-500">{errors.ward}</p>
                )}
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                  Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.district && touched.district ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="VD: Quận Tân Phú"
                  required
                />
                {errors.district && touched.district && (
                  <p className="mt-1 text-xs text-red-500">{errors.district}</p>
                )}
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.city && touched.city ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="VD: TP. Hồ Chí Minh"
                  required
                />
                {errors.city && touched.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                )}
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Quốc gia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.country && touched.country ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  required
                />
                {errors.country && touched.country && (
                  <p className="mt-1 text-xs text-red-500">{errors.country}</p>
                )}
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Mã bưu điện</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.postalCode && touched.postalCode ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="VD: 70000"
                />
                {errors.postalCode && touched.postalCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
                )}
              </div>
            </div>

            {/* Địa chỉ đầy đủ */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700">
                  Địa chỉ đầy đủ <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateFullAddress}
                  className="text-xs text-primary hover:text-primary-dark"
                >
                  Tạo từ thông tin bên trên
                </button>
              </div>
              <textarea
                id="fullAddress"
                name="fullAddress"
                value={formData.fullAddress}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                className={`mt-1 block w-full px-3 py-2 border ${errors.fullAddress && touched.fullAddress ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-gray-50`}
                required
                placeholder="Địa chỉ đầy đủ sẽ được tự động tạo từ các trường thông tin ở trên"
                readOnly={shouldUpdateFullAddress}
              />
              {errors.fullAddress && touched.fullAddress ? (
                <p className="mt-1 text-xs text-red-500">{errors.fullAddress}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  {shouldUpdateFullAddress 
                    ? "Địa chỉ đầy đủ đang được tự động cập nhật từ các trường bên trên" 
                    : "Bạn có thể chỉnh sửa trực tiếp hoặc nhấn 'Tạo từ thông tin bên trên' để cập nhật"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressFormModal; 