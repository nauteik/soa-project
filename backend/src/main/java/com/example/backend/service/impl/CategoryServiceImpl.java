package com.example.backend.service.impl;

import com.example.backend.model.Category;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    
    @Autowired
    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    
    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    @Override
    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }
    
    @Override
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
    
    @Override
    public Optional<Category> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }
    
    @Override
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryHierarchy(Long categoryId) {
        Optional<Category> categoryOpt = categoryRepository.findById(categoryId);
        
        if (categoryOpt.isEmpty()) {
            throw new IllegalArgumentException("Category not found with ID: " + categoryId);
        }
        
        Category category = categoryOpt.get();
        List<Category> ancestors = new ArrayList<>();
        
        // Find all ancestors by traversing up the tree
        Category current = category;
        while (current.getParent() != null) {
            Category parent = current.getParent();
            ancestors.add(0, parent); // Add at the beginning to maintain order
            current = parent;
        }
        
        // Find all descendants (children categories)
        List<Category> children = categoryRepository.findByParent(category);
        
        Map<String, Object> hierarchyResult = new HashMap<>();
        hierarchyResult.put("category", category);
        hierarchyResult.put("ancestors", ancestors);
        hierarchyResult.put("children", children);
        
        return hierarchyResult;
    }
}