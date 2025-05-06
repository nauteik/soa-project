import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, MinusCircle, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductBySlug } from '@/hooks/useProductBySlug';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { IMAGES_BASE_URL } from '@/config/api';
import { formatVND } from '@/utils/formatters';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import AddToCartButton from '@/components/product/AddToCartButton';
import { fetchCategorySpecifications, SpecificationField } from '@/services/productsApi';

const ProductDetail: React.FC = () => {
  // Lấy productSlug từ URL (hỗ trợ cả định dạng URL cũ và mới)
  const { slug, productSlug, categorySlug } = useParams<{ 
    slug?: string,  // Cho đường dẫn cũ /product/:slug
    productSlug?: string,  // Cho đường dẫn mới /:categorySlug/:productSlug
    categorySlug?: string  // Cho đường dẫn mới /:categorySlug/:productSlug
  }>();

  // Ưu tiên sử dụng productSlug từ URL mới nếu có, nếu không thì dùng slug từ URL cũ
  const productSlugToUse = productSlug || slug;
  
  const { product, isLoading, error } = useProductBySlug(productSlugToUse);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [specFields, setSpecFields] = useState<SpecificationField[]>([]);
  
  // Lấy phân cấp danh mục
  const { hierarchy: categoryHierarchy, isLoading: isLoadingHierarchy } = 
    useCategoryHierarchy(product?.category?.id);
  
  // API carousel
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  console.log(product);

  // Thêm map cho trường hợp fallback khi API lỗi
  const specNameFallbackMap: Record<string, string> = {
    'ram_gb': 'RAM',
    'cpu_brand': 'Hãng CPU',
    'cpu_series': 'Dòng CPU',
    'cpu_model': 'Model CPU',
    'screen_size_inch': 'Kích thước màn hình',
    'storage_gb': 'Dung lượng lưu trữ',
    'storage_type': 'Loại ổ cứng',
    'graphics_card': 'Card đồ họa',
    'usage_type': 'Nhu cầu sử dụng',
    'refresh_rate_hz': 'Tần số quét',
    'weight_kg': 'Trọng lượng',
    'battery_life_hours': 'Thời lượng pin',
    'ports': 'Cổng kết nối',
    'features': 'Tính năng đặc biệt',
    'color': 'Màu sắc',
    'os': 'Hệ điều hành'
  };

  // Load specification fields từ API khi product thay đổi
  useEffect(() => {
    // Ưu tiên sử dụng categorySlug từ URL, nếu không có thì dùng slug từ thông tin sản phẩm
    const categorySlugToUse = categorySlug || product?.category?.slug;
    
    if (categorySlugToUse) {
      fetchCategorySpecifications(categorySlugToUse)
        .then(fields => {
          setSpecFields(fields);
        })
        .catch(error => {
          console.error("Error fetching specification fields:", error);
          // Không thay đổi state spec fields khi lỗi
        });
    }
  }, [categorySlug, product?.category?.slug]);

  // Format tên thông số kỹ thuật cho hiển thị
  const formatSpecName = (key: string) => {
    // Tìm label từ specFields nếu có
    const field = specFields.find(field => field.key === key);
    if (field) {
      return field.labelVi;
    }
    
    // Fallback cho trường hợp không tìm thấy field hoặc API lỗi
    return specNameFallbackMap[key] || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  // Đồng bộ hóa giữa carousel và thumbnail
  useEffect(() => {
    if (!carouselApi) return;
    
    const onChange = () => {
      if (!carouselApi) return;
      setActiveImageIndex(carouselApi.selectedScrollSnap());
    };
    
    carouselApi.on("select", onChange);
    return () => {
      carouselApi.off("select", onChange);
    };
  }, [carouselApi]);

  // Tham chiếu để scroll thumbnail container
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  // Xử lý scroll thumbnail container và chuyển đổi hình ảnh
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const thumbnailWidth = 76; // width 64px + gap 8px + padding 4px
      const scrollAmount = direction === 'left' ? -thumbnailWidth * 2 : thumbnailWidth * 2;
      
      // Cuộn mượt với animation
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Chuyển đổi hình ảnh đến hình ảnh trước/tiếp theo
      if (direction === 'left' && activeImageIndex > 0) {
        setActiveImageIndex(prev => prev - 1);
        if (carouselApi) {
          carouselApi.scrollPrev();
        }
      } else if (direction === 'right' && product && product.images && activeImageIndex < product.images.length - 1) {
        setActiveImageIndex(prev => prev + 1);
        if (carouselApi) {
          carouselApi.scrollNext();
        }
      }
    }
  };
  
  // Xử lý khi nhấp vào thumbnail
  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };
  
  // Xử lý thay đổi số lượng
  const incrementQuantity = () => {
    if (product && quantity < product.quantityInStock) {
      setQuantity(quantity + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  // Xử lý thêm vào giỏ hàng
  const handleAddToCartSuccess = () => {
    console.log(`Đã thêm ${quantity} sản phẩm ${product?.name} vào giỏ hàng`);
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Sản phẩm không tìm thấy</h2>
          <p className="text-muted-foreground mb-6">
            {error ? error.message : "Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."}
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-white hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // Tìm hình ảnh chính hoặc sử dụng hình ảnh đầu tiên
  const images = product.images || [];
  const activeImage = images[activeImageIndex] || { image_url: 'placeholder.jpg' };
  const discountedPrice = product.price * (1 - product.discount / 100);
  
  // Get the correct image URL with proper fallback
  const getImageUrl = (imageUrl?: string) => {
    return imageUrl ? `${IMAGES_BASE_URL}${imageUrl}` : '/static/images/placeholder.jpg';
  };
  
  // Tạo URL theo định dạng mới
  const generateProductUrl = (categorySlug: string, productSlug: string) => {
    return `/${categorySlug}/${productSlug}`;
  };
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center flex-wrap text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span className="mx-2">/</span>
        
        {isLoadingHierarchy ? (
          <span>Đang tải...</span>
        ) : categoryHierarchy ? (
          <>
            {/* Hiển thị các danh mục tổ tiên */}
            {categoryHierarchy.ancestors.map((ancestor) => (
              <React.Fragment key={ancestor.id}>
                <Link 
                  to={`/${ancestor.slug}`} 
                  className="hover:text-primary"
                >
                  {ancestor.name}
                </Link>
                <span className="mx-2">/</span>
              </React.Fragment>
            ))}
            
            {/* Hiển thị danh mục hiện tại */}
            <Link 
              to={`/${categoryHierarchy.category.slug}`}
              className="hover:text-primary"
            >
              {categoryHierarchy.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        ) : product.category ? (
          <>
            <Link 
              to={`/${product.category.slug}`} 
              className="hover:text-primary"
            >
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        ) : null}
        
        <span className="text-foreground">{product.name}</span>
      </div>
      
      {/* Bố cục chi tiết sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Cột trái - Hình ảnh sản phẩm */}
        <div className="space-y-6">
          {/* Carousel hình ảnh sản phẩm */}
          {images.length > 0 && (
            <Carousel className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={image.id}>
                    <div className="aspect-square rounded-lg border overflow-hidden bg-white flex items-center justify-center">
                      <img 
                        src={getImageUrl(image.image_url)}
                        alt={`${product.name} - Hình ${index + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/static/images/placeholder.jpg';
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          )}
          
          {/* Thumbnails cho hình ảnh */}
          {images.length > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scrollThumbnails('left')} 
                className="p-2 rounded-md border hover:bg-muted/50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div 
                ref={thumbnailsRef} 
                className="flex overflow-x-auto hide-scrollbar gap-2 py-2"
              >
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => handleThumbnailClick(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded border overflow-hidden bg-white",
                      activeImageIndex === index ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary"
                    )}
                  >
                    <img 
                      src={getImageUrl(image.image_url)}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/static/images/placeholder.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => scrollThumbnails('right')} 
                className="p-2 rounded-md border hover:bg-muted/50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Cột phải - Thông tin sản phẩm */}
        <div className="space-y-6">
          {/* Thương hiệu & Tên sản phẩm */}
          {product.brand && (
            <Link 
              to={`/brand/${product.brand.slug || product.brand.id}`}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          {/* Đánh giá */}
          <div className="flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5",
                    star <= (product.specifications?.rating || 4) 
                      ? "text-amber-400 fill-amber-400" 
                      : "text-gray-300"
                  )} 
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              Dựa trên {product.quantitySold || 0} đánh giá
            </span>
          </div>
          
          {/* Giá */}
          <div className="flex items-baseline space-x-3 pt-2">
            <span className="text-3xl font-bold">
              {formatVND(discountedPrice)}
            </span>
            
            {product.discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatVND(product.price)}
                </span>
                <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>
          
          {/* Tình trạng hàng */}
          {product.quantityInStock > 0 ? (
            <div className="text-sm text-green-600">
              Còn hàng ({product.quantityInStock} sản phẩm có sẵn)
            </div>
          ) : (
            <div className="text-sm text-destructive">
              Hết hàng
            </div>
          )}
          
          {/* Mô tả */}
          {product.description && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Mô tả</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}
          
          {/* Thông số kỹ thuật chính */}
          {product.specifications && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Thông số kỹ thuật chính</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(product.specifications)
                  .filter(([key]) => !['purpose_tags', 'features'].includes(key))
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {formatSpecName(key)}:
                      </span>
                      <span className="text-sm font-medium">
                        {typeof value === 'boolean' ? (value ? 'Có' : 'Không') : String(value)}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          {/* Thêm vào giỏ hàng */}
          <div className="pt-6 border-t">
            <div className="flex items-center space-x-4">
              {/* Bộ chọn số lượng */}
              <div className="flex items-center border rounded-md">
                <button 
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <MinusCircle className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 select-none">{quantity}</span>
                <button 
                  onClick={incrementQuantity}
                  disabled={product.quantityInStock <= quantity}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              </div>
              
              {/* Nút thêm vào giỏ hàng */}
              <AddToCartButton
                productId={product.id}
                quantity={quantity}
                disabled={product.quantityInStock <= 0}
                className="flex-1 py-3"
                onSuccess={handleAddToCartSuccess}
              />
              
              {/* Nút yêu thích */}
              <button
                className="p-3 rounded-md border hover:bg-muted/50"
                aria-label="Thêm vào danh sách yêu thích"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* SKU */}
          {product.sku && (
            <div className="text-sm text-muted-foreground pt-4">
              SKU: {product.sku}
            </div>
          )}
          
          {/* Chia sẻ */}
          <div className="flex items-center space-x-2 pt-4">
            <span className="text-sm text-muted-foreground">Chia sẻ:</span>
            <button className="p-1 hover:text-primary">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Tab chi tiết sản phẩm (có thể mở rộng với các tab bổ sung) */}
      <div className="mt-16 border-t pt-12">
        {/* Nội dung tab - Thông số kỹ thuật đầy đủ */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Thông số kỹ thuật đầy đủ</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
            {product.specifications && Object.entries(product.specifications)
              .filter(([key, value]) => typeof value !== 'object')
              .map(([key, value]) => (
                <div key={key} className="flex py-2 border-b">
                  <span className="w-1/2 text-muted-foreground capitalize">
                    {formatSpecName(key)}
                  </span>
                  <span className="w-1/2 font-medium">
                    {typeof value === 'boolean' ? (value ? 'Có' : 'Không') : 
                     String(value) === 'true' ? 'Có' : 
                     String(value) === 'false' ? 'Không' : 
                     String(value)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;