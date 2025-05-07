import React, { useState, useEffect, useCallback } from 'react';
import { Laptop, Monitor, Keyboard, Mouse, HardDrive, Cable, Usb } from 'lucide-react';
import HeroBanner from '@/components/common/HeroBanner';
import CategoryCard from '@/components/common/CategoryCard';
import ProductCard from '@/components/product/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { Product } from '@/types/product';
import { IMAGES_BASE_URL, API_BASE_URL, ENDPOINTS } from '@/config/api';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Autoplay from 'embla-carousel-autoplay';

const HomePage: React.FC = () => {
  const { products, isLoading: productsLoading, error: productsError } = useProducts({ limit: 8, is_featured: true });
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { brands, isLoading: brandsLoading, error: brandsError } = useBrands();
  
  // State để lưu trữ sản phẩm theo danh mục
  const [categoryProducts, setCategoryProducts] = useState<Record<number, {
    products: Product[], 
    isLoading: boolean, 
    error: Error | null
  }>>({});

  // Map category slugs to appropriate icons
  const getCategoryIcon = (slug: string) => {
    switch(slug) {
      case 'laptops':
      case 'gaming-laptops':
      case 'business-laptops':
      case 'ultrabooks':
        return <Laptop className="w-6 h-6" />;
      case 'monitors':
        return <Monitor className="w-6 h-6" />;
      case 'keyboards':
        return <Keyboard className="w-6 h-6" />;
      case 'mouses':
        return <Mouse className="w-6 h-6" />;
      case 'hubs':
        return <Usb className="w-6 h-6" />;
      case 'chargers':
        return <Cable className="w-6 h-6" />;
      case 'accessories':
      default:
        return <HardDrive className="w-6 h-6" />;
    }
  };

  // Tải sản phẩm cho mỗi danh mục
  useEffect(() => {
    if (!categories || categories.length === 0) return;

    // Chỉ lấy các danh mục cha
    const parentCategories = categories.filter(category => {
      const anyCategory = category as any;
      return anyCategory.parent_id === null;
    });

    // Lấy tối đa 5 danh mục để hiển thị
    const categoriesToShow = parentCategories.slice(0, 5);
    console.log(categoriesToShow);
    // Lấy sản phẩm cho mỗi danh mục
    categoriesToShow.forEach(category => {
      const fetchCategoryProducts = async () => {
        try {
          // Cập nhật trạng thái loading
          setCategoryProducts(prev => ({
            ...prev,
            [category.id]: { products: [], isLoading: true, error: null }
          }));
          
          const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PRODUCTS}?category_id=${category.id}&limit=8`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch products for category ${category.name}`);
          }
          
          const data = await response.json();
          
          setCategoryProducts(prev => ({
            ...prev,
            [category.id]: { 
              products: data.items || [], 
              isLoading: false, 
              error: null 
            }
          }));
        } catch (error) {
          console.error(`Error fetching products for category ${category.name}:`, error);
          setCategoryProducts(prev => ({
            ...prev,
            [category.id]: { 
              products: [], 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Unknown error') 
            }
          }));
        }
      };
      
      fetchCategoryProducts();
    });
  }, [categories]);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <HeroBanner />

         {/* Brand Highlights */}
      <section>
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Thương hiệu nổi bật</h2>
          {brandsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : brandsError ? (
            <div className="py-8 text-center text-destructive">
              <p>Không thể tải thương hiệu. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {brands.map((brand) => (
                <div 
                  key={brand.id} 
                  className="flex justify-center items-center p-6 border border-border rounded-lg hover:border-primary transition-colors"
                >
                  <img
                    src={(brand.logoUrl || brand.logo_url) 
                      ? `${IMAGES_BASE_URL}${brand.logoUrl || brand.logo_url}` 
                      : `${IMAGES_BASE_URL}placeholder.jpg`}
                    alt={`logo ${brand.name}`}
                    className="h-16 object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories section */}
      <section>
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Danh mục sản phẩm</h2>
          
          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : categoriesError ? (
            <div className="py-8 text-center text-destructive">
              <p>Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <Carousel
              className="w-full relative"
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                }),
              ]}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {categories.map((category) => {
                  const anyCategory = category as any;
                  // Sử dụng image_url nếu có, nếu không thì dùng icon mặc định
                  const icon = anyCategory.image_url 
                    ? <img 
                        src={`${IMAGES_BASE_URL}${anyCategory.image_url}`} 
                        alt={category.name} 
                        className="w-12 h-12 object-contain" 
                      />
                    : <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        {getCategoryIcon(category.slug)}
                      </div>;
                  
                  return (
                    <CarouselItem key={category.id} className="pl-2 md:pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 transition-all duration-300 hover:scale-[1.02]">
                      <div className="p-1 h-full">
                        <CategoryCard
                          icon={icon}
                          title={category.name}
                          link={`/${category.slug}`}
                        />
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none">
                <CarouselPrevious className="pointer-events-auto opacity-70 hover:opacity-100" />
                <CarouselNext className="pointer-events-auto opacity-70 hover:opacity-100" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Sản phẩm nổi bật</h2>
          
          {productsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : productsError ? (
            <div className="py-8 text-center text-destructive">
              <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Category Product Sections */}
      {!categoriesLoading && !categoriesError && categories
        .filter(category => {
          const anyCategory = category as any;
          return anyCategory.parent_id === null;
        })
        .slice(0, 5) // Chỉ hiển thị 5 danh mục đầu tiên
        .map((category, index) => {
          const categoryData = categoryProducts[category.id];
          const anyCategory = category as any;
          
          // Chỉ hiển thị section nếu có sản phẩm
          if (!categoryData || categoryData.products.length === 0) return null;
          
          // Xen kẽ màu nền cho các phần
          const bgClass = index % 2 === 0 ? "bg-background" : "bg-muted/30";
          
          return (
            <section key={category.id} className={`py-12 ${bgClass}`}>
              <div className="container max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                      {anyCategory.image_url 
                        ? <img 
                            src={`${IMAGES_BASE_URL}${anyCategory.image_url}`} 
                            alt={category.name} 
                            className="w-10 h-10 object-contain" 
                          />
                        : getCategoryIcon(category.slug)} 
                      {category.name}
                    </h2>
                    <p className="text-muted-foreground">Khám phá bộ sưu tập {category.name} mới nhất</p>
                  </div>
                  <Link to={`/${category.slug}`}>
                    <Button variant="outline" className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors">
                      Xem tất cả <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {categoryData.isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : categoryData.error ? (
                  <div className="py-8 text-center text-destructive">
                    <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
                  </div>
                ) : (
                  <Carousel
                    className="w-full relative" 
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 5000,
                        stopOnInteraction: true,
                      }),
                    ]}
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {categoryData.products.map((product) => (
                        <CarouselItem key={product.id} className="pl-2 md:pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 transition-all duration-300 hover:scale-[1.02]">
                          <div className="p-1 h-full">
                            <ProductCard product={product} className="h-full" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none">
                      <CarouselPrevious className="pointer-events-auto opacity-70 hover:opacity-100" />
                      <CarouselNext className="pointer-events-auto opacity-70 hover:opacity-100" />
                    </div>
                  </Carousel>
                )}
              </div>
            </section>
          );
        })
      }
     
    </div>
  );
};

export default HomePage;