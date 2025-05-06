import { Plus, Search, Filter, Edit, Trash2, Eye, X, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from '@mui/material/Slider';
import { IMAGES_BASE_URL } from '../config/api';
import { 
  fetchAllProducts, 
  extractCategoriesAndBrands, 
  deleteProductById, 
  processImageUrl, 
  ProductDetail 
} from '../services/productApi';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  price: number;
  discount: number;
  quantityInStock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  images?: Array<{
    id: number;
    image_url: string;
    alt_text?: string;
    is_main: boolean;
    sortOrder: number;
  }>;
}

interface FilterOptions {
  status: 'all' | 'active' | 'inactive';
  featured: 'all' | 'featured' | 'not-featured';
  hasDiscount: 'all' | 'discounted' | 'not-discounted';
  category: number | null;
  brand: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minStock: number | null;
  maxStock: number | null;
  sort: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'date_asc' | 'date_desc';
}

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Lọc và sắp xếp
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    featured: 'all',
    hasDiscount: 'all',
    category: null,
    brand: null,
    minPrice: null,
    maxPrice: null,
    minStock: null,
    maxStock: null,
    sort: 'date_desc'
  });
  
  // Danh sách danh mục và thương hiệu để lọc
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [brands, setBrands] = useState<Array<{id: number, name: string}>>([]);
  
  // Thêm state để lưu giá trị min/max của giá và tồn kho
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 100000000});
  const [stockRange, setStockRange] = useState<{min: number, max: number}>({min: 0, max: 100});
  
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Sử dụng API từ productApi.ts
        const data = await fetchAllProducts();
        const productList = data.items || [];
        setProducts(productList);
        
        // Trích xuất danh mục và thương hiệu sử dụng hàm từ productApi.ts
        const { categories, brands } = extractCategoriesAndBrands(productList);
        setCategories(categories);
        setBrands(brands);
        
        // Tính toán giá trị min/max của giá và tồn kho
        if (productList.length > 0) {
          const prices = productList.map((p: Product) => p.price);
          const stocks = productList.map((p: Product) => p.quantityInStock);
          
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const minStock = Math.min(...stocks);
          const maxStock = Math.max(...stocks);
          
          setPriceRange({
            min: minPrice, 
            max: maxPrice > minPrice ? maxPrice : minPrice + 10000000
          });
          
          setStockRange({
            min: minStock,
            max: maxStock > minStock ? maxStock : minStock + 100
          });
          // Đảm bảo filterOptions luôn có giá trị hợp lệ
          setFilterOptions(prev => ({
            ...prev,
            minPrice: prev.minPrice ?? minPrice,
            maxPrice: prev.maxPrice ?? (maxPrice > minPrice ? maxPrice : minPrice + 10000000),
            minStock: prev.minStock ?? minStock,
            maxStock: prev.maxStock ?? (maxStock > minStock ? maxStock : minStock + 100)
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  
  
  // Trích xuất danh mục và thương hiệu từ danh sách sản phẩm - không cần nữa vì đã chuyển vào productApi.ts
  // const extractCategoriesAndBrands = (productsList: Product[]) => {
  //   const uniqueCategories = new Map();
  //   const uniqueBrands = new Map();
  //   
  //   productsList.forEach(product => {
  //     if (product.category) {
  //       uniqueCategories.set(product.category.id, product.category);
  //     }
  //     if (product.brand) {
  //       uniqueBrands.set(product.brand.id, product.brand);
  //     }
  //   });
  //   
  //   setCategories(Array.from(uniqueCategories.values()));
  //   setBrands(Array.from(uniqueBrands.values()));
  // };

  // Lấy hình ảnh chính của sản phẩm
  const getMainImageUrl = (product: Product): string => {
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
      return 'https://via.placeholder.com/50';
    }
    
    // Tìm hình ảnh có is_main = true
    const mainImage = product.images.find(img => img.is_main === true);
    if (mainImage) {
      return processImageUrl(mainImage.image_url);
    }
    
    // Nếu không có hình ảnh chính, lấy hình ảnh đầu tiên
    return processImageUrl(product.images[0].image_url);
  };

  // Tính giá sau khi giảm giá
  const calculateDiscountedPrice = (price: number, discount: number): number => {
    return price * (1 - discount / 100);
  };

  // Lọc và sắp xếp sản phẩm
  const getFilteredAndSortedProducts = () => {
    return products
      .filter(product => {
        // Lọc theo từ khóa tìm kiếm
        const matchesSearch = 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.brand?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Lọc theo trạng thái
        if (filterOptions.status === 'active' && !product.isActive) return false;
        if (filterOptions.status === 'inactive' && product.isActive) return false;
        
        // Lọc theo featured
        if (filterOptions.featured === 'featured' && !product.isFeatured) return false;
        if (filterOptions.featured === 'not-featured' && product.isFeatured) return false;
        
        // Lọc theo giảm giá
        if (filterOptions.hasDiscount === 'discounted' && product.discount <= 0) return false;
        if (filterOptions.hasDiscount === 'not-discounted' && product.discount > 0) return false;
        
        // Lọc theo danh mục
        if (filterOptions.category && product.category?.id !== filterOptions.category) return false;
        
        // Lọc theo thương hiệu
        if (filterOptions.brand && product.brand?.id !== filterOptions.brand) return false;
        
        // Lọc theo khoảng giá (dùng giá sau khi giảm giá)
        const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
        if (filterOptions.minPrice !== null && discountedPrice < filterOptions.minPrice) return false;
        if (filterOptions.maxPrice !== null && discountedPrice > filterOptions.maxPrice) return false;
        
        // Lọc theo tồn kho
        if (filterOptions.minStock !== null && product.quantityInStock < filterOptions.minStock) return false;
        if (filterOptions.maxStock !== null && product.quantityInStock > filterOptions.maxStock) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Sắp xếp theo tiêu chí đã chọn
        switch (filterOptions.sort) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'price_asc':
            return calculateDiscountedPrice(a.price, a.discount) - calculateDiscountedPrice(b.price, b.discount);
          case 'price_desc':
            return calculateDiscountedPrice(b.price, b.discount) - calculateDiscountedPrice(a.price, a.discount);
          case 'stock_asc':
            return a.quantityInStock - b.quantityInStock;
          case 'stock_desc':
            return b.quantityInStock - a.quantityInStock;
          case 'date_asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'date_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  };

  // Áp dụng phân trang cho sản phẩm đã lọc
  const getPaginatedProducts = () => {
    const filteredProducts = getFilteredAndSortedProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const paginatedProducts = getPaginatedProducts();
  const filteredProducts = getFilteredAndSortedProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleViewDetail = (id: number) => {
    navigate(`/products/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/products/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      try {
        await deleteProductById(id);
        // Cập nhật lại danh sách sản phẩm sau khi xóa
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
      }
    }
  };

  const handleAddProduct = () => {
    navigate('/products/create');
  };
  
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions({
      ...filterOptions,
      [key]: value
    });
  };
  
  const resetFilters = () => {
    setFilterOptions({
      status: 'all',
      featured: 'all',
      hasDiscount: 'all',
      category: null,
      brand: null,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      minStock: stockRange.min,
      maxStock: stockRange.max,
      sort: 'date_desc'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Format giá tiền
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(price)
      .replace(/\s/g, '');
  };
  
  // Format ngày tháng
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };
  
  // Lấy icon cho tiêu chí sắp xếp
  const getSortIcon = (sortKey: string) => {
    if (filterOptions.sort === `${sortKey}_asc`) {
      return <ArrowUp size={16} className="ml-1" />;
    } else if (filterOptions.sort === `${sortKey}_desc`) {
      return <ArrowDown size={16} className="ml-1" />;
    }
    return null;
  };
  
  // Xử lý khi click vào tiêu đề cột để sắp xếp
  const handleSort = (sortKey: string) => {
    if (filterOptions.sort === `${sortKey}_asc`) {
      handleFilterChange('sort', `${sortKey}_desc`);
    } else {
      handleFilterChange('sort', `${sortKey}_asc`);
    }
  };
  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-gray-600">Quản lý tất cả sản phẩm trong hệ thống</p>
        </div>
        <button 
          onClick={handleAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md text-gray-700 flex items-center hover:bg-gray-50 ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'}`}
            >
              <Filter size={18} className="mr-2" />
              Bộ lọc {showFilters ? <X size={16} className="ml-2" /> : null}
            </button>
            {(filterOptions.status !== 'all' || 
              filterOptions.featured !== 'all' || 
              filterOptions.hasDiscount !== 'all' ||
              filterOptions.category !== null || 
              filterOptions.brand !== null ||
              filterOptions.minPrice !== null ||
              filterOptions.maxPrice !== null ||
              filterOptions.minStock !== null ||
              filterOptions.maxStock !== null) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-red-600 flex items-center hover:bg-gray-50"
              >
                <X size={18} className="mr-2" />
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            {/* Hàng đầu tiên - các select option */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={filterOptions.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nổi bật</label>
                <select
                  value={filterOptions.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="featured">Nổi bật</option>
                  <option value="not-featured">Không nổi bật</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá</label>
                <select
                  value={filterOptions.hasDiscount}
                  onChange={(e) => handleFilterChange('hasDiscount', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="discounted">Có giảm giá</option>
                  <option value="not-discounted">Không giảm giá</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={filterOptions.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value ? Number(e.target.value) : null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                <select
                  value={filterOptions.brand || ''}
                  onChange={(e) => handleFilterChange('brand', e.target.value ? Number(e.target.value) : null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hàng thứ hai - các thanh kéo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng giá</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Từ: <span className="font-medium text-blue-600">{formatPrice(filterOptions.minPrice ?? priceRange.min)}</span></span>
                    <span>Đến: <span className="font-medium text-blue-600">{formatPrice(filterOptions.maxPrice ?? priceRange.max)}</span></span>
                  </div>
                  
                  <div className="mb-5">
                    <div className="text-xs text-gray-500 mb-1">Giá thấp nhất</div>
                    <Slider
                      value={filterOptions.minPrice ?? priceRange.min}
                      onChange={(event: Event, newValue: number | number[]) => {
                        const value = newValue as number;
                        // Chỉ cập nhật nếu minPrice <= maxPrice
                        if (value <= (filterOptions.maxPrice ?? priceRange.max)) {
                          handleFilterChange('minPrice', value);
                        }
                      }}
                      min={priceRange.min}
                      max={priceRange.max}
                      step={(priceRange.max - priceRange.min) / 10000}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatPrice(value)}
                      sx={{
                        color: '#3b82f6',
                        '& .MuiSlider-rail': { backgroundColor: '#e2e8f0' },
                        '& .MuiSlider-thumb': {
                          height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                          '&:focus, &:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)' },
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#3b82f6',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Giá cao nhất</div>
                    <Slider
                      value={filterOptions.maxPrice ?? priceRange.max}
                      onChange={(event: Event, newValue: number | number[]) => {
                        const value = newValue as number;
                        // Chỉ cập nhật nếu maxPrice >= minPrice
                        if (value >= (filterOptions.minPrice ?? priceRange.min)) {
                          handleFilterChange('maxPrice', value);
                        }
                      }}
                      min={priceRange.min}
                      max={priceRange.max}
                      step={(priceRange.max - priceRange.min) / 10000}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatPrice(value)}
                      sx={{
                        color: '#f97316', // Orange-500
                        '& .MuiSlider-rail': { backgroundColor: '#e2e8f0' },
                        '& .MuiSlider-thumb': {
                          height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                          '&:focus, &:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(249, 115, 22, 0.16)' },
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#f97316',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Từ: <span className="font-medium text-green-600">{filterOptions.minStock ?? stockRange.min}</span> sản phẩm</span>
                    <span>Đến: <span className="font-medium text-green-600">{filterOptions.maxStock ?? stockRange.max}</span> sản phẩm</span>
                  </div>
                  
                  <div className="mb-5">
                    <div className="text-xs text-gray-500 mb-1">Tồn kho tối thiểu</div>
                    <Slider
                      value={filterOptions.minStock ?? stockRange.min}
                      onChange={(event: Event, newValue: number | number[]) => {
                        const value = newValue as number;
                        if (value <= (filterOptions.maxStock ?? stockRange.max)) {
                          handleFilterChange('minStock', value);
                        }
                      }}
                      min={stockRange.min}
                      max={stockRange.max}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={{
                        color: '#10b981', // Green-500
                        '& .MuiSlider-rail': { backgroundColor: '#e2e8f0' },
                        '& .MuiSlider-thumb': {
                          height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                          '&:focus, &:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.16)' },
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#10b981',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tồn kho tối đa</div>
                    <Slider
                      value={filterOptions.maxStock ?? stockRange.max}
                      onChange={(event: Event, newValue: number | number[]) => {
                        const value = newValue as number;
                        if (value >= (filterOptions.minStock ?? stockRange.min)) {
                          handleFilterChange('maxStock', value);
                        }
                      }}
                      min={stockRange.min}
                      max={stockRange.max}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={{
                        color: '#0ea5e9', // Sky-500
                        '& .MuiSlider-rail': { backgroundColor: '#e2e8f0' },
                        '& .MuiSlider-thumb': {
                          height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                          '&:focus, &:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(14, 165, 233, 0.16)' },
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#0ea5e9', 
                          padding: '4px 8px',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Tải lại
            </button>
          </div>
        ) : (
        <div className="overflow-x-auto">
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('name')}
                      >
                        SKU / Tên Sản phẩm
                        {getSortIcon('name')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục / Thương hiệu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('price')}
                      >
                        Giá / Giảm giá
                        {getSortIcon('price')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('stock')}
                      >
                  Tồn kho
                        {getSortIcon('stock')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center focus:outline-none font-medium"
                        onClick={() => handleSort('date')}
                      >
                        Ngày tạo
                        {getSortIcon('date')}
                      </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Không tìm thấy sản phẩm
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-md object-cover" 
                                src={product.images && product.images.length > 0 ? getMainImageUrl(product) : 'https://via.placeholder.com/50'} 
                                alt={product.name} 
                              />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.category?.name || 'Không có'}</div>
                          <div className="text-sm text-gray-500">{product.brand?.name || 'Không có'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.discount > 0 
                              ? formatPrice(calculateDiscountedPrice(product.price, product.discount))
                              : formatPrice(product.price)
                              }
                              {product.discount > 0 && (
                              <span className="line-through text-gray-500 ml-2">{formatPrice(product.price)}</span>
                              )}
                          </div>
                          {product.discount > 0 && (
                            <div className="text-sm text-red-600">
                              <span>-{product.discount}%</span>
                            </div>
                          )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.quantityInStock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(product.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 w-fit">
                            {/* Badge thiết kế gọn hơn */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.isActive ? (
                                <Check size={12} className="mr-1" />
                              ) : (
                                <X size={12} className="mr-1" />
                              )}
                              {product.isActive ? 'Đang bán' : 'Ngừng bán'}
                            </span>
                            
                            {product.isFeatured && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Check size={12} className="mr-1" />
                                Nổi bật
                    </span>
                            )}
                          </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleViewDetail(product.id)}
                        className="text-blue-600 hover:text-blue-900"
                              title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(product.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                              title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                              title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            {filteredProducts.length > 0 && (
              <>Hiển thị <span className="font-medium">{paginatedProducts.length}</span> / <span className="font-medium">{filteredProducts.length}</span> sản phẩm</>
            )}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                &laquo;
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => {
                  // Thêm dấu ... nếu có khoảng cách giữa các nút
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <span className="px-3 py-1 rounded-md bg-gray-100">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })
              }
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                &raquo;
              </button>
            </div>
          )}

          {/* Số sản phẩm mỗi trang */}
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-700">Sản phẩm/trang:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;