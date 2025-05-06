import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS } from '../config/api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  specification_fields?: any[];
}

/**
 * Lấy tất cả danh mục
 */
export const getAllCategories = async (): Promise<Category[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách danh mục: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Lấy thông tin chi tiết danh mục theo ID
 */
export const getCategoryById = async (id: number): Promise<Category> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/${id}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin danh mục ID ${id}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Lấy danh mục theo slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/slug/${slug}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin danh mục với slug ${slug}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Lấy các danh mục con của một danh mục
 */
export const getSubcategories = async (parentId: number): Promise<Category[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/subcategories/${parentId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách danh mục con: ${response.statusText}`);
  }
  
  return response.json();
}; 