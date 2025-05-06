export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
  slug?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface ProductImage {
  id: number;
  image_url: string;
  alt?: string;
  is_main: boolean;
  sort_order?: number;
  product_id?: number;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discount: number;
  quantityInStock: number;
  quantitySold?: number;
  sku?: string;
  specifications?: Record<string, any>;
  is_active?: boolean;
  category_id: number;
  brand_id: number;
  category?: Category;
  brand?: Brand;
  images: ProductImage[];
  created_at: string;
  updated_at?: string;
  discounted_price?: number;
}

export interface ProductFilter {
  category_id?: number;
  brand_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
  is_active?: boolean;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
}