// import React, { useState, useEffect, useMemo } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { ChevronDown, ChevronUp, X, FilterIcon } from 'lucide-react';
// import { useCategories } from '@/hooks/useCategories';
// import { useProductFilters } from '@/hooks/useProductFilters';
// import ProductCard from '@/components/product/ProductCard';
// import { getProductsByCategorySlug } from '@/services/productsApi';
// import { Product } from '@/types/product';
// import { debounce } from 'lodash';
// import { formatVND } from '@/utils/formatters';

// // Import the proper interface from productsApi
// import type { GetProductsByCategorySlugParams } from '@/services/productsApi';

// const CategoryProducts: React.FC = () => {
//   const { slug } = useParams<{ slug: string }>();
//   const { categories, isLoading: categoriesLoading } = useCategories();
//   const [category, setCategory] = useState<any>(null);
//   const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
//   const { brands, specifications, isLoading: filtersLoading } = useProductFilters(categoryId);
  
//   const [loadMoreCount, setLoadMoreCount] = useState(12);
//   const [selectedPriceRanges, setSelectedPriceRanges] = useState<Array<[number, number]>>([]);
//   const [customPriceRange, setCustomPriceRange] = useState<[number, number]>([0, 0]);
//   const [customPriceMin, setCustomPriceMin] = useState<string>('');
//   const [customPriceMax, setCustomPriceMax] = useState<string>('');
//   const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
//   const [sortOption, setSortOption] = useState('newest');
//   const [isFilterOpen, setIsFilterOpen] = useState(false);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [isProductsLoading, setIsProductsLoading] = useState(false);
//   const [productsError, setProductsError] = useState<Error | null>(null);
//   const [totalProducts, setTotalProducts] = useState(0);
//   const [categoryLoading, setCategoryLoading] = useState(true);
//   const [categoryError, setCategoryError] = useState<Error | null>(null);
  
//   Track which filter sections are collapsed
//   const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
//     price: false,
//     brands: false
//   });
  
//   // Dynamic specifications based on category
//   const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  
//   // Specifications that should use grid view like brands
//   const gridViewSpecs = ['ram_gb', 'refresh_rate_hz', 'storage_gb', 'storage_type', 'color', 'cpu_brand', 'cpu_series'];
  
//   // Price ranges in VND
//   const predefinedPriceRanges: Array<[number, number]> = [
//     [0, 10000000],     // Dưới 10 triệu
//     [10000000, 15000000], // 10-15 triệu
//     [15000000, 20000000], // 15-20 triệu
//     [20000000, 25000000], // 20-25 triệu
//     [25000000, 30000000], // 25-30 triệu
//     [30000000, Infinity]  // Trên 30 triệu
//   ];
  
//   // Get the effective price range based on selected ranges and custom range
//   const effectivePriceRange = useMemo(() => {
//     // If no price ranges are selected and no custom range, return null (no filter)
//     if (selectedPriceRanges.length === 0 && (customPriceRange[0] === 0 && customPriceRange[1] === 0)) {
//       return null;
//     }
    
//     let minPrice = Infinity;
//     let maxPrice = 0;
    
//     // Check selected predefined ranges
//     if (selectedPriceRanges.length > 0) {
//       // Find the minimum and maximum across all selected ranges
//       selectedPriceRanges.forEach(([min, max]) => {
//         minPrice = Math.min(minPrice, min);
//         maxPrice = Math.max(maxPrice, max === Infinity ? 200000000 : max); // Cap infinity at a reasonable value
//       });
//     }
    
//     // Check custom range (if set)
//     if (customPriceRange[0] > 0 || customPriceRange[1] > 0) {
//       minPrice = Math.min(minPrice, customPriceRange[0]);
//       maxPrice = Math.max(maxPrice, customPriceRange[1]);
//     }
    
//     return minPrice === Infinity ? null : [minPrice, maxPrice];
//   }, [selectedPriceRanges, customPriceRange]);
  
//   // Hook useEffect để khởi tạo các thông số kỹ thuật đã chọn
//   useEffect(() => {
//     if (specifications) {
//       console.log("Category ID:", category?.id);
//       console.log("Specifications received:", specifications);
//       console.log("Specifications keys:", Object.keys(specifications));
      
//       const initialSpecs = Object.keys(specifications).reduce((acc, key) => {
//         acc[key] = [];
//         return acc;
//       }, {} as Record<string, string[]>);
      
