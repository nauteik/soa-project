package com.example.backend.dto;

import com.example.backend.model.Category;
import com.example.backend.model.Category.SpecificationField;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class CategoryDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Long parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SpecificationField> specificationFields;
    
    // Constructor chuyển đổi từ Entity sang DTO
    public static CategoryDTO fromEntity(Category category) {
        if (category == null) {
            return null;
        }
        
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setParentId(category.getParent_id());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        dto.setSpecificationFields(category.getSpecificationFields());
        
        return dto;
    }
    
    // Phương thức tĩnh để chuyển đổi danh sách Entity sang danh sách DTO
    public static List<CategoryDTO> fromEntities(List<Category> categories) {
        if (categories == null) {
            return List.of();
        }
        
        return categories.stream()
                .map(CategoryDTO::fromEntity)
                .collect(Collectors.toList());
    }
}