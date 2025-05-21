import ProductCard from '@/components/product/ProductCard';
import { useCategories } from '@/hooks/useCategories';
import { getBrands } from '@/services/brandsApi';
import { getSpecificationsByCategorySlug, searchProducts } from '@/services/productsApi';
import { Brand, Product } from '@/types/product';
import { formatVND } from '@/utils/formatters';
import { debounce } from 'lodash';
import { ChevronDown, ChevronUp, FilterIcon, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchPage: React.FC = () => {
  // Lấy từ khóa tìm kiếm từ query params
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  
  // State cho kết quả tìm kiếm
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<Error | null>(null);
  
  // State cho bộ lọc
  const { categories } = useCategories();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [specifications, setSpecifications] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadMoreCount, setLoadMoreCount] = useState(12);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Array<[number, number]>>([]);
  const [customPriceRange, setCustomPriceRange] = useState<[number, number]>([0, 0]);
  const [customPriceMin, setCustomPriceMin] = useState<string>('');
  const [customPriceMax, setCustomPriceMax] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Theo dõi các phần của bộ lọc được thu gọn
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    price: false,
    brands: false,
    categories: false
  });
  
  // Theo dõi thông số kỹ thuật được chọn
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  
  // Thông số nên hiển thị dạng lưới
  const gridViewSpecs = ['ram_gb', 'refresh_rate_hz', 'storage_gb', 'storage_type', 'color', 'cpu_brand', 'cpu_series'];
  
  // Khoảng giá cố định bằng VND
  const predefinedPriceRanges: Array<[number, number]> = [
    [0, 10000000],     // Dưới 10 triệu
    [10000000, 15000000], // 10-15 triệu
    [15000000, 20000000], // 15-20 triệu
    [20000000, 25000000], // 20-25 triệu
    [25000000, 30000000], // 25-30 triệu
    [30000000, Infinity]  // Trên 30 triệu
  ];
  
  // Tính toán khoảng giá hiệu quả từ các bộ lọc đã chọn
  const effectivePriceRange = useMemo(() => {
    // Nếu không có khoảng giá nào được chọn và không có khoảng tùy chỉnh, trả về null (không lọc)
    if (selectedPriceRanges.length === 0 && (customPriceRange[0] === 0 && customPriceRange[1] === 0)) {
      return null;
    }
    
    let minPrice = Infinity;
    let maxPrice = 0;
    
    // Kiểm tra các khoảng giá đã chọn
    if (selectedPriceRanges.length > 0) {
      // Tìm giá trị nhỏ nhất và lớn nhất trong tất cả các khoảng đã chọn
      selectedPriceRanges.forEach(([min, max]) => {
        minPrice = Math.min(minPrice, min);
        maxPrice = Math.max(maxPrice, max === Infinity ? 200000000 : max); // Giới hạn Infinity ở một giá trị hợp lý
      });
    }
    
    // Kiểm tra khoảng giá tùy chỉnh (nếu có)
    if (customPriceRange[0] > 0 || customPriceRange[1] > 0) {
      minPrice = Math.min(minPrice, customPriceRange[0]);
      maxPrice = Math.max(maxPrice, customPriceRange[1]);
    }
    
    return minPrice === Infinity ? null : [minPrice, maxPrice];
  }, [selectedPriceRanges, customPriceRange]);
  
  // Chuyển đổi trạng thái thu gọn của một phần bộ lọc
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Xử lý chọn khoảng giá
  const togglePriceRange = (range: [number, number]) => {
    setSelectedPriceRanges(prev => {
      // Kiểm tra xem khoảng này đã được chọn chưa
      const isSelected = prev.some(([min, max]) => min === range[0] && max === range[1]);
      
      if (isSelected) {
        // Xóa khoảng
        return prev.filter(([min, max]) => !(min === range[0] && max === range[1]));
      } else {
        // Thêm khoảng
        return [...prev, range];
      }
    });
  };
  
  // Xử lý khoảng giá tùy chỉnh
  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const min = parseInt(customPriceMin.replace(/\./g, ''), 10) || 0;
    const max = parseInt(customPriceMax.replace(/\./g, ''), 10) || 0;
    
    if (max > 0 && min <= max) {
      setCustomPriceRange([min, max]);
    }
  };
  
  // Định dạng input cho giá tùy chỉnh khi người dùng nhập
  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Xóa tất cả ký tự không phải số
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Định dạng với dấu chấm làm dấu phân cách hàng nghìn
    if (rawValue) {
      const formattedValue = Number(rawValue).toLocaleString('vi-VN');
      setter(formattedValue);
    } else {
      setter('');
    }
  };

  // Xử lý bộ lọc
  const toggleBrandFilter = (brandId: number) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId) 
        : [...prev, brandId]
    );
  };
  
  // Xử lý bộ lọc thông số kỹ thuật với tùy chọn "Tất cả"
  const toggleSpecFilter = (specType: string, value: string) => {
    setSelectedSpecs(prev => {
      // Nếu giá trị là "Tất cả"
      if (value === "Tất cả") {
        return {
          ...prev,
          [specType]: []
        };
      } else {
        const currentValues = prev[specType] || [];
        // Nếu giá trị này đã được chọn, xóa nó
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [specType]: currentValues.filter(v => v !== value)
          };
        } 
        // Nếu không, thêm nó
        return {
          ...prev,
          [specType]: [...currentValues, value]
        };
      }
    });
  };
  
  // Xử lý chọn danh mục
  const handleCategoryChange = (categoryId: number | null) => {
    if (categoryId === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };
  
  // Xóa tất cả bộ lọc
  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setCustomPriceRange([0, 0]);
    setCustomPriceMin('');
    setCustomPriceMax('');
    setSelectedBrands([]);
    setSelectedCategory(null);
    
    // Đặt lại tất cả bộ lọc thông số kỹ thuật thành mảng rỗng
    const resetSpecs = Object.keys(selectedSpecs).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as Record<string, string[]>);
    
    setSelectedSpecs(resetSpecs);
  };
  
  // Xử lý tải thêm
  const handleLoadMore = () => {
    setLoadMoreCount(prev => prev + 12);
  };
  
  // Định dạng tên thông số để hiển thị
  const formatSpecName = (key: string) => {
    // Map tên thông số nếu cần
    const specNameMap: Record<string, string> = {
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
    
    return specNameMap[key] || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  // Định dạng khoảng giá để hiển thị
  const formatPriceRangeLabel = (range: [number, number]): string => {
    if (range[0] === 0 && range[1] === Infinity) {
      return 'Tất cả';
    } else if (range[0] === 0) {
      return `Dưới ${formatVND(range[1], false)}`;
    } else if (range[1] === Infinity) {
      return `Trên ${formatVND(range[0], false)}`;
    } else {
      return `Từ ${formatVND(range[0], false)} - ${formatVND(range[1], false)}`;
    }
  };
  
  // Kiểm tra xem có bộ lọc nào được áp dụng không
  const hasActiveFilters = selectedBrands.length > 0 || 
    Object.values(selectedSpecs).some(values => values.length > 0) ||
    selectedPriceRanges.length > 0 || 
    (customPriceRange[0] > 0 || customPriceRange[1] > 0) ||
    selectedCategory !== null;

  // Tải danh sách brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsData = await getBrands();
        setBrands(brandsData);
      } catch (error) {
        console.error('Lỗi khi tải thương hiệu:', error);
        setBrands([]);
      }
    };
    
    fetchBrands();
  }, []);
  
  // Tải thông số kỹ thuật khi thay đổi danh mục
  useEffect(() => {
    const fetchSpecifications = async () => {
      if (!selectedCategory) {
        setSpecifications({});
        return;
      }
      
      try {
        // Tìm danh mục đã chọn
        const category = categories?.find(c => c.id === selectedCategory);
        if (!category) return;
        
        // Tải thông số kỹ thuật cho danh mục
        const specsData = await getSpecificationsByCategorySlug(category.slug);
        setSpecifications(specsData);
        
        // Khởi tạo selectedSpecs cho thông số mới
        const initialSpecs = Object.keys(specsData).reduce((acc, key) => {
          acc[key] = [];
          return acc;
        }, {} as Record<string, string[]>);
        
        setSelectedSpecs(initialSpecs);
      } catch (error) {
        console.error('Lỗi khi tải thông số kỹ thuật:', error);
        setSpecifications({});
      }
    };
    
    fetchSpecifications();
  }, [selectedCategory, categories]);
  
  // Tìm kiếm sản phẩm khi thay đổi các bộ lọc
  useEffect(() => {
    if (!keyword) return;
    
    const fetchSearchResults = async () => {
      try {
        setIsProductsLoading(true);
        setProductsError(null);
        
        // Xây dựng tham số tìm kiếm
        const searchParams = {
          keyword,
          skip: 0,
          limit: loadMoreCount,
          is_active: true,
          sort: sortOption
        } as any;
        
        // Thêm các bộ lọc tùy chọn
        if (selectedCategory) {
          searchParams.category_id = selectedCategory;
        }
        
        if (selectedBrands.length > 0) {
          searchParams.brand_id = selectedBrands;
        }
        
        // Thêm bộ lọc khoảng giá nếu có
        if (effectivePriceRange) {
          searchParams.min_price = effectivePriceRange[0];
          searchParams.max_price = effectivePriceRange[1];
        }
        
        // Thêm bộ lọc thông số kỹ thuật nếu có
        const activeSpecs: Record<string, string[]> = {};
        let hasActiveSpecs = false;
        
        Object.entries(selectedSpecs).forEach(([key, values]) => {
          if (values && values.length > 0) {
            activeSpecs[key] = values;
            hasActiveSpecs = true;
          }
        });
        
        if (hasActiveSpecs) {
          searchParams.specifications = activeSpecs;
        }
        
        // Gọi API tìm kiếm
        const response = await searchProducts(searchParams);
        setProducts(response.items);
        setTotalProducts(response.total);
      } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        setProductsError(error instanceof Error ? error : new Error('Không thể tìm kiếm sản phẩm'));
      } finally {
        setIsProductsLoading(false);
      }
    };
    
    // Debounce để tránh gọi API quá nhiều
    const debouncedFetch = debounce(fetchSearchResults, 300);
    debouncedFetch();
    
    // Cleanup
    return () => {
      debouncedFetch.cancel();
    };
  }, [
    keyword, 
    loadMoreCount, 
    selectedCategory, 
    selectedBrands, 
    effectivePriceRange, 
    selectedSpecs, 
    sortOption
  ]);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Kết quả tìm kiếm cho: "{keyword}"</h1>
      
      {/* Filter and Sort Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Mobile filter button */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="md:hidden flex items-center px-4 py-2 rounded border hover:bg-muted"
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Bộ lọc sản phẩm
        </button>
        
        {/* Sort control */}
        <div className="w-full md:w-auto flex justify-end items-center">
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 rounded border bg-transparent text-sm hover:bg-muted focus:outline-none"
            >
              <option value="newest">Nổi bật</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
              <option value="best_selling">Bán chạy nhất</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {/* Content grid with filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter Sidebar - Desktop always visible, mobile conditional */}
        <div className={`
          md:block
          ${isFilterOpen ? 'fixed inset-0 z-50 bg-background p-6 overflow-y-auto md:sticky md:top-4 md:h-auto md:inset-auto md:p-0' : 'hidden'}
        `}>
          {/* Mobile header */}
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h2 className="font-bold text-lg">Bộ lọc</h2>
            <button onClick={() => setIsFilterOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Filter container with independent scrolling */}
          <div className="bg-white rounded-lg border md:sticky md:top-4 md:max-h-[calc(100vh-100px)] md:overflow-y-auto">
            {/* Category Filter */}
            <div className="border-b">
              <button 
                onClick={() => toggleSection('categories')}
                className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
              >
                Danh mục sản phẩm
                {collapsedSections.categories ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
              
              {!collapsedSections.categories && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {categories?.map(category => (
                      <label key={category.id} className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          checked={selectedCategory === category.id}
                          onChange={() => handleCategoryChange(category.id)}
                          className="rounded-full text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Price Range Filter */}
            <div className="border-b">
              <button 
                onClick={() => toggleSection('price')}
                className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
              >
                Mức giá
                {collapsedSections.price ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
              
              {!collapsedSections.price && (
                <div className="px-4 pb-4">
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={selectedPriceRanges.length === 0 && customPriceRange[0] === 0 && customPriceRange[1] === 0}
                        onChange={() => {
                          setSelectedPriceRanges([]);
                          setCustomPriceRange([0, 0]);
                          setCustomPriceMin('');
                          setCustomPriceMax('');
                        }}
                        className="rounded text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm">Tất cả</span>
                    </label>
                    
                    {predefinedPriceRanges.map((range, index) => (
                      <label key={index} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={selectedPriceRanges.some(([min, max]) => min === range[0] && max === range[1])}
                          onChange={() => togglePriceRange(range)}
                          className="rounded text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm">{formatPriceRangeLabel(range)}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Custom price range input */}
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Hoặc nhập khoảng giá phù hợp với bạn:</p>
                    <form onSubmit={handleCustomPriceSubmit} className="space-y-2">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full">
                        <input
                          type="text"
                          value={customPriceMin}
                          onChange={(e) => handlePriceInputChange(e, setCustomPriceMin)}
                          placeholder="17.490.000"
                          className="min-w-0 w-full px-3 py-1.5 border rounded text-sm"
                        />
                        <span className="whitespace-nowrap">~</span>
                        <input
                          type="text"
                          value={customPriceMax}
                          onChange={(e) => handlePriceInputChange(e, setCustomPriceMax)}
                          placeholder="149.990.000"
                          className="min-w-0 w-full px-3 py-1.5 border rounded text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Áp dụng
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
            
            {/* Brand Filter */}
            <div className="border-b">
              <button 
                onClick={() => toggleSection('brands')}
                className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
              >
                Hãng sản xuất
                {collapsedSections.brands ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
              
              {!collapsedSections.brands && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {brands.map((brand) => (
                    <button 
                      key={brand.id}
                      onClick={() => toggleBrandFilter(brand.id)}
                      className={`text-center py-2 px-3 text-sm border rounded ${
                        selectedBrands.includes(brand.id) 
                          ? 'bg-red-50 border-red-200 text-red-500' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Specifications Filters - Dynamic based on category */}
            {Object.keys(specifications).length > 0 ? (
              Object.keys(specifications).map((specKey) => {
                const values = specifications[specKey];
                return (
                  <div key={specKey} className="border-b">
                    <button 
                      onClick={() => toggleSection(specKey)}
                      className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
                    >
                      {formatSpecName(specKey)}
                      {collapsedSections[specKey] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </button>
                    {!collapsedSections[specKey] && (
                      <div className={`px-4 pb-4 ${gridViewSpecs.includes(specKey) ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
                        {gridViewSpecs.includes(specKey) ? (
                          <>
                            <button 
                              onClick={() => toggleSpecFilter(specKey, "Tất cả")}
                              className={`text-center py-2 px-3 text-sm border rounded ${
                                (!selectedSpecs[specKey] || selectedSpecs[specKey].length === 0) 
                                  ? 'bg-red-50 border-red-200 text-red-500' 
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              Tất cả
                            </button>
                            {values.length > 0 ? (
                              values.map((value) => (
                                <button 
                                  key={value}
                                  onClick={() => toggleSpecFilter(specKey, value)}
                                  className={`text-center py-2 px-3 text-sm border rounded ${
                                    selectedSpecs[specKey]?.includes(value) 
                                      ? 'bg-red-50 border-red-200 text-red-500' 
                                      : 'hover:bg-slate-50'
                                  }`}
                                >
                                  {value === 'true' ? 'Có' : value === 'false' ? 'Không' : value}
                                </button>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground py-2">Không có dữ liệu</p>
                            )}
                          </>
                        ) : (
                          <>
                            <label className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                checked={!selectedSpecs[specKey] || selectedSpecs[specKey].length === 0}
                                onChange={() => toggleSpecFilter(specKey, "Tất cả")}
                                className="rounded text-red-500 focus:ring-red-500"
                              />
                              <span className="text-sm">Tất cả</span>
                            </label>
                            {values.length > 0 ? (
                              values.map((value) => (
                                <label key={value} className="flex items-center space-x-2">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedSpecs[specKey]?.includes(value) || false}
                                    onChange={() => toggleSpecFilter(specKey, value)}
                                    className="rounded text-red-500 focus:ring-red-500"
                                  />
                                  <span className="text-sm">{value === 'true' ? 'Có' : value === 'false' ? 'Không' : value}</span>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : !selectedCategory ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">Vui lòng chọn danh mục để xem thêm bộ lọc</p>
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">Không có thông số kỹ thuật nào cho danh mục này</p>
              </div>
            )}
            
            {/* Clear all filters button (only on mobile) */}
            {hasActiveFilters && (
              <div className="p-4 md:hidden">
                <button 
                  onClick={clearFilters}
                  className="w-full py-3 rounded border border-red-500 text-red-500 hover:bg-red-50"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
            
            {/* Apply Filters button on mobile */}
            <div className="p-4 md:hidden">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3 rounded bg-red-500 text-white"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
        
        {/* Products Grid and Active Filters */}
        <div className="md:col-span-3">
          {/* Results count */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-medium">{totalProducts}</span> sản phẩm
            </div>
          </div>
          
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-slate-50 rounded-lg">
              {/* Selected category */}
              {selectedCategory && categories && (
                <div className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
                  <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {/* Price range filters */}
              {selectedPriceRanges.length > 0 && (
                selectedPriceRanges.map((range, index) => (
                  <div key={`price-range-${index}`} className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
                    <span>{formatPriceRangeLabel(range)}</span>
                    <button 
                      onClick={() => togglePriceRange(range)}
                      className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
              
              {/* Custom price range */}
              {(customPriceRange[0] > 0 || customPriceRange[1] > 0) && (
                <div className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
                  <span>Từ {formatVND(customPriceRange[0], false)} - {formatVND(customPriceRange[1], false)}</span>
                  <button 
                    onClick={() => {
                      setCustomPriceRange([0, 0]);
                      setCustomPriceMin('');
                      setCustomPriceMax('');
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {/* Show active brand filters */}
              {selectedBrands.length > 0 && brands.filter(brand => selectedBrands.includes(brand.id)).map(brand => (
                <div key={brand.id} className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
                  <span>{brand.name}</span>
                  <button 
                    onClick={() => toggleBrandFilter(brand.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {/* Show active spec filters */}
              {Object.entries(selectedSpecs).map(([specKey, values]) => 
                values.map(value => (
                  <div key={`${specKey}-${value}`} className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
                    <span>{value === 'true' ? 'Có' : value === 'false' ? 'Không' : value}</span>
                    <button 
                      onClick={() => toggleSpecFilter(specKey, value)}
                      className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
              
              {/* Clear all filters button */}
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-500 rounded-full px-3 py-1 hover:underline ml-auto"
              >
                <span>Xóa tất cả</span>
              </button>
            </div>
          )}
          
          {/* Products */}
          {isProductsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : productsError ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-4">Đã xảy ra lỗi</h3>
              <p className="text-muted-foreground mb-6">{productsError.message}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Load More */}
              {products.length < totalProducts && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3 rounded-md border hover:bg-muted transition-colors"
                    disabled={isProductsLoading}
                  >
                    {isProductsLoading ? (
                      <span className="flex items-center">
                        <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                        Đang tải...
                      </span>
                    ) : (
                      "Xem thêm sản phẩm"
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-4">Không tìm thấy sản phẩm nào</h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters 
                  ? "Hãy thử điều chỉnh bộ lọc của bạn" 
                  : `Không tìm thấy sản phẩm nào với từ khóa "${keyword}"`}
              </p>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 