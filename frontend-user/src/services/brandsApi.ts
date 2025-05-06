import { API_BASE_URL } from '@/config/api';
import type { Brand } from '@/types/brand';

const BRANDS_API = `${API_BASE_URL}/brands`;

// Get all brands
export const getBrands = async (): Promise<Brand[]> => {
  try {
    const response = await fetch(BRANDS_API);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch brands: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
};
