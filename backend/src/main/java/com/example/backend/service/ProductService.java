package com.example.backend.service;

import com.example.backend.model.Product;
import com.example.backend.dto.ProductCreateDTO;
import com.example.backend.exception.ResourceNotFoundException;

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
    
    /**
     * Tìm kiếm sản phẩm theo từ khóa và bộ lọc
     * @param keyword Từ khóa tìm kiếm
     * @param categoryId Lọc theo danh mục
     * @param brandIds Lọc theo thương hiệu
     * @param minPrice Giá tối thiểu
     * @param maxPrice Giá tối đa
     * @param specifications Lọc theo thông số kỹ thuật
     * @param sortBy Sắp xếp theo
     * @param skip Bỏ qua số lượng sản phẩm
     * @param limit Giới hạn số lượng sản phẩm
     * @param isActive Chỉ lấy sản phẩm đang hoạt động
     * @return Danh sách sản phẩm và tổng số kết quả
     */
    Map<String, Object> searchProducts(
        String keyword,
        Long categoryId,
        List<Long> brandIds,
        Double minPrice,
        Double maxPrice,
        Map<String, List<String>> specifications,
        String sortBy,
        Integer skip,
        Integer limit,
        Boolean isActive
    );
    
    /**
     * Tạo mới sản phẩm từ ProductCreateDTO
     * @param productDTO Thông tin sản phẩm mới
     * @return Sản phẩm đã được tạo
     * @throws ResourceNotFoundException Nếu không tìm thấy danh mục hoặc thương hiệu
     */
    Product createProduct(ProductCreateDTO productDTO) throws ResourceNotFoundException;
    
    /**
     * Cập nhật sản phẩm hiện có từ ProductCreateDTO
     * @param id ID của sản phẩm cần cập nhật
     * @param productDTO Thông tin sản phẩm mới
     * @return Sản phẩm đã được cập nhật
     * @throws ResourceNotFoundException Nếu không tìm thấy sản phẩm, danh mục hoặc thương hiệu
     */
    Product updateProduct(Long id, ProductCreateDTO productDTO) throws ResourceNotFoundException;
    
    /**
     * Kiểm tra mã SKU đã tồn tại trong hệ thống chưa
     * @param sku Mã SKU cần kiểm tra
     * @return true nếu SKU đã tồn tại, false nếu chưa tồn tại
     */
    boolean isSkuExists(String sku);
}