//       setSelectedSpecs(initialSpecs);
      
//       // Khởi tạo tất cả các phần bộ lọc ở trạng thái mở mặc định
//       const initialCollapsedState = { ...collapsedSections };
//       Object.keys(specifications).forEach(key => {
//         initialCollapsedState[key] = false;
//       });
//       setCollapsedSections(initialCollapsedState);
//     }
//   }, [specifications, category?.id]);
  
//   // Reset filters when category changes
//   useEffect(() => {
//     if (slug) {
//       setSelectedBrands([]);
//       setSelectedPriceRanges([]);
//       setCustomPriceRange([0, 0]);
//       setCustomPriceMin('');
//       setCustomPriceMax('');
//       setLoadMoreCount(12);
      
//       // Extract category from categories list when it's available
//       if (categories && categories.length > 0) {
//         const foundCategory = categories.find(c => c.slug === slug);
//         console.log("Found category:", foundCategory);
//         setCategory(foundCategory || null);
//         setCategoryLoading(false);
//       }
//     }
//   }, [slug, categories]);
  
//   // Cập nhật categoryId khi category thay đổi
//   useEffect(() => {
//     if (category && category.id) {
//       console.log("Setting categoryId:", category.id);
//       setCategoryId(category.id);
//     } else {
//       setCategoryId(undefined);
//     }
//   }, [category]);
  
//   // Fetch products with debounce when filters change
//   useEffect(() => {
//     // Only fetch products when we have a valid slug
//     if (!slug) return;
    
//     const fetchProductsData = async () => {
//       try {
//         setIsProductsLoading(true);
//         setProductsError(null);
        
//         // Build filters object with the proper type
//         const filters: GetProductsByCategorySlugParams = {
//           categorySlug: slug,
//           skip: 0,
//           limit: loadMoreCount,
//           is_active: true,
//           sort: sortOption
//         };
        
//         // Add optional filters
//         if (selectedBrands.length > 0) {
//           filters.brand_id = selectedBrands;
//         }
        
//         // Add price range filter if any price filters are applied
//         if (effectivePriceRange) {
//           filters.min_price = effectivePriceRange[0];
//           filters.max_price = effectivePriceRange[1];
//         }
        
//         // Add specifications filter if any are selected
//         const activeSpecs: Record<string, string[]> = {};
//         let hasActiveSpecs = false;
        
//         Object.entries(selectedSpecs).forEach(([key, values]) => {
//           if (values && values.length > 0) {
//             activeSpecs[key] = values;
//             hasActiveSpecs = true;
//           }
//         });
        
//         if (hasActiveSpecs) {
//           filters.specifications = activeSpecs;
//           console.log("Đang gửi specifications filter:", activeSpecs);
//         }
        
//         // Call the API endpoint
//         console.log("Fetching products by category slug:", filters);
//         const response = await getProductsByCategorySlug(filters);
//         console.log("Kết quả trả về từ API:", response);
//         setProducts(response.items);
//         setTotalProducts(response.total);
//       } catch (err) {
//         console.error('Error fetching products:', err);
//         setProductsError(err instanceof Error ? err : new Error('Failed to fetch products'));
//       } finally {
//         setIsProductsLoading(false);
//       }
//     };
    
//     // Debounce the fetch to prevent too many API calls
//     const debouncedFetch = debounce(fetchProductsData, 300);
//     debouncedFetch();
    
//     // Cleanup
//     return () => {
//       debouncedFetch.cancel();
//     };
//   }, [slug, loadMoreCount, selectedBrands, effectivePriceRange, selectedSpecs, sortOption]);

//   // Function to build category path for breadcrumb
//   const buildCategoryPath = () => {
//     if (!category || !categories) return [];
    
//     const path = [{ id: category.id, name: category.name, slug: category.slug }];
//     let currentCategory = category;
    
//     // Traverse up the category hierarchy
//     while (currentCategory.parent_id) {
//       const parentCategory = categories.find(c => c.id === currentCategory.parent_id);
//       if (parentCategory) {
//         path.unshift({ id: parentCategory.id, name: parentCategory.name, slug: parentCategory.slug });
//         currentCategory = parentCategory;
//       } else {
//         break;
//       }
//     }
    
//     return path;
//   };

//   const categoryPath = useMemo(() => buildCategoryPath(), [category, categories]);

//   // Toggle collapse state for a filter section
//   const toggleSection = (section: string) => {
//     setCollapsedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   };

