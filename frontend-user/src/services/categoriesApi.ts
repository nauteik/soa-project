import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS } from '../config/api';
import { Category } from '../types/product';

/**
 * Fetch all categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Thử đọc body dưới dạng text trước để debug
    const text = await response.text();
    console.log('Response body (text):', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    // Parse JSON từ text
    try {
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    throw error;
  }
};

/**
 * Fetch a category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/slug/${slug}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category with slug ${slug}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch subcategories for a given parent category ID
 */
export const getSubcategories = async (parentId: number): Promise<Category[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/subcategories/${parentId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subcategories: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Interface cho kết quả phân cấp danh mục
 */
export interface CategoryWithAncestors {
  category: Category;
  ancestors: Category[];
}

/**
 * Lấy phân cấp danh mục (danh mục hiện tại và các danh mục tổ tiên)
 * @param categoryId - ID của danh mục cần lấy phân cấp
 * @returns Danh mục hiện tại và danh sách các danh mục tổ tiên
 */
export const getCategoryHierarchy = async (categoryId: number): Promise<CategoryWithAncestors> => {
  try {
    // Gọi API để lấy phân cấp danh mục
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CATEGORIES}/${categoryId}/hierarchy`, {
      headers: DEFAULT_HEADERS
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category hierarchy: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);

    // Fallback: Nếu API không hỗ trợ, tự tính toán phân cấp từ danh mục hiện tại và tất cả các danh mục
    const category = await fetchCategoryById(categoryId);
    const ancestors: Category[] = [];
    
    // Nếu danh mục có parent_id, thử lấy thông tin danh mục cha
    let currentParentId = category.parent_id;
    
    // Chúng ta chỉ thử lấy tối đa 5 cấp để tránh vòng lặp vô hạn
    const MAX_LEVELS = 5;
    let level = 0;
    
    while (currentParentId && level < MAX_LEVELS) {
      try {
        const parentCategory = await fetchCategoryById(currentParentId);
        ancestors.unshift(parentCategory); // Thêm vào đầu mảng để đảm bảo thứ tự từ cao đến thấp
        currentParentId = parentCategory.parent_id;
        level++;
      } catch (err) {
        console.error('Error fetching parent category:', err);
        break; // Thoát khỏi vòng lặp nếu có lỗi
      }
    }

    return {
      category,
      ancestors
    };
  }
};

/**
 * Lấy thông tin chi tiết của một danh mục theo ID
 * @param categoryId - ID của danh mục
 * @returns Thông tin chi tiết của danh mục
 * @private Hàm phụ trợ nội bộ
 */
const fetchCategoryById = async (categoryId: number): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CATEGORIES}/${categoryId}`, {
    headers: DEFAULT_HEADERS
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.status}`);
  }
  
  return await response.json();
};