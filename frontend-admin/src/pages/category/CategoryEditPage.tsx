import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Loader, Plus, Save, X } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { API_BASE_URL, IMAGES_BASE_URL } from '../../config/api';
import { Category, getAllCategories, getCategoryById, getRootCategory, updateCategory } from '../../services/categoryApi';

// Interface cho Specification Field
interface SpecificationField {
  key: string;
  labelVi: string;
  labelEn: string;
  type: string;
  sortOrder: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string;
  specificationFields: SpecificationField[];
}

const fieldTypes = [
  { value: 'string', label: 'Văn bản (string)' },
  { value: 'number', label: 'Số (number)' },
  { value: 'boolean', label: 'Có/Không (boolean)' },
  { value: 'list', label: 'Danh sách (list)' },
];

const CategoryEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRootCategory, setIsRootCategory] = useState(true);
  const [rootCategory, setRootCategory] = useState<Category | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    specificationFields: []
  });

  // State cho hiển thị/ẩn phần thông số kỹ thuật
  const [showSpecifications, setShowSpecifications] = useState(true);

  // Tham chiếu tới input file
  const fileInputRef = useRef<HTMLInputElement>(null);
  // State cho file hình ảnh được chọn
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // State cho URL xem trước hình ảnh
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Load danh mục cha khi trang được tải
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        // Loại bỏ danh mục hiện tại khỏi danh sách danh mục cha có thể chọn 
        // để tránh trường hợp chọn chính nó làm cha
        const filteredCategories = data.filter(category => 
          category.id !== parseInt(id || '0')
        );
        setCategories(filteredCategories);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        toast.error('Không thể tải danh sách danh mục. Vui lòng thử lại sau.');
      }
    };

    fetchCategories();
  }, [id]);

  // Load dữ liệu danh mục đang chỉnh sửa
  useEffect(() => {
    if (!id) return;
    
    const fetchCategoryData = async () => {
      setIsLoading(true);
      try {
        const category = await getCategoryById(parseInt(id));
        
        // Kiểm tra xem đây có phải là danh mục gốc không (không có parent_id)
        setIsRootCategory(!category.parent_id);
        
        // Nếu không phải danh mục gốc, lấy danh mục gốc
        if (category.parent_id) {
          try {
            const root = await getRootCategory(parseInt(id));
            setRootCategory(root);
            
            // Không tự động chuyển đến trang danh mục gốc nữa
            // Populate form data với thông tin danh mục hiện tại
            setFormData({
              name: category.name,
              slug: category.slug,
              description: category.description || '',
              image_url: category.image_url || '',
              parent_id: category.parent_id ? category.parent_id.toString() : '',
              specificationFields: Array.isArray(category.specificationFields) 
                ? [...category.specificationFields] 
                : []
            });
          } catch (error) {
            console.error('Lỗi khi lấy danh mục gốc:', error);
            toast.error('Không thể xác định danh mục gốc để quản lý thông số kỹ thuật.');
          }
        } else {
          // Populate form data
          setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            image_url: category.image_url || '',
            parent_id: category.parent_id ? category.parent_id.toString() : '',
            specificationFields: Array.isArray(category.specificationFields) 
              ? [...category.specificationFields] 
              : []
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin danh mục:', error);
        toast.error('Không thể tải thông tin danh mục. Vui lòng thử lại sau.');
        navigate('/categories/list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [id, navigate]);

  // Tạo slug tự động từ tên khi tên thay đổi và slug chưa được tùy chỉnh
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  
  useEffect(() => {
    if (formData.name && !isSlugCustomized) {
      const generatedSlug = formData.name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
        .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý riêng cho chữ đ
        .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/--+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
        .trim(); // Loại bỏ khoảng trắng thừa
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, isSlugCustomized]);

  // Xử lý thay đổi input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Set flag isSlugCustomized if user manually changes the slug
    if (name === 'slug') {
      setIsSlugCustomized(true);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Thêm thông số kỹ thuật mới
  const addSpecificationField = () => {
    const newField: SpecificationField = {
      key: '',
      labelVi: '',
      labelEn: '',
      type: 'string',
      sortOrder: formData.specificationFields.length + 1
    };
    
    setFormData(prev => ({
      ...prev,
      specificationFields: [...prev.specificationFields, newField]
    }));
  };

  // Xóa thông số kỹ thuật
  const removeSpecificationField = (index: number) => {
    const updatedFields = [...formData.specificationFields];
    updatedFields.splice(index, 1);
    
    // Cập nhật lại sortOrder
    const reorderedFields = updatedFields.map((field, idx) => ({
      ...field,
      sortOrder: idx + 1
    }));
    
    setFormData(prev => ({
      ...prev,
      specificationFields: reorderedFields
    }));
  };

  // Thay đổi thứ tự thông số
  const moveSpecificationField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.specificationFields.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedFields = [...formData.specificationFields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[newIndex];
    updatedFields[newIndex] = temp;
    
    // Cập nhật lại sortOrder
    const reorderedFields = updatedFields.map((field, idx) => ({
      ...field,
      sortOrder: idx + 1
    }));
    
    setFormData(prev => ({
      ...prev,
      specificationFields: reorderedFields
    }));
  };

  // Cập nhật giá trị cho thông số kỹ thuật
  const handleSpecificationFieldChange = (index: number, field: keyof SpecificationField, value: string) => {
    const updatedFields = [...formData.specificationFields];
    
    // Xử lý đặc biệt cho trường key - tự động tạo key từ labelVi nếu trường này đang được cập nhật
    if (field === 'labelVi' && !updatedFields[index].key) {
      const generatedKey = value
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/--+/g, '_')
        .trim();
      
      updatedFields[index] = {
        ...updatedFields[index],
        key: generatedKey,
        [field]: value
      };
    } else {
      updatedFields[index] = {
        ...updatedFields[index],
        [field]: value
      };
    }
    
    setFormData(prev => ({
      ...prev,
      specificationFields: updatedFields
    }));
  };

  // Khi load dữ liệu danh mục, cập nhật URL xem trước nếu có hình ảnh
  useEffect(() => {
    if (formData.image_url) {
      setPreviewUrl(`${IMAGES_BASE_URL}${formData.image_url}`);
    }
  }, [formData.image_url]);

  // Xử lý khi chọn file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    
    if (file) {
      // Tạo URL xem trước cho hình ảnh
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Nếu không có file mới và có image_url cũ, sử dụng URL cũ
      if (formData.image_url) {
        setPreviewUrl(`${IMAGES_BASE_URL}${formData.image_url}`);
      } else {
        setPreviewUrl('');
      }
    }
  };

  // Hàm upload ảnh riêng biệt
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Gọi API upload ảnh riêng
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi tải lên ảnh');
      }
      
      const data = await response.json();
      // Chỉ trả về tên file để lưu vào DB
      return data.filename;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    
    if (!formData.slug) {
      toast.error('Vui lòng nhập slug cho danh mục');
      return;
    }
    
    // Validate specification fields
    const hasInvalidSpecFields = formData.specificationFields.some(field => 
      !field.key || !field.labelVi || !field.labelEn
    );
    
    if (hasInvalidSpecFields) {
      toast.error('Vui lòng điền đầy đủ thông tin cho tất cả các thông số kỹ thuật');
      return;
    }
    
    // Kiểm tra trùng lặp key
    const keys = formData.specificationFields.map(field => field.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      toast.error('Các key của thông số kỹ thuật không được trùng nhau');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Nếu có file mới, upload file trước qua API riêng biệt
      let updatedImageUrl = formData.image_url;
      
      if (selectedFile) {
        try {
          // Upload ảnh trước qua API riêng
          updatedImageUrl = await uploadImage(selectedFile);
          console.log("Đã upload ảnh thành công:", updatedImageUrl);
        } catch (uploadError) {
          console.error("Lỗi khi upload ảnh:", uploadError);
          toast.error("Không thể tải lên hình ảnh. Vui lòng thử lại.");
          setIsSubmitting(false);
          return;
        }
      }
      
      // Sau khi upload ảnh, tiến hành cập nhật danh mục với URL ảnh mới
      const categoryData = {
        id: parseInt(id || '0'),
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        // Nếu có file mới, sử dụng URL mới sau khi upload
        // Nếu không, sử dụng URL hiện tại từ formData - chỉ gửi nếu thực sự có giá trị
        image_url: selectedFile ? updatedImageUrl : (formData.image_url || undefined),
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        specificationFields: isRootCategory ? formData.specificationFields : undefined
      };
      
      console.log("Gửi dữ liệu cập nhật:", JSON.stringify(categoryData, null, 2));
      
      const updatedCategory = await updateCategory(categoryData);
      console.log('Cập nhật danh mục:', updatedCategory);
      toast.success('Đã cập nhật danh mục thành công!');
      
      // Lưu giá trị image_url hiện tại để đảm bảo không bị mất
      const currentImageUrl = updatedCategory.image_url || formData.image_url;
      
      // Cập nhật lại formData sau khi cập nhật thành công
      setFormData(prev => ({ 
        ...prev, 
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        description: updatedCategory.description || '',
        parent_id: updatedCategory.parent_id ? updatedCategory.parent_id.toString() : '',
        image_url: currentImageUrl
      }));
      
      // Cập nhật previewUrl nếu có hình ảnh
      if (currentImageUrl) {
        setPreviewUrl(`${IMAGES_BASE_URL}${currentImageUrl}`);
      }
      
      // Reset selectedFile sau khi cập nhật thành công
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật danh mục:', error);
      
      // Kiểm tra lỗi từ API
      if (error.message && error.message.includes('không thể xóa thông số')) {
        toast.error(error.message);
      } else {
        toast.error('Không thể cập nhật danh mục. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader size={40} className="animate-spin text-blue-500 mb-4" />
          <p>Đang tải thông tin danh mục...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-semibold text-gray-800">Chỉnh sửa danh mục</h1>
            <p className="text-gray-600">Cập nhật thông tin và thông số kỹ thuật của danh mục</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Save size={18} className="mr-2" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên danh mục"
                required
              />
            </div>
            
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh danh mục
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-md p-4 w-40 h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">Nhấp để tải lên hình ảnh</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      // Nếu có image_url cũ, giữ lại URL đó
                      if (formData.image_url) {
                        setPreviewUrl(`${IMAGES_BASE_URL}${formData.image_url}`);
                      } else {
                        setPreviewUrl('');
                      }
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    {formData.image_url ? 'Hủy thay đổi' : 'Xóa hình ảnh'}
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Tải lên hình ảnh đại diện cho danh mục. Kích thước tối ưu: 128x128px.
              </p>
            </div>
            
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="danh-muc-slug"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {isSlugCustomized ? 'Slug đã được tùy chỉnh' : 'Slug được tạo tự động từ tên danh mục'}
              </p>
            </div>
            
            <div>
              <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục cha
              </label>
              <select
                id="parent_id"
                name="parent_id"
                value={formData.parent_id}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Không có (danh mục gốc)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập mô tả ngắn về danh mục"
              />
            </div>
          </div>
          
          {/* Phần thông số kỹ thuật */}
          {isRootCategory ? (
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => setShowSpecifications(!showSpecifications)}
                  className="flex items-center text-lg font-medium text-gray-800"
                >
                  Thông số kỹ thuật
                  {showSpecifications ? <ChevronUp size={20} className="ml-2" /> : <ChevronDown size={20} className="ml-2" />}
                </button>
                
                <button
                  type="button"
                  onClick={addSpecificationField}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded flex items-center text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Thêm thông số
                </button>
              </div>
              
              {showSpecifications && (
                <div className="space-y-4">
                  {formData.specificationFields.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>Chưa có thông số kỹ thuật nào. Nhấn "Thêm thông số" để bắt đầu.</p>
                    </div>
                  ) : (
                    formData.specificationFields.map((field, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4 relative">
                        <button
                          type="button"
                          onClick={() => removeSpecificationField(index)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Key <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => handleSpecificationFieldChange(index, 'key', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="ram, cpu, gpu"
                              required
                            />
                            <p className="mt-1 text-xs text-gray-500">Định danh duy nhất cho thông số</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên tiếng Việt <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={field.labelVi}
                              onChange={(e) => handleSpecificationFieldChange(index, 'labelVi', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Bộ nhớ RAM, CPU, Card đồ họa"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên tiếng Anh <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={field.labelEn}
                              onChange={(e) => handleSpecificationFieldChange(index, 'labelEn', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="RAM, CPU, GPU"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kiểu dữ liệu <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => handleSpecificationFieldChange(index, 'type', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              {fieldTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-end space-x-2">
                            <button
                              type="button"
                              onClick={() => moveSpecificationField(index, 'up')}
                              disabled={index === 0}
                              className={`p-2 rounded border ${index === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                              title="Di chuyển lên"
                            >
                              <ChevronUp size={16} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => moveSpecificationField(index, 'down')}
                              disabled={index === formData.specificationFields.length - 1}
                              className={`p-2 rounded border ${index === formData.specificationFields.length - 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                              title="Di chuyển xuống"
                            >
                              <ChevronDown size={16} />
                            </button>
                            
                            <span className="ml-2 text-sm text-gray-500">
                              Thứ tự: {field.sortOrder}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={addSpecificationField}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md inline-flex items-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Thêm thông số kỹ thuật
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle size={20} className="text-amber-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Không thể chỉnh sửa thông số kỹ thuật</h3>
                  <p className="text-amber-700 mt-1">
                    Đây là danh mục con nên không thể quản lý thông số kỹ thuật trực tiếp. 
                    Thông số kỹ thuật được kế thừa từ danh mục gốc.
                  </p>
                  {rootCategory && (
                    <button
                      type="button"
                      onClick={() => navigate(`/categories/edit/${rootCategory.id}`)}
                      className="mt-2 text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-md text-sm font-medium"
                    >
                      Quản lý thông số tại danh mục gốc "{rootCategory.name}"
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default CategoryEditPage; 