//   // Handle price range selection
//   const togglePriceRange = (range: [number, number]) => {
//     setSelectedPriceRanges(prev => {
//       // Check if this range is already selected
//       const isSelected = prev.some(([min, max]) => min === range[0] && max === range[1]);
      
//       if (isSelected) {
//         // Remove the range
//         return prev.filter(([min, max]) => !(min === range[0] && max === range[1]));
//       } else {
//         // Add the range
//         return [...prev, range as [number, number]]; // Ensure it's a tuple
//       }
//     });
//   };
  
//   // Handle custom price range
//   const handleCustomPriceSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     const min = parseInt(customPriceMin.replace(/\./g, ''), 10) || 0;
//     const max = parseInt(customPriceMax.replace(/\./g, ''), 10) || 0;
    
//     if (max > 0 && min <= max) {
//       setCustomPriceRange([min, max]);
//     }
//   };
  
//   // Format the input for custom price as the user types
//   const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
//     // Remove all non-digits
//     const rawValue = e.target.value.replace(/\D/g, '');
    
//     // Format with dots as thousands separators
//     if (rawValue) {
//       const formattedValue = Number(rawValue).toLocaleString('vi-VN');
//       setter(formattedValue);
//     } else {
//       setter('');
//     }
//   };

//   // Filter handlers
//   const toggleBrandFilter = (brandId: number) => {
//     setSelectedBrands(prev => 
//       prev.includes(brandId) 
//         ? prev.filter(id => id !== brandId) 
//         : [...prev, brandId]
//     );
//   };
  
//   // Toggle specification filters with "All" handling
//   const toggleSpecFilter = (specType: string, value: string) => {
//     setSelectedSpecs(prev => {
//       // If value is "Tất cả"
//       if (value === "Tất cả") {
//         return {
//           ...prev,
//           [specType]: []
//         };
//       } else {
//         const currentValues = prev[specType] || [];
//         // If this value is already selected, remove it
//         if (currentValues.includes(value)) {
//           return {
//             ...prev,
//             [specType]: currentValues.filter(v => v !== value)
//           };
//         } 
//         // Otherwise add it
//         return {
//           ...prev,
//           [specType]: [...currentValues, value]
//         };
//       }
//     });
//   };
  
//   const clearFilters = () => {
//     setSelectedPriceRanges([]);
//     setCustomPriceRange([0, 0]);
//     setCustomPriceMin('');
//     setCustomPriceMax('');
//     setSelectedBrands([]);
    
//     // Reset all spec filters to empty arrays
//     const resetSpecs = Object.keys(selectedSpecs).reduce((acc, key) => {
//       acc[key] = [];
//       return acc;
//     }, {} as Record<string, string[]>);
    
//     setSelectedSpecs(resetSpecs);
//   };
  
//   // Handle load more
//   const handleLoadMore = () => {
//     setLoadMoreCount(prev => prev + 12);
//   };
  
//   // Format spec name for display
//   const formatSpecName = (key: string) => {
//     // Map technical keys to user-friendly Vietnamese names
//     const specNameMap: Record<string, string> = {
//       'ram_gb': 'RAM',
//       'cpu_brand': 'Hãng CPU',
//       'cpu_series': 'Dòng CPU',
//       'cpu_model': 'Model CPU',
//       'screen_size_inch': 'Kích thước màn hình',
//       'storage_gb': 'Dung lượng lưu trữ',
//       'storage_type': 'Loại ổ cứng',
//       'graphics_card': 'Card đồ họa',
//       'usage_type': 'Nhu cầu sử dụng',
//       'refresh_rate_hz': 'Tần số quét',
//       'weight_kg': 'Trọng lượng',
//       'battery_life_hours': 'Thời lượng pin',
//       'battery_capacity_mah': 'Dung lượng pin',
//       'screen_resolution': 'Độ phân giải',
//       'ports': 'Cổng kết nối',
//       'features': 'Tính năng đặc biệt',
//       'color': 'Màu sắc',
//       'material': 'Chất liệu',
//       'os': 'Hệ điều hành',
//       'warranty_months': 'Bảo hành',
//       'camera_mp': 'Camera',
//       'water_resistance': 'Chống nước',
//       'chip_set': 'Chip xử lý',
//       'chip_speed_ghz': 'Tốc độ chip',
//       'display_technology': 'Công nghệ màn hình'
//     };
    
