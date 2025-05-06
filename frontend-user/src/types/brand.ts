export interface Brand {
  id: number;
  name: string;
  slug?: string;
  logoUrl?: string;
  logo_url?: string; // Support both camelCase and snake_case formats
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}