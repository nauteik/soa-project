package com.example.backend.dto;

import com.example.backend.model.Category;
import com.example.backend.model.Category.SpecificationField;
import com.fasterxml.jackson.annotation.JsonProperty;

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
    
    @JsonProperty("image_url")
    private String imageUrl;
    
    @JsonProperty("parent_id")
    private Long parentId;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
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
        
        // Lưu ý đặc biệt về imageUrl - fix lỗi không khớp tên thuộc tính
        String imageUrl = category.getImageUrl();
        dto.setImageUrl(imageUrl);
        System.out.println("SetImageUrl in DTO: " + imageUrl + " for category " + category.getName());
        
        // Chắc chắn lấy parentId đúng cách
        Long parentId = category.getParent_id();
        dto.setParentId(parentId);
        
        // In ra log chi tiết
        System.out.println("Converting category to DTO: " + category.getName() + 
                          " (ID: " + category.getId() + ")" +
                          " with parentId: " + parentId +
                          " and imageUrl: " + imageUrl +
                          " - Entity imageUrl field: " + category.getImageUrl());
        
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        
        // Lấy specification fields và đặt vào DTO
        List<SpecificationField> specFields = category.getSpecificationFields();
        dto.setSpecificationFields(specFields);
        
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