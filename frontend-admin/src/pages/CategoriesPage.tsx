import { ArrowDown, ArrowUp, Edit, Eye, Filter, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Category, getAllCategories, getRootCategory, getSubcategories } from '../services/categoryApi';

// Mở rộng interface Category để thêm thuộc tính nội bộ
interface EnhancedCategory extends Category {
  _subcategoriesCount?: number;
}

interface FilterOptions {
  parentId: number | null;
  hasSubcategories: 'all' | 'yes' | 'no';
  hasSpecifications: 'all' | 'yes' | 'no';
  sort: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';
}

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<EnhancedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Lọc và sắp xếp
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    parentId: null,
    hasSubcategories: 'all',
    hasSpecifications: 'all',
    sort: 'name_asc'
  });
  
  // Danh sách danh mục cha để lọc
  const [parentCategories, setParentCategories] = useState<EnhancedCategory[]>([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const data = await getAllCategories();
        
        // Sau khi lấy danh sách categories, cập nhật dữ liệu về subcategories và specification_fields
        const updatedCategories: EnhancedCategory[] = await Promise.all(
          data.map(async (category) => {
            try {
              // Lấy danh sách subcategories nếu cần
              const subcategories = await getSubcategories(category.id);
              
              // Nếu category không có specification_fields và không phải là danh mục gốc (có parent_id),
              // thì tìm lấy specification_fields từ category gốc
              let specFields = category.specificationFields;
              if ((!specFields || specFields.length === 0) && category.parent_id) {
                try {
                  const rootCategory = await getRootCategory(category.id);
                  specFields = rootCategory.specificationFields;
                } catch (error) {
                  console.error(`Error fetching root category for ${category.id}:`, error);
                }
              }
              
              return {
                ...category,
                _subcategoriesCount: subcategories.length,
                specificationFields: specFields
              };
            } catch (error) {
              console.error(`Error enriching category ${category.id}:`, error);
              return category;
            }
          })
        );
        
        setCategories(updatedCategories);
        
        // Lọc ra các danh mục cha (không có parent_id)
        const parents = updatedCategories.filter(category => !category.parent_id);
        setParentCategories(parents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Format ngày tháng
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  // Tìm tên danh mục cha
  const getParentCategoryName = (parentId: number | null | undefined): string => {
    if (!parentId) return '';
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : '';
  };

  // Đếm số danh mục con
  const countSubcategories = (categoryId: number): number => {
    const category = categories.find(cat => cat.id === categoryId) as EnhancedCategory;
    // Nếu đã có thông tin số lượng subcategories từ API, ưu tiên sử dụng
    if (category && category._subcategoriesCount !== undefined) {
      return category._subcategoriesCount;
    }
    // Nếu không có, đếm từ danh sách categories
    return categories.filter(cat => cat.parent_id === categoryId).length;
  };

  // Kiểm tra có specification fields hay không
  const hasSpecificationFields = (category: EnhancedCategory): boolean => {
    return category.specificationFields !== undefined && 
           Array.isArray(category.specificationFields) && 
           category.specificationFields.length > 0;
  };

  // Lọc và sắp xếp danh mục
  const getFilteredAndSortedCategories = () => {
    return categories
      .filter(category => {
        // Lọc theo từ khóa tìm kiếm
        const matchesSearch = 
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getParentCategoryName(category.parent_id).toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Lọc theo danh mục cha
        if (filterOptions.parentId !== null && category.parent_id !== filterOptions.parentId) {
          // Xử lý trường hợp đặc biệt: nếu filter là "Danh mục gốc" (parentId = 0), thì lọc ra các danh mục không có parent
          if (filterOptions.parentId === 0 && category.parent_id !== undefined) {
            return false;
          }
          
          if (filterOptions.parentId !== 0 && category.parent_id !== filterOptions.parentId) {
            return false;
          }
        }
        
        // Lọc theo có danh mục con
        const subCategoriesCount = countSubcategories(category.id);
        if (filterOptions.hasSubcategories === 'yes' && subCategoriesCount === 0) return false;
        if (filterOptions.hasSubcategories === 'no' && subCategoriesCount > 0) return false;
        
        // Lọc theo có thông số kỹ thuật
        const hasSpecs = hasSpecificationFields(category);
        if (filterOptions.hasSpecifications === 'yes' && !hasSpecs) return false;
        if (filterOptions.hasSpecifications === 'no' && hasSpecs) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Sắp xếp theo tiêu chí đã chọn
        switch (filterOptions.sort) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'date_asc':
            return (new Date(a.created_at || 0).getTime()) - (new Date(b.created_at || 0).getTime());
          case 'date_desc':
            return (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime());
          default:
            return 0;
        }
      });
  };

  // Áp dụng phân trang cho danh mục đã lọc
  const getPaginatedCategories = () => {
    const filteredCategories = getFilteredAndSortedCategories();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCategories.slice(startIndex, endIndex);
  };

  const paginatedCategories = getPaginatedCategories();
  const filteredCategories = getFilteredAndSortedCategories();
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const handleViewDetail = (id: number) => {
    navigate(`/categories/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/categories/edit/${id}`);
  };

  const handleAddCategory = () => {
    navigate('/categories/create');
  };
  
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions({
      ...filterOptions,
      [key]: value
    });
  };
  
  const resetFilters = () => {
    setFilterOptions({
      parentId: null,
      hasSubcategories: 'all',
      hasSpecifications: 'all',
      sort: 'name_asc'
    });
    setSearchTerm('');
    setCurrentPage(1);
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
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý danh mục</h1>
          <p className="text-gray-600">Quản lý tất cả danh mục sản phẩm trong hệ thống</p>
        </div>
        <button 
          onClick={handleAddCategory}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Thêm danh mục
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
              placeholder="Tìm kiếm danh mục..."
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
            {(filterOptions.parentId !== null || 
              filterOptions.hasSubcategories !== 'all' || 
              filterOptions.hasSpecifications !== 'all') && (
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select
                  value={filterOptions.parentId === null ? '' : filterOptions.parentId}
                  onChange={(e) => handleFilterChange('parentId', e.target.value ? Number(e.target.value) : null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="0">Danh mục gốc</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Có danh mục con</label>
                <select
                  value={filterOptions.hasSubcategories}
                  onChange={(e) => handleFilterChange('hasSubcategories', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="yes">Có</option>
                  <option value="no">Không</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Có thông số kỹ thuật</label>
                <select
                  value={filterOptions.hasSpecifications}
                  onChange={(e) => handleFilterChange('hasSpecifications', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="yes">Có</option>
                  <option value="no">Không</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
                <select
                  value={filterOptions.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                  <option value="date_asc">Ngày tạo (cũ nhất)</option>
                  <option value="date_desc">Ngày tạo (mới nhất)</option>
                </select>
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
                        Tên danh mục
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục cha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục con
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số thông số
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Không tìm thấy danh mục
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{category.name}</div>
                              <div className="text-sm text-gray-500">{category.description?.substring(0, 50)}{category.description && category.description.length > 50 ? '...' : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getParentCategoryName(category.parent_id) || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{countSubcategories(category.id)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {category.specificationFields ? category.specificationFields.length : 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(category.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleViewDetail(category.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleEdit(category.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            {/* <button 
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa"
                              disabled={countSubcategories(category.id) > 0}
                            >
                              <Trash2 size={18} className={countSubcategories(category.id) > 0 ? 'opacity-50 cursor-not-allowed' : ''} />
                            </button> */}
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
            {filteredCategories.length > 0 && (
              <>Hiển thị <span className="font-medium">{paginatedCategories.length}</span> / <span className="font-medium">{filteredCategories.length}</span> danh mục</>
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
                      <div key={`ellipsis-${page}`}>
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
                      </div>
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

          {/* Số danh mục mỗi trang */}
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-700">Danh mục/trang:</span>
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

export default CategoriesPage; 