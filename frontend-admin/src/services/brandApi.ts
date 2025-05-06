import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS } from '../config/api';

export interface Brand {
  id: number;
  name: string;
  logoUrl?: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Lấy tất cả thương hiệu
 */
export const getAllBrands = async (): Promise<Brand[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.BRANDS}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách thương hiệu: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Lấy thông tin chi tiết thương hiệu theo ID
 */
export const getBrandById = async (id: number): Promise<Brand> => {
  const url = `${API_BASE_URL}${ENDPOINTS.BRANDS}/${id}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin thương hiệu ID ${id}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Lấy thương hiệu theo slug
 */
export const getBrandBySlug = async (slug: string): Promise<Brand> => {
  const url = `${API_BASE_URL}${ENDPOINTS.BRANDS}/slug/${slug}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin thương hiệu với slug ${slug}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Lấy các thương hiệu theo danh mục
 */
export const getBrandsByCategoryId = async (categoryId: number): Promise<Brand[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.BRANDS}/category/${categoryId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách thương hiệu theo danh mục ID ${categoryId}: ${response.statusText}`);
  }
  
  return response.json();
}; 