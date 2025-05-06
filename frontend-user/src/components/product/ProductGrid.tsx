import React from 'react';
import { Grid, Box, Typography, Pagination, CircularProgress, Alert } from '@mui/material';
import { Product } from '../../types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  totalPages: number;
  currentPage: number;
  onPageChange?: (event: React.ChangeEvent<unknown>, page: number) => void;
  onProductClick?: (productId: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  error,
  totalPages,
  currentPage,
  onPageChange,
  onProductClick
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Error loading products: {error.message}
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No products found.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
            <ProductCard product={product} onClick={onProductClick} />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            color="primary"
            onChange={onPageChange}
          />
        </Box>
      )}
    </>
  );
};

export default ProductGrid;