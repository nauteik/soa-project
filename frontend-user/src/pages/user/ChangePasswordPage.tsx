import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema Zod cho validate form
const passwordSchema = z.object({
  currentPassword: z.string()
    .min(1, { message: 'Vui lòng nhập mật khẩu hiện tại' }),
  newPassword: z.string()
    .min(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    .regex(/^\S+$/, { message: 'Mật khẩu không được chứa khoảng trắng' }),
  confirmPassword: z.string()
    .min(1, { message: 'Vui lòng xác nhận mật khẩu mới' })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const ChangePasswordPage = () => {
  const { changePassword } = useAuth();
  
  // State cho loading
  const [isUpdating, setIsUpdating] = useState(false);
  
  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });
  
  // Xử lý đổi mật khẩu
  const onSubmit = async (data: PasswordFormData) => {
    try {
      setIsUpdating(true);
      
      await changePassword(data.currentPassword, data.newPassword);
      
      // Reset form sau khi đổi mật khẩu thành công
      reset();
      
      toast.success('Đổi mật khẩu thành công');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đổi mật khẩu thất bại';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-lg font-medium mb-4">Đổi mật khẩu</h2>
      
      <div className="mb-4">
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Mật khẩu hiện tại
        </label>
        <input
          type="password"
          id="currentPassword"
          {...register('currentPassword')}
          className={`w-full rounded-md border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0`}
        />
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
        )}
      </div>
      
      <div className="mb-4">
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Mật khẩu mới
        </label>
        <input
          type="password"
          id="newPassword"
          {...register('newPassword')}
          className={`w-full rounded-md border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0`}
        />
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự và không được chứa khoảng trắng</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Xác nhận mật khẩu mới
        </label>
        <input
          type="password"
          id="confirmPassword"
          {...register('confirmPassword')}
          className={`w-full rounded-md border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0`}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>
      
      <div className="mt-6">
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isUpdating ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordPage; 