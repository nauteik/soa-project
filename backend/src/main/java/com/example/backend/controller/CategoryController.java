package com.example.backend.controller;

import com.example.backend.dto.CategoryDTO;
import com.example.backend.model.Category;
import com.example.backend.service.CategoryService;
import com.example.backend.service.S3StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;
    private final S3StorageService s3StorageService;

    @Autowired
    public CategoryController(CategoryService categoryService, S3StorageService s3StorageService) {
        this.categoryService = categoryService;
        this.s3StorageService = s3StorageService;
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadCategoryImage(@PathVariable Long id, @RequestParam("image") MultipartFile file) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryById(id);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Category category = categoryOpt.get();
            
            if (category.getImageUrl() != null && !category.getImageUrl().isEmpty()) {
                s3StorageService.delete(category.getImageUrl());
            }
            
            String imageUrl = s3StorageService.store(file);
            
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            
            category.setImageUrl(fileName);
            Category savedCategory = categoryService.saveCategory(category);
            
            return ResponseEntity.ok(Map.of(
                "message", "Đã tải lên hình ảnh thành công",
                "image_url", fileName,
                "category", CategoryDTO.fromEntity(savedCategory)
            ));
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            Category savedCategory = categoryService.saveCategory(category);
            return ResponseEntity.status(HttpStatus.CREATED).body(CategoryDTO.fromEntity(savedCategory));
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCategoryWithImage(
            @RequestParam("name") String name,
            @RequestParam("slug") String slug,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "parent_id", required = false) Long parentId,
            @RequestParam(value = "specification_fields", required = false) String specificationFieldsJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            // Tạo category từ các tham số
            Category category = new Category();
            category.setName(name);
            category.setSlug(slug);
            category.setDescription(description);
            
            // Xử lý parent_id nếu có
            if (parentId != null) {
                Optional<Category> parentOpt = categoryService.getCategoryById(parentId);
                if (parentOpt.isEmpty()) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Danh mục cha không tồn tại");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                }
                category.setParent(parentOpt.get());
            }
            
            // Xử lý specificationFields nếu có
            if (specificationFieldsJson != null && !specificationFieldsJson.isEmpty() && parentId == null) {
                // Chỉ xử lý specificationFields nếu là danh mục gốc (không có parent)
                try {
                    // Parse JSON
                    ObjectMapper objectMapper = new ObjectMapper();
                    List<Category.SpecificationField> fields = objectMapper.readValue(
                        specificationFieldsJson, 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Category.SpecificationField.class)
                    );
                    category.setSpecificationFields(fields);
                } catch (Exception e) {
                    e.printStackTrace();
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Lỗi khi phân tích thông số kỹ thuật: " + e.getMessage());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                }
            }
            
            // Xử lý hình ảnh nếu có
            if (image != null && !image.isEmpty()) {
                String imageUrl = s3StorageService.store(image);
                
                // Lấy chỉ tên file từ URL đầy đủ
                String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
                
                category.setImageUrl(fileName);
            }
            
            // Lưu category và trả về kết quả
            Category savedCategory = categoryService.saveCategory(category);
            return ResponseEntity.status(HttpStatus.CREATED).body(CategoryDTO.fromEntity(savedCategory));
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
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
        
        if (categoryOpt.isPresent()) {
            Category category = categoryOpt.get();
            System.out.println("GET /categories/" + id + " - Tìm thấy category: " + category.getName());
            System.out.println("- Parent ID: " + category.getParent_id());
            System.out.println("- Has parent?: " + (category.getParent() != null));
            
            return ResponseEntity.ok(CategoryDTO.fromEntity(category));
        }
        
        return ResponseEntity.notFound().build();
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

    @GetMapping("/{id}/root")
    public ResponseEntity<CategoryDTO> getRootCategory(@PathVariable Long id) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryById(id);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Category category = categoryOpt.get();
            Category rootCategory = categoryService.findRootCategory(category);
            
            return ResponseEntity.ok(CategoryDTO.fromEntity(rootCategory));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<CategoryDTO>> getSubcategories(@PathVariable Long parentId) {
        try {
            List<Category> subcategories = categoryService.findSubcategories(parentId);
            System.out.println("GET /categories/parent/" + parentId + " - Tìm thấy " + subcategories.size() + " danh mục con");
            
            List<CategoryDTO> subcategoryDTOs = CategoryDTO.fromEntities(subcategories);
            return ResponseEntity.ok(subcategoryDTOs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category updatedCategory) {
        try {
            // Kiểm tra category có tồn tại không
            Optional<Category> existingCategoryOpt = categoryService.getCategoryById(id);
            if (existingCategoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Category existingCategory = existingCategoryOpt.get();
            
            // Đặt ID từ path variable
            updatedCategory.setId(id);
            
            // Debug: In ra thông tin về imageUrl
            System.out.println("Updating category: " + updatedCategory.getName());
            System.out.println("- Old imageUrl: " + existingCategory.getImageUrl());
            System.out.println("- New imageUrl: " + updatedCategory.getImageUrl());
            
            // Giữ nguyên imageUrl nếu trường này null hoặc rỗng
            if (updatedCategory.getImageUrl() == null || updatedCategory.getImageUrl().isEmpty()) {
                updatedCategory.setImageUrl(existingCategory.getImageUrl());
                System.out.println("- Using old imageUrl: " + updatedCategory.getImageUrl());
            }
            
            // Debug: In ra thông tin về specificationFields trước khi cập nhật
            System.out.println("- Old specFields: " + (existingCategory.getSpecificationFields() != null ? existingCategory.getSpecificationFields().size() : 0));
            System.out.println("- New specFields: " + (updatedCategory.getSpecificationFields() != null ? updatedCategory.getSpecificationFields().size() : 0));
            
            // Lưu các thông số kỹ thuật cũ để so sánh
            List<Category.SpecificationField> oldSpecFields = existingCategory.getSpecificationFields();
            
            // Kiểm tra xem có phải danh mục gốc không
            if (existingCategory.getParent() == null) {
                // Nếu là danh mục gốc, sử dụng phương thức đặc biệt để xử lý thông số kỹ thuật
                try {
                    // Đảm bảo thông tin parent được giữ nguyên
                    updatedCategory.setParent(existingCategory.getParent());
                    
                    Category savedCategory = categoryService.updateCategoryWithSpecifications(updatedCategory, oldSpecFields);
                    return ResponseEntity.ok(CategoryDTO.fromEntity(savedCategory));
                } catch (IllegalStateException e) {
                    // Trường hợp không thể xóa thông số kỹ thuật vì đang được sử dụng
                    Map<String, String> error = new HashMap<>();
                    error.put("error", e.getMessage());
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
                }
            } else {
                // Nếu không phải danh mục gốc, cập nhật bình thường mà không cần xử lý thông số kỹ thuật
                // Đảm bảo thông tin parent được giữ nguyên
                updatedCategory.setParent(existingCategory.getParent());
                
                // Đảm bảo thêm một lần nữa việc kiểm tra imageUrl để tránh bị null
                if (updatedCategory.getImageUrl() == null || updatedCategory.getImageUrl().isEmpty()) {
                    updatedCategory.setImageUrl(existingCategory.getImageUrl());
                    System.out.println("- Set imageUrl from existingCategory in non-root path: " + updatedCategory.getImageUrl());
                }
                
                Category savedCategory = categoryService.saveCategory(updatedCategory);
                return ResponseEntity.ok(CategoryDTO.fromEntity(savedCategory));
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateCategoryWithImage(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("slug") String slug,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "parent_id", required = false) Long parentId,
            @RequestParam(value = "specification_fields", required = false) String specificationFieldsJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            // Kiểm tra category có tồn tại không
            Optional<Category> existingCategoryOpt = categoryService.getCategoryById(id);
            if (existingCategoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Category existingCategory = existingCategoryOpt.get();
            
            // Tạo category mới với dữ liệu cập nhật
            Category updatedCategory = new Category();
            updatedCategory.setId(id);
            updatedCategory.setName(name);
            updatedCategory.setSlug(slug);
            updatedCategory.setDescription(description);
            
            // Debug: In ra thông tin về imageUrl
            System.out.println("Updating category with image: " + name);
            System.out.println("- Old imageUrl: " + existingCategory.getImageUrl());
            System.out.println("- Has new image: " + (image != null && !image.isEmpty()));
            
            // Giữ nguyên imageUrl nếu không có hình ảnh mới
            if (image == null || image.isEmpty()) {
                updatedCategory.setImageUrl(existingCategory.getImageUrl());
                System.out.println("- Using old imageUrl: " + updatedCategory.getImageUrl());
            } else {
                // Xóa hình ảnh cũ nếu có
                if (existingCategory.getImageUrl() != null && !existingCategory.getImageUrl().isEmpty()) {
                    s3StorageService.delete(existingCategory.getImageUrl());
                }
                
                // Lưu hình ảnh mới
                String imageUrl = s3StorageService.store(image);
                
                // Lấy chỉ tên file từ URL đầy đủ
                String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
                
                updatedCategory.setImageUrl(fileName);
                System.out.println("- Set new imageUrl: " + fileName);
            }
            
            // Xử lý parent_id
            if (parentId != null) {
                Optional<Category> parentOpt = categoryService.getCategoryById(parentId);
                if (parentOpt.isPresent()) {
                    updatedCategory.setParent(parentOpt.get());
                }
            } else {
                updatedCategory.setParent(null);
            }
            
            // Lưu các thông số kỹ thuật cũ để so sánh
            List<Category.SpecificationField> oldSpecFields = existingCategory.getSpecificationFields();
            
            // Xử lý specification_fields nếu có và là danh mục gốc
            if (updatedCategory.getParent() == null && specificationFieldsJson != null && !specificationFieldsJson.isEmpty()) {
                try {
                    // Sử dụng ObjectMapper để chuyển đổi JSON thành List<SpecificationField>
                    com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    List<Category.SpecificationField> specFields = objectMapper.readValue(
                        specificationFieldsJson, 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Category.SpecificationField.class)
                    );
                    updatedCategory.setSpecificationFields(specFields);
                } catch (Exception e) {
                    System.err.println("Lỗi khi chuyển đổi JSON specification_fields: " + e.getMessage());
                }
            }
            
            // Kiểm tra xem có phải danh mục gốc không
            if (existingCategory.getParent() == null) {
                // Nếu là danh mục gốc, sử dụng phương thức đặc biệt để xử lý thông số kỹ thuật
                try {
                    Category savedCategory = categoryService.updateCategoryWithSpecifications(updatedCategory, oldSpecFields);
                    return ResponseEntity.ok(CategoryDTO.fromEntity(savedCategory));
                } catch (IllegalStateException e) {
                    // Trường hợp không thể xóa thông số kỹ thuật vì đang được sử dụng
                    Map<String, String> error = new HashMap<>();
                    error.put("error", e.getMessage());
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
                }
            } else {
                // Nếu không phải danh mục gốc, cập nhật bình thường mà không cần xử lý thông số kỹ thuật
                // Đảm bảo thông tin parent được giữ nguyên
                updatedCategory.setParent(existingCategory.getParent());
                
                // Đảm bảo thêm một lần nữa việc kiểm tra imageUrl để tránh bị null
                if (updatedCategory.getImageUrl() == null || updatedCategory.getImageUrl().isEmpty()) {
                    updatedCategory.setImageUrl(existingCategory.getImageUrl());
                    System.out.println("- Set imageUrl from existingCategory in non-root path: " + updatedCategory.getImageUrl());
                }
                
                Category savedCategory = categoryService.saveCategory(updatedCategory);
                return ResponseEntity.ok(CategoryDTO.fromEntity(savedCategory));
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}