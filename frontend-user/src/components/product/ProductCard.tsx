import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';
import { IMAGES_BASE_URL } from '@/config/api';
import { formatVND } from '@/utils/formatters';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { id, name, slug, price, discount, images, specifications, category } = product;
  
  // Find the main image or use the first one
  const mainImage = images && images.length > 0 
    ? images.find(img => img.is_main) || images[0] 
    : null;
    
  // Fixed: Add proper null checking for image_url
  const imageUrl = mainImage && mainImage.image_url
    ? `${IMAGES_BASE_URL}${mainImage.image_url}` 
    : '/static/images/placeholder.jpg'; // Use a fallback image path that exists
    
  // Calculate the discounted price
  const discountedPrice = price * (1 - discount / 100);
  
  // Get rating from specifications if available
  const rating = specifications?.rating || 0;
  
  // Tạo URL sản phẩm theo định dạng mới nếu có category, nếu không thì dùng format cũ
  const productUrl = category?.slug 
    ? `/${category.slug}/${slug}` 
    : `/product/${slug}`;
  
  return (
    <div className={cn(
      "group rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-md",
      className
    )}>
      {/* Product image with discount badge */}
      <div className="aspect-square relative overflow-hidden">
        <Link to={productUrl}>
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Add error handler to replace broken images with a placeholder
              (e.target as HTMLImageElement).src = '/static/images/placeholder.jpg';
            }}
          />
        </Link>
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-destructive text-white text-xs font-medium px-2 py-1 rounded">
            -{discount}%
          </div>
        )}

        {/* Quick add to cart button */}
        <AddToCartButton
          productId={id}
          className="absolute bottom-0 left-0 right-0 py-2 flex items-center justify-center gap-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0 rounded-none"
          showIcon={true}
          buttonType="primary"
          quantity={1}
        />
      </div>

      {/* Product details */}
      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              className={cn(
                "h-4 w-4", 
                rating && i < Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"
              )}
            />
          ))}
          <span className="text-muted-foreground text-xs ml-1">
            {rating ? rating.toFixed(1) : "N/A"}
          </span>
        </div>

        {/* Name */}
        <Link to={productUrl}>
          <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-1 flex items-center gap-2">
          <span className="font-bold text-foreground">
            {formatVND(discountedPrice)}
          </span>
          
          {discount > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatVND(price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;