//     // Nếu không có trong map, định dạng theo chuẩn mặc định
//     return specNameMap[key] || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
//   };
  
//   // Format price range for display
//   const formatPriceRangeLabel = (range: [number, number]): string => {
//     if (range[0] === 0 && range[1] === Infinity) {
//       return 'Tất cả';
//     } else if (range[0] === 0) {
//       return `Dưới ${formatVND(range[1], false)}`;
//     } else if (range[1] === Infinity) {
//       return `Trên ${formatVND(range[0], false)}`;
//     } else {
//       return `Từ ${formatVND(range[0], false)} - ${formatVND(range[1], false)}`;
//     }
//   };
  
//   // Check if any filters are applied
//   const hasActiveFilters = selectedBrands.length > 0 || 
//     Object.values(selectedSpecs).some(values => values.length > 0) ||
//     selectedPriceRanges.length > 0 || 
//     (customPriceRange[0] > 0 || customPriceRange[1] > 0);
  
//   // Loading state
//   if (categoryLoading || filtersLoading) {
//     return (
//       <div className="container max-w-7xl mx-auto px-4 py-12">
//         <div className="flex justify-center items-center min-h-[50vh]">
//           <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
//         </div>
//       </div>
//     );
//   }
  
//   // Error state
//   if (categoryError || productsError) {
//     return (
//       <div className="container max-w-7xl mx-auto px-4 py-12">
//         <div className="text-center py-12">
//           <h2 className="text-2xl font-bold mb-4">Lỗi khi tải danh mục</h2>
//           <p className="text-muted-foreground mb-6">
//             {categoryError?.message || productsError?.message || "Đã xảy ra lỗi"}
//           </p>
//           <Link 
//             to="/" 
//             className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground"
//           >
//             Quay về Trang chủ
//           </Link>
//         </div>
//       </div>
//     );
//   }
  
//   // If category doesn't exist
//   if (!category) {
//     return (
//       <div className="container max-w-7xl mx-auto px-4 py-12">
//         <div className="text-center py-12">
//           <h2 className="text-2xl font-bold mb-4">Không tìm thấy danh mục</h2>
//           <p className="text-muted-foreground mb-6">
//             Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
//           </p>
//           <Link 
//             to="/" 
//             className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground"
//           >
//             Quay về Trang chủ
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Calculate if more products can be loaded
//   const canLoadMore = products.length < totalProducts;
  
//   return (
//     <div className="container max-w-7xl mx-auto px-4 py-8">
//       {/* Breadcrumb - Updated to show full hierarchy */}
//       <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-6">
//         <Link to="/" className="hover:text-primary">Trang chủ</Link>
//         {categoryPath.map((cat, index) => (
//           <React.Fragment key={cat.id}>
//             <span className="mx-2">/</span>
//             {index === categoryPath.length - 1 ? (
//               <span className="text-foreground">{cat.name}</span>
//             ) : (
//               <Link to={`/category/${cat.slug}`} className="hover:text-primary">
//                 {cat.name}
//               </Link>
//             )}
//           </React.Fragment>
//         ))}
//       </div>
      
//       {/* Filter and Sort Controls */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//         {/* Mobile filter button */}
//         <button 
//           onClick={() => setIsFilterOpen(!isFilterOpen)}
//           className="md:hidden flex items-center px-4 py-2 rounded border hover:bg-muted"
//         >
//           <FilterIcon className="h-4 w-4 mr-2" />
//           Bộ lọc sản phẩm
//         </button>
        
//         {/* Sort control only - moved results count to product area */}
//         <div className="w-full md:w-auto flex justify-end items-center">
//           <div className="relative">
//             <select
//               value={sortOption}
//               onChange={(e) => setSortOption(e.target.value)}
//               className="appearance-none px-4 py-2 pr-8 rounded border bg-transparent text-sm hover:bg-muted focus:outline-none"
//             >
//               <option value="newest">Nổi bật</option>
//               <option value="price_asc">Giá: Thấp đến cao</option>
//               <option value="price_desc">Giá: Cao đến thấp</option>
//               <option value="best_selling">Bán chạy nhất</option>
//             </select>
//             <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
//           </div>
//         </div>
//       </div>
      
