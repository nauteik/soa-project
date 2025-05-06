package com.example.backend.repository;

import com.example.backend.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Product Image entity
 */
@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    
    /**
     * Find all images for a product
     * @param productId the product ID
     * @return list of product images
     */
    List<ProductImage> findByProductId(Long productId);
    
    /**
     * Find all images for a product ordered by sort order
     * @param productId the product ID
     * @return list of product images
     */
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);
    
    /**
     * Delete all images for a product
     * @param productId the product ID
     */
    void deleteByProductId(Long productId);
    
    /**
     * Find main image for a product (lowest sort order)
     * @param productId the product ID
     * @return the main product image
     */
    @Query("SELECT pi FROM ProductImage pi WHERE pi.product.id = :productId ORDER BY pi.sortOrder ASC LIMIT 1")
    ProductImage findMainImageByProductId(@Param("productId") Long productId);
}