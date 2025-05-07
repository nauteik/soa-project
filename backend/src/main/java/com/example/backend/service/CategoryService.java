package com.example.backend.service;

import com.example.backend.model.Category;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CategoryService {
    List<Category> getAllCategories();
    
    Category saveCategory(Category category);
    
    Optional<Category> getCategoryById(Long id);
    
    Optional<Category> getCategoryBySlug(String slug);
    
    void deleteCategory(Long id);
    
    Map<String, Object> getCategoryHierarchy(Long categoryId);
    
    // Tìm category gốc từ một category bất kỳ
    Category findRootCategory(Category category);
    
    // Lấy danh sách các category con trực tiếp
    List<Category> findSubcategories(Long parentId);
    
    // Cập nhật category và xử lý thay đổi trong thông số kỹ thuật
    Category updateCategoryWithSpecifications(Category category, List<Category.SpecificationField> oldSpecFields);
    
    // Kiểm tra xem một key thông số kỹ thuật có đang được sử dụng trong products không
    boolean isSpecificationKeyUsedInProducts(Long categoryId, String key);
    
    // Cập nhật key trong specifications của tất cả products khi key thay đổi
    void updateSpecificationKeyInProducts(Long categoryId, String oldKey, String newKey);
    
    // Lấy tất cả các Category con (trực tiếp và gián tiếp) của một Category
    List<Category> getAllSubcategories(Long categoryId);
}