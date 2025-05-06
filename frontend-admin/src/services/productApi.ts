import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS, IMAGES_BASE_URL } from '../config/api';

// Định nghĩa các interfaces
export interface SpecificationField {
  key: string;
  labelVi: string;
  labelEn: string;
  type: string;
  sortOrder: number;
}

export interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_main: boolean;
  sortOrder: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  sku: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  quantityInStock: number;
  quantitySold: number;
  isActive: boolean;
  isFeatured: boolean;
  specifications: Record<string, any>;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  items: ProductDetail[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GetProductsParams {
  skip?: number;
  limit?: number;
  category_id?: number;
  brand_id?: number | number[];
  search?: string;
  is_active?: boolean;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  specifications?: Record<string, string[]>;
  sort?: string;
}

/**
 * Lấy tất cả sản phẩm với các tùy chọn lọc và phân trang
 */
export const getProducts = async (params: GetProductsParams = {}): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  // Thêm các tham số vào URL query
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.category_id !== undefined) queryParams.append('category_id', params.category_id.toString());
  
  // Xử lý brand_id có thể là số hoặc mảng
  if (params.brand_id !== undefined) {
    if (Array.isArray(params.brand_id)) {
      params.brand_id.forEach(id => 
        queryParams.append('brand_id', id.toString())
      );
    } else {
      queryParams.append('brand_id', params.brand_id.toString());
    }
  }
  
  // Bộ lọc giá
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  
  // Các bộ lọc khác
  if (params.search !== undefined) queryParams.append('search', params.search);
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
  if (params.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
  if (params.sort !== undefined) queryParams.append('sort', params.sort);
  
  // Xử lý bộ lọc thông số kỹ thuật
  if (params.specifications && Object.keys(params.specifications).length > 0) {
    const filteredSpecs = Object.fromEntries(
      Object.entries(params.specifications)
        .filter(([_, values]) => values.length > 0)
    );
    
    if (Object.keys(filteredSpecs).length > 0) {
      const specsJson = JSON.stringify(filteredSpecs);
      queryParams.append('specifications_json', specsJson);
    }
  }

  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách sản phẩm: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Lấy thông tin chi tiết sản phẩm theo ID
 */
export const getProductById = async (id: string | number): Promise<ProductDetail> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${id}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin sản phẩm ID ${id}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Xóa sản phẩm theo ID
 */
export const deleteProductById = async (id: string | number): Promise<void> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${id}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể xóa sản phẩm ID ${id}: ${response.statusText}`);
  }
};

/**
 * Lấy danh sách thông số kỹ thuật của danh mục
 */
export const getSpecificationFields = async (categoryId: number): Promise<{specificationFields: SpecificationField[]}> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/${categoryId}/specification-fields`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy thông số kỹ thuật cho danh mục ID ${categoryId}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Xử lý URL hình ảnh
 */
export const processImageUrl = (url: string): string => {
  if (!url) return 'https://via.placeholder.com/600';
  if (!url.startsWith('http')) return `${IMAGES_BASE_URL}${url}`;
  return url;
};

/**
 * Tạo mới sản phẩm
 */
export const createProduct = async (productData: FormData): Promise<ProductDetail> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: productData,
      // Lưu ý: không gửi Content-Type header khi sử dụng FormData
    });
    
    if (!response.ok) {
      // Nếu response không OK, thử đọc error data từ response
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || `Không thể tạo sản phẩm mới: ${response.statusText}`;
      
      // Xử lý các loại lỗi HTTP cụ thể
      if (response.status === 405) {
        throw new Error('Phương thức HTTP không được hỗ trợ. Vui lòng kiểm tra cấu hình API endpoint.');
      } else if (response.status === 409) {
        // 409 - Conflict, thường là lỗi trùng dữ liệu (SKU, slug...)
        throw new Error(errorMessage);
      } else if (response.status === 400) {
        // 400 - Bad Request
        errorMessage = errorData.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào.';
        throw new Error(errorMessage);
      } else if (response.status === 404) {
        // 404 - Not Found
        errorMessage = errorData.message || 'Không tìm thấy tài nguyên. Danh mục hoặc thương hiệu có thể không tồn tại.';
        throw new Error(errorMessage);
      } else if (response.status === 500) {
        // 500 - Internal Server Error
        // Nếu lỗi có chứa thông tin về lỗi trùng SKU, xử lý riêng
        if (errorMessage.includes('duplicate key value') && errorMessage.includes('sku')) {
          // Cố gắng tìm giá trị SKU từ thông báo lỗi
          const skuMatch = errorMessage.match(/\(sku\)=\(([^)]+)\)/);
          const skuValue = skuMatch ? skuMatch[1] : '';
          
          errorMessage = `Mã SKU '${skuValue}' đã tồn tại trong hệ thống. Vui lòng sử dụng mã SKU khác.`;
        } else {
          // Làm sạch thông báo lỗi từ server
          errorMessage = errorMessage.replace(/could not execute statement.*constraint \[.*\]$/s, 'Lỗi xử lý dữ liệu trên máy chủ.');
        }
        throw new Error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    throw error;
  }
};

