package com.example.backend.repository;

import com.example.backend.model.Category;
import com.example.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);
    
    Optional<Product> findBySlug(String slug);
    
    Optional<Product> findBySku(String sku);
    
    List<Product> findByCategory(Category category);
    
    List<Product> findByBrandId(Long brandId);
    
    /**
     * Kiểm tra xem một mã SKU đã tồn tại trong cơ sở dữ liệu chưa
     * @param sku Mã SKU cần kiểm tra
     * @return true nếu SKU đã tồn tại, false nếu chưa
     */
    boolean existsBySku(String sku);
    
    @Query("SELECT p FROM Product p WHERE p.isFeatured = true AND p.isActive = true ORDER BY p.createdAt DESC")
    List<Product> findFeaturedProducts();
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.category.id = :categoryId ORDER BY p.createdAt DESC")
    List<Product> findActiveByCategoryId(@Param("categoryId") Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.isActive = true")
    List<Product> findActiveByCategoryIdAndSortByNewest(@Param("categoryId") Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.isActive = true ORDER BY p.price ASC")
    List<Product> findActiveByCategoryIdAndSortByPriceAsc(@Param("categoryId") Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.isActive = true ORDER BY p.price DESC")
    List<Product> findActiveByCategoryIdAndSortByPriceDesc(@Param("categoryId") Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.isActive = true ORDER BY p.quantitySold DESC")
    List<Product> findActiveByCategoryIdAndSortByBestSelling(@Param("categoryId") Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.isFeatured = :isFeatured AND p.isActive = :isActive")
    List<Product> findByFeaturedAndActive(
        @Param("isFeatured") Boolean isFeatured, 
        @Param("isActive") Boolean isActive
    );
}