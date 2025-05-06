import { useState, useEffect } from 'react';
import { getBrands } from '@/services/brandsApi';
import type { Brand } from '@/types/brand';

interface UseBrandsReturn {
  brands: Brand[];
  isLoading: boolean;
  error: Error | null;
}

export const useBrands = (): UseBrandsReturn => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);
        const data = await getBrands();
        setBrands(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch brands'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return { brands, isLoading, error };
};