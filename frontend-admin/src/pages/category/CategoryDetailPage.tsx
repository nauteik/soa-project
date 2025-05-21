import { ArrowLeft, ChevronRight, Edit, Info, List, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Category, getCategoryById, getRootCategory, getSubcategories } from '../../services/categoryApi';

interface SpecificationField {
  key: string;
  labelVi: string;
  labelEn: string;
  type: string;
  sortOrder: number;
}

const CategoryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [rootCategory, setRootCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'specifications'>('info');
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!id) {
        setError('ID danh mục không hợp lệ');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Đặt lại state ban đầu
        setParentCategory(null);
        setRootCategory(null);
        
        const categoryData = await getCategoryById(parseInt(id));
        setCategory(categoryData);
        console.log("Đã lấy thông tin danh mục:", categoryData.name, "với parent_id:", categoryData.parent_id);
        
        // Lấy danh mục gốc trước để có thông tin đầy đủ hơn
        try {
          const rootCategoryData = await getRootCategory(parseInt(id));
          setRootCategory(rootCategoryData);
          console.log("Đã lấy thông tin danh mục gốc:", rootCategoryData.name);
        } catch (rootError) {
          console.error('Lỗi khi lấy thông tin danh mục gốc:', rootError);
          toast.error('Không thể tải thông số kỹ thuật từ danh mục gốc.');
        }
        
        // Nếu danh mục có parent_id, lấy thông tin danh mục cha
        if (categoryData.parent_id) {
          try {
            console.log("Đang lấy thông tin danh mục cha với ID:", categoryData.parent_id);
            const parentData = await getCategoryById(categoryData.parent_id);
            console.log("Đã lấy thông tin danh mục cha:", parentData.name);
            setParentCategory(parentData);
          } catch (parentError) {
            console.error('Lỗi khi lấy thông tin danh mục cha:', parentError);
            
            // Nếu không lấy được parent trực tiếp, thử lấy từ danh sách subcategories của root
            if (rootCategory && rootCategory.id !== categoryData.id) {
              try {
                console.log("Thử lấy parent từ danh sách subcategories của root:", rootCategory.name);
                const subcategories = await getSubcategories(rootCategory.id);
                const possibleParent = subcategories.find(c => c.id === categoryData.parent_id);
                if (possibleParent) {
                  console.log("Đã tìm thấy parent từ subcategories của root:", possibleParent.name);
                  setParentCategory(possibleParent);
                } else {
                  console.log("Không tìm thấy parent trong subcategories của root");
                }
              } catch (subError) {
                console.error('Không thể lấy subcategories từ root:', subError);
              }
            }
          }
        } else {
          console.log("Danh mục này không có parent_id");
        }
        
        // Lấy danh sách danh mục con
        try {
          const subCategoriesData = await getSubcategories(parseInt(id));
          setSubcategories(subCategoriesData);
          console.log(`Đã lấy ${subCategoriesData.length} danh mục con`);
        } catch (subError) {
          console.error('Lỗi khi lấy danh sách danh mục con:', subError);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải thông tin danh mục');
        console.error('Error fetching category:', err);
        toast.error('Không thể tải thông tin danh mục.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [id]);

  // Định dạng loại dữ liệu của thông số kỹ thuật để hiển thị người dùng
  const formatSpecificationType = (type: string): string => {
    switch (type) {
      case 'text':
        return 'Văn bản';
      case 'number':
        return 'Số';
      case 'boolean':
        return 'Có/Không';
      case 'list':
        return 'Danh sách';
      default:
        return type;
    }
  };

  // Format thời gian
  const formatDateTime = (dateTimeString?: string): string => {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-medium text-red-600 mb-2">Lỗi</h3>
        <p className="text-gray-600 mb-4">{error || 'Không tìm thấy danh mục'}</p>
        <button 
          onClick={() => navigate('/categories/list')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft size={16} className="mr-2" /> Quay lại
        </button>
      </div>
    );
  }

  // Lấy thông số kỹ thuật từ category hoặc từ rootCategory (nếu category không có thông số)
  const specificationFields = category.specificationFields && category.specificationFields.length > 0 
    ? category.specificationFields 
    : rootCategory?.specificationFields || [];
    console.log(category);
    console.log(rootCategory);
    console.log(category.specificationFields);
    console.log(specificationFields);
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/categories/list')}
            className="mr-4 p-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{category.name}</h1>
            <div className="text-gray-600 flex items-center">
              {parentCategory ? (
                <>
                  <span 
                    className="text-blue-600 hover:underline cursor-pointer"
                    onClick={() => navigate(`/categories/${parentCategory.id}`)}
                  >
                    {parentCategory.name}
                  </span>
                  <ChevronRight size={16} className="mx-1" />
                </>
              ) : category.parent_id ? (
                <>
                  <span 
                    className="text-blue-600 hover:underline cursor-pointer"
                    onClick={() => navigate(`/categories/${category.parent_id}`)}
                  >
                    ID: {category.parent_id}
                  </span>
                  <ChevronRight size={16} className="mx-1" />
                </>
              ) : null}
              <span>{category.name}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate(`/categories/edit/${category.id}`)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center"
          >
            <Edit size={18} className="mr-2" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <div className="flex -mb-px">
            <button
              className={`py-3 px-4 text-sm font-medium flex items-center border-b-2 ${
                activeTab === 'info' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('info')}
            >
              <Info size={18} className="mr-2" />
              Thông tin cơ bản
            </button>
            <button
              className={`py-3 px-4 text-sm font-medium flex items-center border-b-2 ${
                activeTab === 'specifications' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('specifications')}
            >
              <Settings size={18} className="mr-2" />
              Thông số kỹ thuật
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Thông tin cơ bản</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">ID</div>
                        <div className="font-medium">{category.id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Tên danh mục</div>
                        <div className="font-medium">{category.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Slug</div>
                        <div className="font-medium">{category.slug}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Danh mục cha</div>
                        <div className="font-medium">
                          {parentCategory ? (
                            <span
                              className="text-blue-600 hover:underline cursor-pointer"
                              onClick={() => navigate(`/categories/${parentCategory.id}`)}
                            >
                              {parentCategory.name}
                            </span>
                          ) : category.parent_id ? (
                            <div className="flex items-center">
                              <span className="text-gray-400">Đang tải...</span>
                              <button 
                                className="ml-2 text-xs text-blue-500 hover:underline"
                                onClick={() => navigate(`/categories/${category.parent_id}`)}
                              >
                                Xem danh mục (ID: {category.parent_id})
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400">Không có (danh mục gốc)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Ngày tạo</div>
                        <div className="font-medium">{formatDateTime(category.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cập nhật lần cuối</div>
                        <div className="font-medium">{formatDateTime(category.updated_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Mô tả</h3>
                  <div className="bg-gray-50 p-4 rounded-md h-full">
                    {category.description ? (
                      <p className="text-gray-700 whitespace-pre-line">{category.description}</p>
                    ) : (
                      <p className="text-gray-400 italic">Không có mô tả</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">
                  Danh mục con
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {subcategories && subcategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subcategories.map(subcat => (
                        <div 
                          key={subcat.id}
                          className="p-3 border border-gray-200 rounded-md bg-white hover:bg-blue-50 cursor-pointer flex items-center"
                          onClick={() => navigate(`/categories/${subcat.id}`)}
                        >
                          <List size={16} className="text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-blue-600">{subcat.name}</div>
                            <div className="text-xs text-gray-500">
                              {/* TODO: Hiển thị số lượng sản phẩm trong danh mục */}
                              {/* {subcat.productsCount || 0} sản phẩm */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Không có danh mục con</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Thông số kỹ thuật</h3>
                {rootCategory && rootCategory.id !== category.id && (
                  <div className="text-sm text-gray-500">
                    Thông số kỹ thuật được kế thừa từ danh mục gốc: 
                    <span 
                      className="text-blue-600 hover:underline cursor-pointer ml-1"
                      onClick={() => navigate(`/categories/${rootCategory.id}`)}
                    >
                      {rootCategory.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => navigate(`/categories/edit/${rootCategory?.id || category.id}`)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit size={14} className="mr-1" />
                  {rootCategory && rootCategory.id !== category.id ? 'Chỉnh sửa tại gốc' : 'Chỉnh sửa'}
                </button>
              </div>

              {specificationFields && specificationFields.length > 0 ? (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên hiển thị (Vi)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên hiển thị (En)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kiểu dữ liệu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {specificationFields
                        .sort((a: SpecificationField, b: SpecificationField) => a.sortOrder - b.sortOrder)
                        .map((field: SpecificationField, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {field.sortOrder}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-900">{field.key}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{field.labelVi}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{field.labelEn}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {formatSpecificationType(field.type)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                  <Settings size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Danh mục này chưa có thông số kỹ thuật nào.</p>
                  <button
                    onClick={() => navigate(`/categories/edit/${rootCategory?.id || category.id}`)}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit size={14} className="mr-1" />
                    Thêm thông số
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryDetailPage; 