package com.example.backend.controller;

import com.example.backend.dto.CategoryDTO;
import com.example.backend.model.Category;
import com.example.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        List<CategoryDTO> categoryDTOs = CategoryDTO.fromEntities(categories);
        return ResponseEntity.ok(categoryDTOs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        Optional<Category> categoryOpt = categoryService.getCategoryById(id);
        return categoryOpt.map(category -> ResponseEntity.ok(CategoryDTO.fromEntity(category)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/slug/{slug}")
    public ResponseEntity<CategoryDTO> getCategoryBySlug(@PathVariable String slug) {
        Optional<Category> categoryOpt = categoryService.getCategoryBySlug(slug);
        return categoryOpt.map(category -> ResponseEntity.ok(CategoryDTO.fromEntity(category)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{id}/hierarchy")
    public ResponseEntity<Map<String, Object>> getCategoryHierarchy(@PathVariable Long id) {
        try {
            Map<String, Object> hierarchyResult = categoryService.getCategoryHierarchy(id);
            
            // Convert entities to DTOs
            Category category = (Category) hierarchyResult.get("category");
            List<Category> ancestors = (List<Category>) hierarchyResult.get("ancestors");
            List<Category> children = (List<Category>) hierarchyResult.get("children");
            
            Map<String, Object> dtoResult = new HashMap<>();
            dtoResult.put("category", CategoryDTO.fromEntity(category));
            dtoResult.put("ancestors", CategoryDTO.fromEntities(ancestors));
            dtoResult.put("children", CategoryDTO.fromEntities(children));
            
            return ResponseEntity.ok(dtoResult);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/slug/{slug}/specifications")
    public ResponseEntity<?> getCategorySpecificationsBySlug(@PathVariable String slug) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryBySlug(slug);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Category category = categoryOpt.get();
            List<Category.SpecificationField> fields = category.getSpecificationFields();
            // Nếu category không có specificationFields, lấy của cha (nếu có)
            while ((fields == null || fields.isEmpty()) && category.getParent() != null) {
                category = category.getParent();
                fields = category.getSpecificationFields();
            }
            if (fields == null) fields = List.of();
            return ResponseEntity.ok(fields);
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết vào log
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("class", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}/specification-fields")
    public ResponseEntity<?> getCategorySpecificationFields(@PathVariable Long id) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryById(id);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Tìm category và lấy thông số kỹ thuật
            Category category = categoryOpt.get();
            List<Category.SpecificationField> fields = category.getSpecificationFields();
            
            // Nếu category hiện tại không có thông số, tìm lên category cha cao nhất
            Category currentCategory = category;
            while ((fields == null || fields.isEmpty()) && currentCategory.getParent() != null) {
                currentCategory = currentCategory.getParent();
                fields = currentCategory.getSpecificationFields();
            }
            
            if (fields == null) {
                fields = List.of();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("categoryId", category.getId());
            response.put("categoryName", category.getName());
            response.put("specificationFields", fields);
            response.put("rootCategoryId", currentCategory.getId());
            response.put("rootCategoryName", currentCategory.getName());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("class", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/debug-serialization")
    public ResponseEntity<?> debugSerialization() {
        try {
            List<Category> categories = categoryService.getAllCategories();
            // Thử serializing một category để kiểm tra
            if (!categories.isEmpty()) {
                Category firstCategory = categories.get(0);
                Map<String, Object> debug = new HashMap<>();
                debug.put("categoryId", firstCategory.getId());
                debug.put("name", firstCategory.getName());
                debug.put("specFieldsCount", firstCategory.getSpecificationFields() != null ? 
                    firstCategory.getSpecificationFields().size() : 0);
                return ResponseEntity.ok(debug);
            }
            return ResponseEntity.ok(Map.of("message", "No categories found for testing"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", e.getMessage(),
                    "class", e.getClass().getName(),
                    "cause", e.getCause() != null ? e.getCause().getMessage() : "unknown"
                ));
        }
    }
}