//       {/* Content grid with filters */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         {/* Filter Sidebar - Desktop always visible, mobile conditional */}
//         <div className={`
//           md:block
//           ${isFilterOpen ? 'fixed inset-0 z-50 bg-background p-6 overflow-y-auto md:sticky md:top-4 md:h-auto md:inset-auto md:p-0' : 'hidden'}
//         `}>
//           {/* Mobile header */}
//           <div className="flex justify-between items-center mb-6 md:hidden">
//             <h2 className="font-bold text-lg">Bộ lọc</h2>
//             <button onClick={() => setIsFilterOpen(false)}>
//               <X className="h-6 w-6" />
//             </button>
//           </div>
          
//           {/* Filter container with independent scrolling */}
//           <div className="bg-white rounded-lg border md:sticky md:top-4 md:max-h-[calc(100vh-100px)] md:overflow-y-auto">
//             {/* Price Range Filter */}
//             <div className="border-b">
//               <button 
//                 onClick={() => toggleSection('price')}
//                 className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
//               >
//                 Mức giá
//                 {collapsedSections.price ? (
//                   <ChevronDown className="h-5 w-5" />
//                 ) : (
//                   <ChevronUp className="h-5 w-5" />
//                 )}
//               </button>
              
//               {!collapsedSections.price && (
//                 <div className="px-4 pb-4">
//                   <div className="space-y-2 mb-4">
//                     <label className="flex items-center space-x-2">
//                       <input 
//                         type="checkbox" 
//                         checked={selectedPriceRanges.length === 0 && customPriceRange[0] === 0 && customPriceRange[1] === 0}
//                         onChange={() => {
//                           setSelectedPriceRanges([]);
//                           setCustomPriceRange([0, 0]);
//                           setCustomPriceMin('');
//                           setCustomPriceMax('');
//                         }}
//                         className="rounded text-red-500 focus:ring-red-500"
//                       />
//                       <span className="text-sm">Tất cả</span>
//                     </label>
                    
//                     {predefinedPriceRanges.map((range, index) => (
//                       <label key={index} className="flex items-center space-x-2">
//                         <input 
//                           type="checkbox" 
//                           checked={selectedPriceRanges.some(([min, max]) => min === range[0] && max === range[1])}
//                           onChange={() => togglePriceRange(range)}
//                           className="rounded text-red-500 focus:ring-red-500"
//                         />
//                         <span className="text-sm">{formatPriceRangeLabel(range)}</span>
//                       </label>
//                     ))}
//                   </div>
                  
//                   {/* Custom price range input - Adjusted for horizontal scrolling */}
//                   <div className="pt-3 border-t">
//                     <p className="text-sm font-medium mb-2">Hoặc nhập khoảng giá phù hợp với bạn:</p>
//                     <form onSubmit={handleCustomPriceSubmit} className="space-y-2">
//                       <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full">
//                         <input
//                           type="text"
//                           value={customPriceMin}
//                           onChange={(e) => handlePriceInputChange(e, setCustomPriceMin)}
//                           placeholder="17.490.000"
//                           className="min-w-0 w-full px-3 py-1.5 border rounded text-sm"
//                         />
//                         <span className="whitespace-nowrap">~</span>
//                         <input
//                           type="text"
//                           value={customPriceMax}
//                           onChange={(e) => handlePriceInputChange(e, setCustomPriceMax)}
//                           placeholder="149.990.000"
//                           className="min-w-0 w-full px-3 py-1.5 border rounded text-sm"
//                         />
//                       </div>
//                       <button
//                         type="submit"
//                         className="w-full py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
//                       >
//                         Áp dụng
//                       </button>
//                     </form>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* Brand Filter */}
//             <div className="border-b">
//               <button 
//                 onClick={() => toggleSection('brands')}
//                 className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
//               >
//                 Hãng sản xuất
//                 {collapsedSections.brands ? (
//                   <ChevronDown className="h-5 w-5" />
//                 ) : (
//                   <ChevronUp className="h-5 w-5" />
//                 )}
//               </button>
              
//               {!collapsedSections.brands && (
//                 <div className="px-4 pb-4 grid grid-cols-2 gap-2">
//                   {brands.map((brand) => (
//                     <button 
//                       key={brand.id}
//                       onClick={() => toggleBrandFilter(brand.id)}
//                       className={`text-center py-2 px-3 text-sm border rounded ${
//                         selectedBrands.includes(brand.id) 
//                           ? 'bg-red-50 border-red-200 text-red-500' 
//                           : 'hover:bg-slate-50'
//                       }`}
//                     >
//                       {brand.name}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
            
