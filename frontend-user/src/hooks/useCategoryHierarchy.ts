import { useState, useEffect } from 'react';
import { getCategoryHierarchy } from '@/services/categoriesApi';
import type { CategoryWithAncestors } from '@/services/categoriesApi';

export function useCategoryHierarchy(categoryId: number | undefined) {
  const [hierarchy, setHierarchy] = useState<CategoryWithAncestors | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHierarchy = async () => {
      if (!categoryId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getCategoryHierarchy(categoryId);
        setHierarchy(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch category hierarchy'));
        console.error('Error fetching category hierarchy:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchy();
  }, [categoryId]);

  return { hierarchy, isLoading, error };
}