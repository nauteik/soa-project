import { API_BASE_URL, ENDPOINTS, DEFAULT_HEADERS } from '../config/api';
import { Product, ProductsResponse } from '../types/product';

// Export the interface so it can be imported elsewhere
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
}

// Interface for products by category slug
export interface GetProductsByCategorySlugParams {
  categorySlug: string;
  skip?: number;
  limit?: number;
  brand_id?: number | number[];
  min_price?: number;
  max_price?: number;
  specifications?: Record<string, string[]>;
  sort?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

/**
 * Interface for category specification fields
 */
export interface SpecificationField {
  key: string;
  labelVi: string;
  labelEn: string;
  type: string;
  sortOrder: number;
}

/**
 * Fetch products with optional filtering and pagination
 */
export const getProducts = async (params: GetProductsParams = {}): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  // Add any provided parameters to the query string
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.category_id !== undefined) queryParams.append('category_id', params.category_id.toString());
  
  // Handle brand_id as single value or array
  if (params.brand_id !== undefined) {
    if (Array.isArray(params.brand_id)) {
      // Append each brand ID separately for multiple selection
      params.brand_id.forEach(id => 
        queryParams.append('brand_id', id.toString())
      );
    } else {
      queryParams.append('brand_id', params.brand_id.toString());
    }
  }
  
  // Price range filters
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  
  // Other basic filters
  if (params.search !== undefined) queryParams.append('search', params.search);
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
  if (params.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
  
  // Handle specifications filter - this needs to be converted to JSON
  if (params.specifications && Object.keys(params.specifications).length > 0) {
    // Lọc những key có mảng rỗng
    const filteredSpecs = Object.fromEntries(
      Object.entries(params.specifications)
        .filter(([_, values]) => values.length > 0)
    );
    
    // Chỉ gửi nếu còn thông số nào sau khi lọc
    if (Object.keys(filteredSpecs).length > 0) {
      const specsJson = JSON.stringify(filteredSpecs);
      console.log('Sending specifications to API:', filteredSpecs);
      console.log('JSON string:', specsJson);
      queryParams.append('specifications_json', specsJson);
    }
  }

  // Fixed endpoint to match the backend controller mapping
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch products by category slug with optional filtering and pagination
 */
export const getProductsByCategorySlug = async (params: GetProductsByCategorySlugParams): Promise<ProductsResponse> => {
  const { categorySlug, ...otherParams } = params;
  const queryParams = new URLSearchParams();
  
  // Add any provided parameters to the query string
  if (otherParams.skip !== undefined) queryParams.append('skip', otherParams.skip.toString());
  if (otherParams.limit !== undefined) queryParams.append('limit', otherParams.limit.toString());
  
  // Handle brand_id as single value or array
  if (otherParams.brand_id !== undefined) {
    if (Array.isArray(otherParams.brand_id)) {
      // Append each brand ID separately for multiple selection
      otherParams.brand_id.forEach(id => 
        queryParams.append('brand_id', id.toString())
      );
    } else {
      queryParams.append('brand_id', otherParams.brand_id.toString());
    }
  }
  
  // Price range filters
  if (otherParams.min_price !== undefined) queryParams.append('min_price', otherParams.min_price.toString());
  if (otherParams.max_price !== undefined) queryParams.append('max_price', otherParams.max_price.toString());
  
  // Sort option
  if (otherParams.sort !== undefined) queryParams.append('sort', otherParams.sort);
  
  // Other basic filters
  if (otherParams.is_active !== undefined) queryParams.append('is_active', otherParams.is_active.toString());
  if (otherParams.is_featured !== undefined) queryParams.append('is_featured', otherParams.is_featured.toString());
  
  // Handle specifications filter - this needs to be converted to JSON
  if (otherParams.specifications && Object.keys(otherParams.specifications).length > 0) {
    // Lọc những key có mảng rỗng
    const filteredSpecs = Object.fromEntries(
      Object.entries(otherParams.specifications)
        .filter(([_, values]) => values.length > 0)
    );
    
    // Chỉ gửi nếu còn thông số nào sau khi lọc
    if (Object.keys(filteredSpecs).length > 0) {
      const specsJson = JSON.stringify(filteredSpecs);
      console.log('Sending specifications to API:', filteredSpecs);
      console.log('JSON string:', specsJson);
      queryParams.append('specifications_json', specsJson);
    }
  }

  // Fixed endpoint to match the backend controller mapping
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/category/slug/${categorySlug}?${queryParams.toString()}`;
  console.log('URL:', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products for category slug ${categorySlug}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch a single product by ID
 */
export const getProductById = async (id: number): Promise<Product> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product with ID ${id}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch a single product by slug
 */
export const getProductBySlug = async (slug: string): Promise<Product> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/slug/${slug}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product with slug ${slug}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get available filters for a specific category
 * This will fetch specifications and other filter options available for products in this category
 */
export const getFiltersForCategory = async (categoryId: number): Promise<{specifications: Record<string, string[]>}> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/category/${categoryId}/specifications`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch filters for category ${categoryId}: ${response.statusText}`);
    }
  
    return response.json();
  } catch (error) {
    console.error('Error fetching category filters:', error);
    return { specifications: {} };
  }
};

/**
 * Fetch specifications for a category by slug
 */
export const getSpecificationsByCategorySlug = async (categorySlug: string): Promise<Record<string, string[]>> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCTS}/category/slug/${categorySlug}/specifications`;
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch specifications for category slug ${categorySlug}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch specification fields (keys and localized labels) for a category by slug
 */
export const fetchCategorySpecifications = async (categorySlug: string): Promise<SpecificationField[]> => {
  const url = `${API_BASE_URL}${ENDPOINTS.CATEGORIES}/slug/${categorySlug}/specifications`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch specification fields for category slug ${categorySlug}: ${response.statusText}`);
  }
  
  return response.json();
};