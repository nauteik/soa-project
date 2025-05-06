import React, { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  productId: number;
  className?: string;
  label?: string;
  buttonType?: 'primary' | 'secondary' | 'outline';
  showIcon?: boolean;
  disabled?: boolean;
  quantity?: number;
  onSuccess?: () => void;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  className = '',
  label = 'Thêm vào giỏ hàng',
  buttonType = 'primary',
  showIcon = true,
  disabled = false,
  quantity = 1,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }

    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await addToCart({ productId, quantity });
      
      // Hiệu ứng thành công
      const button = document.getElementById(`add-to-cart-${productId}`);
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => {
          button.classList.remove('animate-pulse');
        }, 1000);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xác định style cho button dựa trên buttonType
  let buttonStyle = '';
  
  switch (buttonType) {
    case 'primary':
      buttonStyle = 'bg-primary text-white hover:bg-primary-dark focus:ring-primary';
      break;
    case 'secondary':
      buttonStyle = 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary';
      break;
    case 'outline':
      buttonStyle = 'bg-white text-primary border border-primary hover:bg-gray-50 focus:ring-primary';
      break;
    default:
      buttonStyle = 'bg-primary text-white hover:bg-primary-dark focus:ring-primary';
  }

  return (
    <button
      id={`add-to-cart-${productId}`}
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={`${buttonStyle} rounded-md px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Đang thêm...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
          {label}
        </span>
      )}
    </button>
  );
};

export default AddToCartButton; 