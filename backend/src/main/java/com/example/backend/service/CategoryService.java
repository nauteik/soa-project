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
}