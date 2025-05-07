import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, IMAGES_BASE_URL } from '../../config/api';
import { toast } from 'sonner';
import Modal from 'react-modal';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Cấu hình Modal để accessibility
Modal.setAppElement('#root');

// Style cho modal
const customModalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '400px',
    width: '100%',
    padding: '24px',
    borderRadius: '8px',
  }
};

// Schema Zod cho validate form
const profileSchema = z.object({
  name: z.string()
    .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
    .max(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
    .regex(/^[A-Za-zÀ-ỹ\s]+$/, { message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' }),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  mobileNumber: z.string()
    .refine(val => !val || /(0|\+84)[35789][0-9]{8}$/.test(val), {
      message: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 hoặc +84 và có 10 số.'
    }),
  profileImage: z.string().optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, updateProfile, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State cho loading
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State cho modal xác nhận xóa ảnh
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // React Hook Form
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      mobileNumber: '',
      profileImage: ''
    }
  });
  
  // Cập nhật form khi user thay đổi
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        profileImage: user.profileImage || '',
      });
      
      if (user.profileImage) {
        // Xử lý hiển thị ảnh đại diện
        if (user.profileImage.startsWith('http')) {
          setPreviewUrl(user.profileImage);
        } else {
          // Ghép với base URL của S3
          setPreviewUrl(`${IMAGES_BASE_URL}${user.profileImage}`);
        }
      }
    }
  }, [user, reset]);
  
  // Xử lý chọn ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Tạo URL để xem trước ảnh
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };
  
  // Xử lý click vào button chọn ảnh
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Hàm upload ảnh
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Sửa API URL để đúng với FileUploadController
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi tải lên ảnh');
      }
      
      const data = await response.json();
      // Chỉ trả về tên file để lưu vào DB, không cần đường dẫn đầy đủ
      return data.filename;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };
  
  // Mở modal xác nhận xóa ảnh
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // Đóng modal xác nhận xóa ảnh
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };
  
  // Xử lý xóa ảnh đại diện
  const handleDeleteProfileImage = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      closeDeleteModal(); // Đóng modal
      
      // Xóa file ảnh từ server nếu có
      const currentProfileImage = user.profileImage;
      if (currentProfileImage) {
        // Lấy tên file từ đường dẫn
        const filename = currentProfileImage.includes('/') 
          ? currentProfileImage.split('/').pop() 
          : currentProfileImage;
          
        try {
          // Gửi request xóa file đến backend
          const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload/image/${filename}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`Không thể xóa file ảnh từ server, nhưng vẫn tiếp tục cập nhật profile. Status: ${response.status}`);
          }
        } catch (fileError) {
          // Ghi log lỗi nhưng vẫn tiếp tục xử lý (cập nhật thông tin người dùng)
          console.error('Lỗi khi xóa file từ server:', fileError);
        }
      }
      
      // Cập nhật profile
      setValue('profileImage', '');
      
      // Cập nhật profile trên server
      await updateProfile({
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        profileImage: ''
      });
      
      // Cập nhật UI
      setPreviewUrl(null);
      
      toast.success('Đã xóa ảnh đại diện');
    } catch (error) {
      toast.error('Không thể xóa ảnh đại diện');
      console.error('Lỗi khi xóa ảnh:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Xử lý cập nhật thông tin cá nhân
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      let updatedProfileData = { ...data };
      
      // Nếu người dùng đã chọn file ảnh mới
      if (selectedFile) {
        const filename = await uploadImage(selectedFile);
        updatedProfileData.profileImage = filename;
      }
      
      await updateProfile(updatedProfileData);
      
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cập nhật thất bại');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-lg font-medium mb-4">Thông tin cá nhân</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thông tin cá nhân (2/3 width) */}
          <div className="md:col-span-2 ps-1">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Họ tên phải có ít nhất 2 ký tự và chỉ được chứa chữ cái</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                id="mobileNumber"
                type="tel"
                {...register('mobileNumber')}
                className={`w-full rounded-md border ${errors.mobileNumber ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0`}
              />
              {errors.mobileNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.mobileNumber.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx</p>
            </div>
          </div>
          
          {/* Ảnh đại diện (1/3 width) */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-gray-200 mb-4 relative group">
              {previewUrl ? (
                <>
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Ảnh đại diện" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-lg group-hover:opacity-100 transition-opacity z-10"
                    onClick={openDeleteModal}
                    title="Xóa ảnh"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                  <span className="text-gray-500">Chưa có ảnh</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleSelectFile}
              className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Chọn ảnh
            </button>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isUpdating ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
      
      {/* Dialog xác nhận xóa ảnh sử dụng react-modal */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={closeDeleteModal}
        style={customModalStyles}
        contentLabel="Xác nhận xóa ảnh"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Xác nhận xóa ảnh</h3>
          <p className="text-gray-600 mb-6">
            Bạn có chắc chắn muốn xóa ảnh đại diện này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteProfileImage}
              disabled={isUpdating}
              className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isUpdating ? 'Đang xóa...' : 'Xóa ảnh'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProfilePage; 