//             {/* Specifications Filters - Dynamic based on category */}
//             {/* DEBUG INFO */}
//             {!isFilterOpen && !filtersLoading && (
//               <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-b">
//                 <div>specifications keys: {Object.keys(specifications).join(', ') || 'none'}</div>
//                 <div>specifications length: {Object.keys(specifications).length}</div>
//                 <div>category ID: {categoryId || 'none'}</div>
//               </div>
//             )}

//             {Object.keys(specifications).length > 0 ? (
//               Object.entries(specifications).map(([specKey, values]) => {
//                 console.log(`Rendering specification ${specKey}:`, values);
//                 return (
//                   <div key={specKey} className="border-b">
//                     <button 
//                       onClick={() => toggleSection(specKey)}
//                       className="w-full px-4 py-4 flex items-center justify-between font-medium hover:bg-slate-50"
//                     >
//                       {formatSpecName(specKey)}
//                       {collapsedSections[specKey] ? (
//                         <ChevronDown className="h-5 w-5" />
//                       ) : (
//                         <ChevronUp className="h-5 w-5" />
//                       )}
//                     </button>
                    
//                     {!collapsedSections[specKey] && (
//                       <div className={`px-4 pb-4 ${gridViewSpecs.includes(specKey) ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
//                         {gridViewSpecs.includes(specKey) ? (
//                           // Grid style for RAM and Refresh Rate
//                           <>
//                             <button 
//                               onClick={() => toggleSpecFilter(specKey, "Tất cả")}
//                               className={`text-center py-2 px-3 text-sm border rounded ${
//                                 (!selectedSpecs[specKey] || selectedSpecs[specKey].length === 0) 
//                                   ? 'bg-red-50 border-red-200 text-red-500' 
//                                   : 'hover:bg-slate-50'
//                               }`}
//                             >
//                               Tất cả
//                             </button>
                            
//                             {values.length > 0 ? (
//                               values.map((value) => (
//                                 <button 
//                                   key={value}
//                                   onClick={() => toggleSpecFilter(specKey, value)}
//                                   className={`text-center py-2 px-3 text-sm border rounded ${
//                                     selectedSpecs[specKey]?.includes(value) 
//                                       ? 'bg-red-50 border-red-200 text-red-500' 
//                                       : 'hover:bg-slate-50'
//                                   }`}
//                                 >
//                                   {value}
//                                 </button>
//                               ))
//                             ) : (
//                               <p className="text-sm text-muted-foreground py-2">Không có dữ liệu</p>
//                             )}
//                           </>
//                         ) : (
//                           // Checkbox style for other specs
//                           <>
//                             <label className="flex items-center space-x-2">
//                               <input 
//                                 type="checkbox" 
//                                 checked={!selectedSpecs[specKey] || selectedSpecs[specKey].length === 0}
//                                 onChange={() => toggleSpecFilter(specKey, "Tất cả")}
//                                 className="rounded text-red-500 focus:ring-red-500"
//                               />
//                               <span className="text-sm">Tất cả</span>
//                             </label>
                            
//                             {values.length > 0 ? (
//                               values.map((value) => (
//                                 <label key={value} className="flex items-center space-x-2">
//                                   <input 
//                                     type="checkbox" 
//                                     checked={selectedSpecs[specKey]?.includes(value) || false}
//                                     onChange={() => toggleSpecFilter(specKey, value)}
//                                     className="rounded text-red-500 focus:ring-red-500"
//                                   />
//                                   <span className="text-sm">{value}</span>
//                                 </label>
//                               ))
//                             ) : (
//                               <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
//                             )}
//                           </>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })
//             ) : (
//               <div className="px-4 py-6 text-center">
//                 <p className="text-sm text-muted-foreground">Không có thông số kỹ thuật nào cho danh mục này</p>
//               </div>
//             )}
            
//             {/* Clear all filters button (only on mobile) */}
//             {hasActiveFilters && (
//               <div className="p-4 md:hidden">
//                 <button 
//                   onClick={clearFilters}
//                   className="w-full py-3 rounded border border-red-500 text-red-500 hover:bg-red-50"
//                 >
//                   Xóa tất cả bộ lọc
//                 </button>
//               </div>
//             )}
            
//             {/* Apply Filters button on mobile */}
//             <div className="p-4 md:hidden">
//               <button 
//                 onClick={() => setIsFilterOpen(false)}
//                 className="w-full py-3 rounded bg-red-500 text-white"
//               >
//                 Áp dụng bộ lọc
//               </button>
//             </div>
//           </div>
//         </div>
        
