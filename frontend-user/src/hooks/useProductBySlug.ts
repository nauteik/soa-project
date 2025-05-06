import { useState, useEffect } from 'react';
import { getProductBySlug } from '@/services/productsApi';
import type { Product } from '@/types/product';

export function useProductBySlug(slug: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return { product, isLoading, error };
}