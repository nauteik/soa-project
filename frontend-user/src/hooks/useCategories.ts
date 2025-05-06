import { useState, useEffect } from 'react';
import { getAllCategories, getCategoryBySlug } from '@/services/categoriesApi';
import type { Category } from '@/types/product';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getAllCategories();
        console.log('useCategories - Fetched categories:', data);
        setCategories(data || []);
      } catch (err) {
        console.error('useCategories - Error fetching categories:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        setCategories([]); // Set empty array on error to avoid null/undefined issues
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

export function useCategoryBySlug(slug: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`useCategoryBySlug - Fetching category with slug: ${slug}`);
        const data = await getCategoryBySlug(slug);
        console.log('useCategoryBySlug - Retrieved category:', data);
        setCategory(data);
      } catch (err) {
        console.error(`useCategoryBySlug - Error fetching category with slug ${slug}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to fetch category'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  return { category, isLoading, error };
}