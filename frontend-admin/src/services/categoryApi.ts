import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS } from '../config/api';
import { handleApiError } from '../utils/errorHandler';

export interface SpecificationField {
  key: string;
  labelVi: string;
  labelEn: string;
  type: string;
  sortOrder: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
  specificationFields?: SpecificationField[];
}

// Hàm helper để tạo request với token
const createRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin-token');
  const headers = new Headers({
    ...DEFAULT_HEADERS,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin-user');
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Lấy tất cả danh mục
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await createRequest(ENDPOINTS.CATEGORIES);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết danh mục theo ID
 */
export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    return await createRequest(`${ENDPOINTS.CATEGORIES}/${id}`);
  } catch (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh mục theo slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  try {
    return await createRequest(`${ENDPOINTS.CATEGORIES}/slug/${slug}`);
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Lấy danh mục gốc của một danh mục (đi ngược lên cây phân cấp cho đến khi tìm thấy danh mục không có parent)
 */
export const getRootCategory = async (categoryId: number): Promise<Category> => {
  try {
    return await createRequest(`${ENDPOINTS.CATEGORIES}/${categoryId}/root`);
  } catch (error) {
    console.error(`Error fetching root category for category id ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Lấy tất cả danh mục con trực tiếp của một danh mục
 */
export const getSubcategories = async (parentId: number): Promise<Category[]> => {
  try {
    return await createRequest(`${ENDPOINTS.CATEGORIES}/parent/${parentId}`);
  } catch (error) {
    console.error(`Error fetching subcategories for parent id ${parentId}:`, error);
    throw error;
  }
};

/**
 * Tạo danh mục mới
 */
export const createCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  try {
    return await createRequest(ENDPOINTS.CATEGORIES, {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Cập nhật danh mục
 */
export const updateCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  try {
    // Log để debug
    console.log("Gửi request cập nhật danh mục:", JSON.stringify(categoryData, null, 2));
    
    const result = await createRequest(`${ENDPOINTS.CATEGORIES}/${categoryData.id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    
    console.log("Kết quả trả về từ API:", JSON.stringify(result, null, 2));
    
    // Đảm bảo giữ nguyên giá trị imageUrl nếu API trả về null
    if (categoryData.image_url && !result.image_url) {
      result.image_url = categoryData.image_url;
    }
    
    return result;
  } catch (error) {
    console.error(`Error updating category with id ${categoryData.id}:`, error);
    throw error;
  }
};

/**
 * Xóa danh mục
 */
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    await createRequest(`${ENDPOINTS.CATEGORIES}/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting category with id ${id}:`, error);
    throw error;
  }
}; 