/**
 * Cập nhật sản phẩm
 */
export const updateProduct = async (id: string | number, productData: FormData): Promise<ProductDetail> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/update/${id}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: productData,
    // Lưu ý: không gửi Content-Type header khi sử dụng FormData
  });
  
  if (!response.ok) {
    throw new Error(`Không thể cập nhật sản phẩm ID ${id}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Cập nhật trạng thái sản phẩm (kích hoạt/hủy kích hoạt)
 */
export const updateProductStatus = async (id: string | number, isActive: boolean): Promise<ProductDetail> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${id}/status`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive })
  });
  
  if (!response.ok) {
    throw new Error(`Không thể cập nhật trạng thái sản phẩm ID ${id}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Cập nhật trạng thái nổi bật của sản phẩm
 */
export const updateProductFeatured = async (id: string | number, isFeatured: boolean): Promise<ProductDetail> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${id}/featured`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isFeatured })
  });
  
  if (!response.ok) {
    throw new Error(`Không thể cập nhật trạng thái nổi bật của sản phẩm ID ${id}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Xóa hình ảnh sản phẩm
 */
export const deleteProductImage = async (productId: string | number, imageId: number): Promise<void> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${productId}/images/${imageId}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể xóa hình ảnh ID ${imageId} của sản phẩm ID ${productId}: ${response.statusText}`);
  }
};

/**
 * Đặt hình ảnh làm hình chính của sản phẩm
 */
export const setMainProductImage = async (productId: string | number, imageId: number): Promise<void> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${productId}/images/${imageId}/main`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể đặt hình ảnh ID ${imageId} làm hình chính cho sản phẩm ID ${productId}: ${response.statusText}`);
  }
};

/**
 * Lấy danh sách thông số kỹ thuật của danh mục theo slug
 */
export const getSpecificationsByCategorySlug = async (categorySlug: string): Promise<Record<string, string[]>> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/category/slug/${categorySlug}/specifications`;
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Không thể lấy thông số kỹ thuật cho danh mục ${categorySlug}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Lấy thông số kỹ thuật (specification fields) của danh mục theo slug
 */
export const fetchCategorySpecifications = async (categorySlug: string): Promise<SpecificationField[]> => {
  try {
    const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/slug/${categorySlug}/specification-fields`;
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`Không thể lấy thông số kỹ thuật cho danh mục ${categorySlug}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && data.specificationFields) {
      return data.specificationFields;
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy thông số kỹ thuật của danh mục:', error);
    return [];
  }
};

/**
 * Lấy tất cả sản phẩm không phân biệt trạng thái
 */
export const fetchAllProducts = async (): Promise<{items: ProductDetail[]}> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/all`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách tất cả sản phẩm: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Trích xuất danh mục và thương hiệu từ danh sách sản phẩm
 */
export const extractCategoriesAndBrands = (productsList: ProductDetail[]): {
  categories: Array<{id: number, name: string}>;
  brands: Array<{id: number, name: string}>;
} => {
  const uniqueCategories = new Map();
  const uniqueBrands = new Map();
  
  productsList.forEach(product => {
    if (product.category) {
      uniqueCategories.set(product.category.id, product.category);
    }
    if (product.brand) {
      uniqueBrands.set(product.brand.id, product.brand);
    }
  });
  
  return {
    categories: Array.from(uniqueCategories.values()),
    brands: Array.from(uniqueBrands.values())
  };
};

/**
 * Lấy danh sách các giá trị thông số kỹ thuật có sẵn trong danh mục
 */
export const getSpecificationValues = async (categoryId: number): Promise<Record<string, string[]>> => {
  try {
    // Đầu tiên cần lấy thông tin category bằng ID để có slug
    const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/${categoryId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`Không thể lấy thông tin danh mục ID ${categoryId}: ${response.statusText}`);
    }
    
    const category = await response.json();
    const categorySlug = category.slug;
    
    // Sau đó sử dụng slug để lấy các giá trị thông số
    return getSpecificationsByCategorySlug(categorySlug);
  } catch (error) {
    console.error('Lỗi khi lấy giá trị thông số kỹ thuật:', error);
    return {};
  }
};