//         {/* Products Grid and Active Filters */}
//         <div className="md:col-span-3">
//           {/* Results count moved here */}
//           <div className="flex justify-between items-center mb-4">
//             <div className="text-sm text-muted-foreground">
//               Tìm thấy <span className="font-medium">{totalProducts}</span> sản phẩm
//             </div>
//           </div>
          
//           {/* Active Filters */}
//           {hasActiveFilters && (
//             <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-slate-50 rounded-lg">
//               {/* Price range filters - combine all selected ranges for display */}
//               {selectedPriceRanges.length > 0 && (
//                 selectedPriceRanges.map((range, index) => (
//                   <div key={`price-range-${index}`} className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
//                     <span>{formatPriceRangeLabel(range)}</span>
//                     <button 
//                       onClick={() => togglePriceRange(range)}
//                       className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </div>
//                 ))
//               )}
              
//               {/* Custom price range */}
//               {(customPriceRange[0] > 0 || customPriceRange[1] > 0) && (
//                 <div className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
//                   <span>Từ {formatVND(customPriceRange[0], false)} - {formatVND(customPriceRange[1], false)} đ</span>
//                   <button 
//                     onClick={() => {
//                       setCustomPriceRange([0, 0]);
//                       setCustomPriceMin('');
//                       setCustomPriceMax('');
//                     }}
//                     className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
//                   >
//                     <X className="h-3 w-3" />
//                   </button>
//                 </div>
//               )}
              
//               {/* Show active brand filters */}
//               {selectedBrands.length > 0 && brands.filter(brand => selectedBrands.includes(brand.id)).map(brand => (
//                 <div key={brand.id} className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
//                   <span>{brand.name}</span>
//                   <button 
//                     onClick={() => toggleBrandFilter(brand.id)}
//                     className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
//                   >
//                     <X className="h-3 w-3" />
//                   </button>
//                 </div>
//               ))}
              
//               {/* Show active spec filters */}
//               {Object.entries(selectedSpecs).map(([specKey, values]) => 
//                 values.map(value => (
//                   <div key={`${specKey}-${value}`} className="flex items-center gap-1 text-sm bg-white rounded-full pl-3 pr-1 py-1 border">
//                     <span>{value}</span>
//                     <button 
//                       onClick={() => toggleSpecFilter(specKey, value)}
//                       className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </div>
//                 ))
//               )}
              
//               {/* Clear all filters button */}
//               <button 
//                 onClick={clearFilters}
//                 className="flex items-center gap-1 text-sm text-red-500 rounded-full px-3 py-1 hover:underline ml-auto"
//               >
//                 <span>Xóa tất cả</span>
//               </button>
//             </div>
//           )}
          
//           {/* Products */}
//           {isProductsLoading && (
//             <div className="flex justify-center items-center py-12">
//               <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
//             </div>
//           )}
          
//           {!isProductsLoading && products.length > 0 && (
//             <>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {products.map((product) => (
//                   <ProductCard key={product.id} product={product} />
//                 ))}
//               </div>
              
//               {/* Load More instead of pagination */}
//               {canLoadMore && (
//                 <div className="flex justify-center mt-12">
//                   <button
//                     onClick={handleLoadMore}
//                     className="px-8 py-3 rounded-md border hover:bg-muted transition-colors"
//                     disabled={isProductsLoading}
//                   >
//                     {isProductsLoading ? (
//                       <span className="flex items-center">
//                         <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
//                         Đang tải...
//                       </span>
//                     ) : (
//                       "Xem thêm sản phẩm"
//                     )}
//                   </button>
//                 </div>
//               )}
//             </>
//           )}
          
//           {!isProductsLoading && products.length === 0 && (
//             <div className="text-center py-12">
//               <h3 className="text-xl font-medium mb-4">Không tìm thấy sản phẩm nào</h3>
//               <p className="text-muted-foreground mb-6">
//                 {hasActiveFilters 
//                   ? "Hãy thử điều chỉnh bộ lọc của bạn" 
//                   : "Hiện không có sản phẩm nào trong danh mục này"}
//               </p>
//               {hasActiveFilters && (
//                 <button 
//                   onClick={clearFilters}
//                   className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
//                 >
//                   Xóa tất cả bộ lọc
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CategoryProducts;