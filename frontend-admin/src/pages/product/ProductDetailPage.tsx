import { ArrowLeft, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getProductById, getSpecificationFields, processImageUrl } from '../../services/productApi';

import type { ProductDetail, SpecificationField } from '../../services/productApi';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [specFields, setSpecFields] = useState<SpecificationField[]>([]);
  const [isLoadingSpecFields, setIsLoadingSpecFields] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const data = await getProductById(id as string);
        setProduct(data);
        
        if (data.images && data.images.length > 0) {
          const mainImageIdx = data.images.findIndex((img: any) => img.is_main === true);
          setSelectedImageIdx(mainImageIdx >= 0 ? mainImageIdx : 0);
        }
        
        if (data.category?.id) {
          fetchSpecificationFields(data.category.id);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [id]);
  
  console.log("product", product)
  const fetchSpecificationFields = async (categoryId: number) => {
    setIsLoadingSpecFields(true);
    try {
      const data = await getSpecificationFields(categoryId);
      
      if (data && data.specificationFields) {
        setSpecFields(data.specificationFields);
        console.log("Đã nhận thông số kỹ thuật:", data.specificationFields);
      } else {
        console.log("Không tìm thấy thông số kỹ thuật trong response:", data);
        setSpecFields([]);
      }
    } catch (error) {
      console.error('Error fetching specification fields:', error);
      setSpecFields([]);
    } finally {
      setIsLoadingSpecFields(false);
    }
  };

  const handleEdit = () => {
    navigate(`/products/edit/${id}`);
  };

  // const handleDelete = () => {
  //   if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
  //     deleteProductById(id as string)
  //       .then(() => {
  //         console.log('Đã xóa sản phẩm thành công');
          
  //         navigate('/products');
  //       })
  //       .catch(error => {
  //         console.error('Lỗi khi xóa sản phẩm:', error);
  //         alert('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
  //       });
  //   }
  // };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(price)
      .replace(/\s/g, '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSpecificationLabel = (key: string): string => {
    const specField = specFields.find(field => field.key === key);
    return specField ? specField.labelVi : key;
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIdx(index);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-4">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button 
            onClick={() => navigate('/products')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Quay lại danh sách sản phẩm
          </button>
        </div>
      </div>
    );
  }

  const selectedImage = product.images && product.images.length > 0 
    ? product.images[selectedImageIdx] 
    : null;

  const selectedImageUrl = selectedImage 
    ? processImageUrl(selectedImage.image_url) 
    : 'https://via.placeholder.com/600';

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
            <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
            <p className="text-gray-600">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit size={16} className="mr-1.5" />
            Chỉnh sửa
          </button>
          {/* <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 size={16} className="mr-1.5" />
            Xóa
          </button> */}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="space-y-4">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
              {selectedImage && (
                <div className="aspect-w-4 aspect-h-3 flex items-center justify-center p-4">
                  <img
                    src={selectedImageUrl}
                    alt={selectedImage.alt_text || product.name}
                    className="max-w-full max-h-[400px] object-contain mx-auto"
                  />
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((image, index) => (
                    <div 
                      key={image.id}
                      onClick={() => handleSelectImage(index)}
                      className={`cursor-pointer border rounded-md overflow-hidden transition-all ${
                        index === selectedImageIdx 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-w-1 aspect-h-1">
                        <img
                          src={processImageUrl(image.image_url)}
                          alt={image.alt_text || `${product.name} - Ảnh ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin cơ bản</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Danh mục</p>
                <p className="mt-1">{product.category?.name || 'Không có'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Thương hiệu</p>
                <p className="mt-1">{product.brand?.name || 'Không có'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <p className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nổi bật</p>
                <p className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.isFeatured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isFeatured ? 'Có' : 'Không'}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Giá bán</p>
                <p className="mt-1 text-lg font-medium text-gray-900">{formatPrice(product.price)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Giảm giá</p>
                <p className="mt-1 text-lg font-medium text-red-600">
                  {product.discount > 0 ? `-${product.discount}%` : 'Không'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tồn kho</p>
                <p className="mt-1">{product.quantityInStock} sản phẩm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Đã bán</p>
                <p className="mt-1">{product.quantitySold} sản phẩm</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Slug URL</p>
              <p className="mt-1 text-sm text-gray-900">{product.slug}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Mô tả</p>
              <p className="mt-1 text-sm text-gray-900">{product.description || 'Không có mô tả'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thông số kỹ thuật</h2>
            </div>
            
            {isLoadingSpecFields ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : product.specifications && Object.keys(product.specifications).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2">
                    <p className="text-sm font-medium text-gray-500">{getSpecificationLabel(key)}</p>
                    <p className="text-sm">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không có thông số kỹ thuật</p>
            )}

            <div className="pt-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Thời gian</h2>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2">
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-sm">{formatDate(product.createdAt)}</p>
              </div>
              <div className="grid grid-cols-2">
                <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                <p className="text-sm">{formatDate(product.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage; 