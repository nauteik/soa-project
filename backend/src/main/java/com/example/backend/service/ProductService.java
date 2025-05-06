package com.example.backend.service;

import com.example.backend.model.Product;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ProductService {
    List<Product> getAllProducts();
    
    Product saveProduct(Product product);
    
    Optional<Product> getProductById(Long id);
    
    Optional<Product> getProductBySlug(String slug);
    
    void deleteProduct(Long id);
    
    List<Product> getProductsByCategoryId(Long categoryId);
    
    Map<String, Object> getFilteredProducts(
        Long categoryId, 
        List<Long> brandIds, 
        Double minPrice, 
        Double maxPrice,
        Map<String, List<String>> specifications,
        String sortBy,
        Integer skip,
        Integer limit,
        Boolean isFeatured,
        Boolean isActive
    );
    
    Map<String, List<String>> getSpecificationsByCategorySlug(String categorySlug);
    
    Map<String, Object> getProductsByCategorySlug(
        String categorySlug,
        List<Long> brandIds, 
        Double minPrice, 
        Double maxPrice,
        Map<String, List<String>> specifications,
        String sortBy,
        Integer skip,
        Integer limit,
        Boolean isFeatured,
        Boolean isActive
    );
}