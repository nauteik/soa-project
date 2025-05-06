import { useState, useEffect } from 'react';
import { getProducts } from '@/services/productsApi';
import type { Product } from '@/types/product';
import type { GetProductsParams } from '@/services/productsApi';

export function useProducts(params: GetProductsParams = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getProducts(params);
        setProducts(response.items || []);
        setTotalCount(response.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [
    params.category_id,
    params.brand_id,
    params.min_price,
    params.max_price,
    params.skip,
    params.limit,
    params.is_featured,
    // Convert specifications object to JSON string to track changes
    params.specifications ? JSON.stringify(params.specifications) : null
  ]);

  return { products, totalCount, isLoading, error };
}