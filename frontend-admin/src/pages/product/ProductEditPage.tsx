import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, UploadCloud, ChevronDown, Check } from 'lucide-react';
import { getProductById, updateProduct, getSpecificationFields, getSpecificationValues, ProductDetail, ProductImage as APIProductImage } from '../../services/productApi';
import { getAllCategories } from '../../services/categoryApi';
import { getAllBrands, getBrandsByCategoryId } from '../../services/brandApi';
import { Category } from '../../services/categoryApi';
import { Brand } from '../../services/brandApi';
import { SpecificationField } from '../../services/productApi';
import { formatVND, formatDiscountedPrice } from '../../utils/formatters';
import { toast } from 'sonner';
import { IMAGES_BASE_URL } from '../../config/api';

interface ProductFormData {
  name: string;
  sku: string;
  slug: string;
  description: string;
  price: string;
  discount: string;
  quantityInStock: string;
  category_id: string;
  brand_id: string;
  isActive: boolean;
  isFeatured: boolean;
  specifications: Record<string, any>;
}

// Định nghĩa interface cho image preview
interface ImagePreview {
  id?: number;
  file?: File;
  url: string;
  isMain: boolean;
  altText: string;
  isExisting: boolean;
}

const ProductEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [specFields, setSpecFields] = useState<SpecificationField[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingSpecFields, setIsLoadingSpecFields] = useState(false);
  const [imagesPreviews, setImagesPreviews] = useState<ImagePreview[]>([]);
  
  // Thêm state mới để lưu các giá trị thông số có sẵn
  const [availableSpecValues, setAvailableSpecValues] = useState<Record<string, string[]>>({});
  
  // Thêm state để quản lý dropdown của list values
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [listInputs, setListInputs] = useState<Record<string, string>>({});

  // State để lưu ID ảnh bị xóa
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  // Form data
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    slug: '',
    description: '',
    price: '',
    discount: '0',
    quantityInStock: '',
    category_id: '',
    brand_id: '',
    isActive: true,
    isFeatured: false,
    specifications: {}
  });

  // Dữ liệu ban đầu để so sánh khi có thay đổi
  const [initialData, setInitialData] = useState<ProductDetail | null>(null);

  // Preview hình ảnh
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const product = await getProductById(Number(id));
        
        // Cập nhật form data với thông tin sản phẩm
        setFormData({
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          description: product.description || '',
          price: product.price.toString(),
          discount: product.discount.toString(),
          quantityInStock: product.quantityInStock.toString(),
          category_id: product.category.id.toString(),
          brand_id: product.brand.id.toString(),
          isActive: product.isActive,
          isFeatured: product.isFeatured || false,
          specifications: product.specifications || {}
        });
        
        // Xử lý hình ảnh sản phẩm
        if (product.images && product.images.length > 0) {
          const imageList: ImagePreview[] = product.images.map(img => ({
            id: img.id,
            url: `${IMAGES_BASE_URL}${img.image_url}`,
            isMain: img.is_main,
            altText: img.alt_text || product.name,
            isExisting: true
          }));
          setImagesPreviews(imageList);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', error);
        toast.error('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
        navigate('/products');
      }
    };

    fetchProductData();
  }, [id, navigate]);

  // Load brands when category changes
  useEffect(() => {
    if (!formData.category_id) {
      setBrands([]);
      return;
    }

    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      try {
        const data = await getBrandsByCategoryId(Number(formData.category_id));
        setBrands(data);
        
        // Nếu không có thương hiệu nào theo danh mục, lấy tất cả thương hiệu
        if (data.length === 0) {
          const allBrands = await getAllBrands();
          setBrands(allBrands);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thương hiệu:', error);
        
        // Fallback: lấy tất cả thương hiệu
        try {
          const allBrands = await getAllBrands();
          setBrands(allBrands);
        } catch (fallbackError) {
          console.error('Lỗi khi lấy tất cả thương hiệu:', fallbackError);
        }
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, [formData.category_id]);

  // Lấy specification fields khi category thay đổi
  useEffect(() => {
    if (!formData.category_id) {
      setSpecFields([]);
      setAvailableSpecValues({});
      return;
    }

    const fetchSpecFields = async () => {
      setIsLoadingSpecFields(true);
      try {
        // Lấy cấu trúc thông số kỹ thuật
        const data = await getSpecificationFields(Number(formData.category_id));
        if (data && data.specificationFields) {
          // Sắp xếp theo sortOrder
          const sortedFields = [...data.specificationFields].sort((a, b) => a.sortOrder - b.sortOrder);
          setSpecFields(sortedFields);
          
          // Khởi tạo specifications với giá trị mặc định theo kiểu nếu chưa có
          const initialSpecs = { ...formData.specifications };
          const initialDropdowns: Record<string, boolean> = {};
          const initialListInputs: Record<string, string> = {};
          
          sortedFields.forEach(field => {
            // Chỉ khởi tạo giá trị mặc định nếu không có sẵn trong formData
            if (initialSpecs[field.key] === undefined) {
              if (field.type === 'boolean') {
                initialSpecs[field.key] = false;
              } else if (field.type === 'number') {
                initialSpecs[field.key] = '';
              } else if (field.type === 'list') {
                initialSpecs[field.key] = [];
              } else {
                initialSpecs[field.key] = '';
              }
            }
            
            // Khởi tạo dropdown và list input states
            if (field.type === 'list') {
              initialDropdowns[field.key] = false;
              initialListInputs[field.key] = '';
            }
          });
          
          setFormData(prev => ({ ...prev, specifications: initialSpecs }));
          setOpenDropdowns(initialDropdowns);
          setListInputs(initialListInputs);
          
          // Lấy các giá trị thông số có sẵn
          try {
            const values = await getSpecificationValues(Number(formData.category_id));
            setAvailableSpecValues(values);
          } catch (error) {
            console.error('Lỗi khi lấy giá trị thông số kỹ thuật:', error);
            setAvailableSpecValues({});
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông số kỹ thuật cho danh mục:', error);
      } finally {
        setIsLoadingSpecFields(false);
      }
    };

    fetchSpecFields();
  }, [formData.category_id]);

  // Xử lý khi name thay đổi để tự động cập nhật slug nếu slug chưa được chỉnh sửa thủ công
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/--+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
        .trim(); // Loại bỏ khoảng trắng thừa
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name]);

  // Xử lý thay đổi input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Xử lý đặc biệt cho slug để đảm bảo đúng định dạng
    if (name === 'slug') {
      const formattedSlug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/--+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
        .trim(); // Loại bỏ khoảng trắng thừa
      
      setFormData(prev => ({ ...prev, [name]: formattedSlug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Xử lý thay đổi checkbox
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Xử lý thay đổi giá với định dạng VND
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Loại bỏ tất cả các ký tự không phải số
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    
    if (rawValue === '' || !isNaN(Number(rawValue))) {
      setFormData(prev => ({ ...prev, price: rawValue }));
    }
  };

  // Cập nhật hàm handleSpecificationChange để xử lý nhiều loại dữ liệu
  const handleSpecificationChange = (key: string, value: any, type?: string) => {
    let processedValue = value;
    
    // Xử lý giá trị theo kiểu dữ liệu
    if (type === 'number' && value !== '') {
      processedValue = Number(value);
    } else if (type === 'boolean') {
      processedValue = value === true || value === 'true';
    }
    
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: processedValue
      }
    }));
  };
  
  // Xử lý trường hợp list - thêm giá trị mới vào list
  const handleAddListItem = (key: string) => {
    const value = listInputs[key].trim();
    if (!value) return;
    
    const currentList = Array.isArray(formData.specifications[key]) 
      ? [...formData.specifications[key]] 
      : [];
    
    // Chỉ thêm nếu giá trị chưa tồn tại
    if (!currentList.includes(value)) {
      const newList = [...currentList, value];
      handleSpecificationChange(key, newList);
    }
    
    // Xóa giá trị nhập sau khi thêm
    setListInputs(prev => ({ ...prev, [key]: '' }));
  };
  
  // Xử lý trường hợp list - xóa một giá trị khỏi list
  const handleRemoveListItem = (key: string, index: number) => {
    const currentList = [...formData.specifications[key]];
    currentList.splice(index, 1);
    handleSpecificationChange(key, currentList);
  };
  
  // Xử lý dropdown list
  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Xử lý chọn từ dropdown
  const handleSelectSuggestion = (key: string, value: string) => {
    setListInputs(prev => ({ ...prev, [key]: value }));
    setOpenDropdowns(prev => ({ ...prev, [key]: false }));
  };
  
  // Xử lý upload ảnh
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Tạo previews cho mỗi file
      const newPreviews: ImagePreview[] = newFiles.map(file => {
        return {
          file,
          url: URL.createObjectURL(file),
          isMain: imagesPreviews.length === 0, // Nếu là ảnh đầu tiên và không có ảnh nào, đặt là ảnh chính
          altText: '',
          isExisting: false
        };
      });
      
      setImagesPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Đặt ảnh làm ảnh chính
  const setMainImage = (index: number) => {
    setImagesPreviews(prev => 
      prev.map((preview, idx) => ({
        ...preview,
        isMain: idx === index
      }))
    );
  };

  // Xóa một ảnh
  const removeImage = (index: number) => {
    const imageToRemove = imagesPreviews[index];
    
    // Nếu là ảnh đã tồn tại trên server, thêm vào danh sách cần xóa
    if (imageToRemove.isExisting && imageToRemove.id) {
      setDeletedImageIds(prev => [...prev, imageToRemove.id!]);
    }
    
    setImagesPreviews(prev => {
      const newPreviews = prev.filter((_, idx) => idx !== index);
      
      // Nếu xóa ảnh chính và còn ảnh khác, đặt ảnh đầu tiên làm ảnh chính
      if (imageToRemove.isMain && newPreviews.length > 0) {
        newPreviews[0].isMain = true;
      }
      
      return newPreviews;
    });
  };

  // Xử lý thay đổi alt text cho ảnh
  const handleAltTextChange = (index: number, value: string) => {
    setImagesPreviews(prev => 
      prev.map((preview, idx) => 
        idx === index 
          ? { ...preview, altText: value } 
          : preview
      )
    );
  };

  // Rendering phần thông số kỹ thuật
  const renderSpecificationField = (field: SpecificationField) => {
    const { key, labelVi, type } = field;
    const availableValues = availableSpecValues[key] || [];
    
    // Xử lý hiển thị cho từng loại dữ liệu
    switch (type) {
      case 'boolean':
        return (
          <div key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`spec-${key}`}
              checked={!!formData.specifications[key]}
              onChange={(e) => handleSpecificationChange(key, e.target.checked, 'boolean')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={`spec-${key}`} className="text-sm font-medium text-gray-700">
              {labelVi}
            </label>
          </div>
        );
        
      case 'number':
        return (
          <div key={key} className="space-y-1">
            <label htmlFor={`spec-${key}`} className="block text-sm font-medium text-gray-700">
              {labelVi}
            </label>
            <input
              type="number"
              id={`spec-${key}`}
              value={formData.specifications[key] || ''}
              onChange={(e) => handleSpecificationChange(key, e.target.value, 'number')}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {availableValues.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">Giá trị đã có:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableValues.map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSpecificationChange(key, val, 'number')}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'list':
        return (
          <div key={key} className="space-y-2">
            <label htmlFor={`spec-${key}`} className="block text-sm font-medium text-gray-700">
              {labelVi}
            </label>
            <div className="relative mt-1">
              <div className="flex">
                <input
                  type="text"
                  id={`spec-${key}`}
                  value={listInputs[key] || ''}
                  onChange={(e) => setListInputs(prev => ({ ...prev, [key]: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Thêm ${labelVi.toLowerCase()}`}
                />
                <button
                  type="button"
                  onClick={() => handleAddListItem(key)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <Plus size={16} />
                </button>
              </div>
              {availableValues.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleDropdown(key)}
                    className="absolute inset-y-0 right-10 flex items-center pr-2"
                  >
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                  {openDropdowns[key] && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto">
                      {availableValues.map((value, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(key, value)}
                          className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {value}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {Array.isArray(formData.specifications[key]) && formData.specifications[key].length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specifications[key].map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                    <span className="text-sm text-blue-800">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveListItem(key, idx)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      default: // string
        return (
          <div key={key} className="space-y-1">
            <label htmlFor={`spec-${key}`} className="block text-sm font-medium text-gray-700">
              {labelVi}
            </label>
            <input
              type="text"
              id={`spec-${key}`}
              value={formData.specifications[key] || ''}
              onChange={(e) => handleSpecificationChange(key, e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {availableValues.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">Giá trị đã có:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableValues.map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSpecificationChange(key, val)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Tên sản phẩm không được để trống');
    if (!formData.sku.trim()) errors.push('Mã SKU không được để trống');
    if (!formData.slug.trim()) errors.push('Slug không được để trống');
    if (!formData.price) errors.push('Giá sản phẩm không được để trống');
    if (!formData.category_id) errors.push('Vui lòng chọn danh mục');
    if (!formData.brand_id) errors.push('Vui lòng chọn thương hiệu');
    if (imagesPreviews.length === 0) errors.push('Vui lòng thêm ít nhất một hình ảnh');
    
    // Validate slug format
    if (formData.slug.trim() && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.push('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
    }
    
    if (errors.length > 0) {
      toast.error(
        <div>
          <p className="font-medium">Vui lòng kiểm tra lại:</p>
          <ul className="list-disc pl-4 mt-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm">{err}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Tạo FormData để gửi cả file và dữ liệu
      const productData = new FormData();
      
      // Thêm các trường cơ bản
      productData.append('name', formData.name);
      productData.append('sku', formData.sku);
      productData.append('slug', formData.slug);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('discount', formData.discount);
      productData.append('quantityInStock', formData.quantityInStock);
      productData.append('category_id', formData.category_id);
      productData.append('brand_id', formData.brand_id);
      productData.append('isActive', String(formData.isActive));
      productData.append('isFeatured', String(formData.isFeatured));
      
      // Xử lý và thêm thông số kỹ thuật
      const cleanedSpecs = { ...formData.specifications };
      specFields.forEach(field => {
        const value = cleanedSpecs[field.key];
        
        // Xử lý trường hợp danh sách rỗng
        if (field.type === 'list' && Array.isArray(value) && value.length === 0) {
          delete cleanedSpecs[field.key];
        }
        // Xử lý trường hợp chuỗi rỗng
        else if ((field.type === 'string' || field.type === 'number') && (value === '' || value === null || value === undefined)) {
          delete cleanedSpecs[field.key];
        }
      });
      
      productData.append('specifications', JSON.stringify(cleanedSpecs));
      
      // Đánh dấu các ảnh cần xóa
      if (deletedImageIds.length > 0) {
        productData.append('deleted_image_ids', JSON.stringify(deletedImageIds));
      }
      
      // Xử lý hình ảnh hiện có và hình ảnh mới
      const existingImages: Array<{id: number, isMain: boolean, altText: string}> = [];
      const newImages: ImagePreview[] = [];
      
      imagesPreviews.forEach(preview => {
        if (preview.isExisting && preview.id) {
          existingImages.push({
            id: preview.id,
            isMain: preview.isMain,
            altText: preview.altText
          });
        } else if (preview.file) {
          newImages.push(preview);
        }
      });
      
      // Thêm thông tin ảnh hiện có cần cập nhật
      if (existingImages.length > 0) {
        productData.append('existing_images', JSON.stringify(existingImages));
      }
      
      // Thêm ảnh mới
      newImages.forEach((preview, index) => {
        if (preview.file) {
          productData.append(`new_images`, preview.file);
          productData.append(`image_alt_texts`, preview.altText || formData.name);
          productData.append(`image_is_main`, String(preview.isMain));
          productData.append(`image_sort_orders`, String(index));
        }
      });
      
      // Gọi API để cập nhật sản phẩm
      const response = await updateProduct(Number(id), productData);
      
      // Hiển thị thông báo thành công
      toast.success('Sản phẩm đã được cập nhật thành công!');
      
      // Không chuyển hướng về trang danh sách sản phẩm
      // navigate('/products');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      
      // Xử lý các loại lỗi cụ thể
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm. Vui lòng thử lại sau.';
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/products')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Cập nhật thông tin sản phẩm</h1>
            <p className="text-gray-600">ID: {id}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột 1: Thông tin cơ bản */}
            <div className="space-y-6 lg:col-span-1">
              <div>
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Thông tin cơ bản</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Trạng thái bán hàng
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-700">
                        {formData.isActive ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.isActive 
                      ? 'Sản phẩm đang được bán trên hệ thống' 
                      : 'Sản phẩm ngừng bán sẽ không hiển thị cho khách hàng'}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="featured" className="block text-sm font-medium text-gray-700">
                    Sản phẩm nổi bật
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-700">
                        {formData.isFeatured ? 'Nổi bật' : 'Bình thường'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.isFeatured 
                      ? 'Sản phẩm sẽ được hiển thị trong mục sản phẩm nổi bật' 
                      : 'Sản phẩm sẽ được hiển thị thông thường'}
                  </p>
                </div>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  Mã SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  required
                  value={formData.sku}
                  onChange={(e) => {
                    // Loại bỏ khoảng cách và chuyển thành chữ hoa
                    const value = e.target.value.replace(/\s+/g, '').toUpperCase();
                    setFormData(prev => ({ ...prev, sku: value }));
                  }}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    // Áp dụng cùng logic như trong generatedSlug
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
                      .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
                      .replace(/--+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
                      .trim(); // Loại bỏ khoảng trắng thừa
                    setFormData(prev => ({ ...prev, slug: value }));
                  }}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleInputChange}
                  disabled={isLoadingCategories}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {isLoadingCategories && (
                  <p className="mt-1 text-sm text-gray-500">Đang tải danh mục...</p>
                )}
              </div>

              <div>
                <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Thương hiệu <span className="text-red-500">*</span>
                </label>
                <select
                  id="brand_id"
                  name="brand_id"
                  required
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  disabled={isLoadingBrands || !formData.category_id}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {isLoadingBrands && (
                  <p className="mt-1 text-sm text-gray-500">Đang tải thương hiệu...</p>
                )}
                {!formData.category_id && (
                  <p className="mt-1 text-sm text-gray-500">Vui lòng chọn danh mục trước</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="hidden"
                      id="price"
                      name="price"
                      value={formData.price}
                    />
                    <input
                      type="text"
                      id="priceDisplay"
                      value={formData.price ? formatVND(Number(formData.price), false) : ''}
                      onChange={handlePriceChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập giá sản phẩm"
                      required
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">đ</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                    Giảm giá (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              {/* Tổng quan về giá sản phẩm */}
              {formData.price && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tổng quan giá sản phẩm</h3>
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Giá gốc:</span>
                      <span className="text-sm font-medium">{formatVND(Number(formData.price))}</span>
                    </div>
                    {Number(formData.discount) > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Giảm giá:</span>
                          <span className="text-sm font-medium text-red-500">-{formData.discount}% ({formatVND(Number(formData.price) * Number(formData.discount) / 100)})</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                          <span className="text-sm font-medium text-gray-700">Giá bán:</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatDiscountedPrice(Number(formData.price), Number(formData.discount)).discounted}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="quantityInStock" className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantityInStock"
                  name="quantityInStock"
                  required
                  min="0"
                  value={formData.quantityInStock}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Cột 2: Hình ảnh & mô tả */}
            <div className="space-y-6 lg:col-span-1">
              <div>
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Hình ảnh & Mô tả</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Kéo thả hoặc{' '}
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>tải lên hình ảnh</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF lên đến 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {imagesPreviews.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Hình ảnh đã tải lên:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {imagesPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className={`border rounded-md p-2 ${
                          preview.isMain ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={preview.url}
                            alt={`Preview ${index}`}
                            className="h-28 w-full object-cover rounded-md"
                          />
                          <div className="absolute top-1 right-1 flex space-x-1">
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="bg-red-100 p-1 rounded-full text-red-600 hover:text-red-700 focus:outline-none"
                            >
                              <X size={14} />
                            </button>
                            {!preview.isMain && (
                              <button
                                type="button"
                                onClick={() => setMainImage(index)}
                                className="bg-blue-100 p-1 rounded-full text-blue-600 hover:text-blue-700 focus:outline-none"
                                title="Đặt làm ảnh chính"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Mô tả ảnh"
                            value={preview.altText}
                            onChange={(e) => handleAltTextChange(index, e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-md p-1"
                          />
                          {preview.isMain && (
                            <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              Ảnh chính
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>

            {/* Cột 3: Thông số kỹ thuật */}
            <div className="space-y-2 lg:col-span-1 flex flex-col h-full">
              <div>
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Thông số kỹ thuật</h2>
              </div>
              
              {isLoadingSpecFields ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : !formData.category_id ? (
                <p className="text-sm text-gray-500">Vui lòng chọn danh mục để thêm thông số kỹ thuật</p>
              ) : specFields.length === 0 ? (
                <p className="text-sm text-gray-500">Danh mục này không có thông số kỹ thuật nào</p>
              ) : (
                <div className="overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  <div className="space-y-6">
                    {/* Các trường boolean hiển thị dạng switch/checkbox */}
                    {specFields.filter(field => field.type === 'boolean').length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1 bg-white">Các tùy chọn</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {specFields
                            .filter(field => field.type === 'boolean')
                            .map(field => renderSpecificationField(field))}
                        </div>
                      </div>
                    )}
                    
                    {/* Các trường number hiển thị dạng input số */}
                    {specFields.filter(field => field.type === 'number').length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1 bg-white">Thông số kỹ thuật số</h3>
                        <div className="space-y-3">
                          {specFields
                            .filter(field => field.type === 'number')
                            .map(field => renderSpecificationField(field))}
                        </div>
                      </div>
                    )}
                    
                    {/* Các trường string hiển thị dạng input text */}
                    {specFields.filter(field => field.type === 'string').length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1 bg-white">Thông tin chung</h3>
                        <div className="space-y-3">
                          {specFields
                            .filter(field => field.type === 'string')
                            .map(field => renderSpecificationField(field))}
                        </div>
                      </div>
                    )}
                    
                    {/* Các trường list hiển thị dạng multi-select */}
                    {specFields.filter(field => field.type === 'list').length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1 bg-white">Danh sách tính năng</h3>
                        <div className="space-y-4">
                          {specFields
                            .filter(field => field.type === 'list')
                            .map(field => renderSpecificationField(field))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-1.5" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ProductEditPage; 