package com.example.backend.util;

import com.example.backend.dto.*;
import com.example.backend.model.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility class to map between entity models and DTOs
 */
public class ModelMapper {
    
    /**
     * Maps a Brand entity to a BrandDTO
     */
    public static BrandDTO mapToBrandDTO(Brand brand) {
        if (brand == null) {
            return null;
        }
        
        BrandDTO dto = new BrandDTO();
        dto.setId(brand.getId());
        dto.setName(brand.getName());
        dto.setDescription(brand.getDescription());
        dto.setLogoUrl(brand.getLogoUrl());
        dto.setSlug(brand.getSlug());
        dto.setCreatedAt(brand.getCreatedAt());
        dto.setUpdatedAt(brand.getUpdatedAt());
        
        return dto;
    }
    
    /**
     * Maps a BrandDTO to a Brand entity
     */
    public static Brand mapToBrandEntity(BrandDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Brand brand = new Brand();
        brand.setId(dto.getId());
        brand.setName(dto.getName());
        brand.setDescription(dto.getDescription());
        brand.setLogoUrl(dto.getLogoUrl());
        brand.setSlug(dto.getSlug());
        brand.setCreatedAt(dto.getCreatedAt());
        brand.setUpdatedAt(dto.getUpdatedAt());
        
        return brand;
    }
    
    /**
     * Maps a Category entity to a CategoryDTO
     * @deprecated Sử dụng CategoryDTO.fromEntity thay thế
     */
    @Deprecated
    public static CategoryDTO mapToCategoryDTO(Category category) {
        if (category == null) {
            return null;
        }
        
        // Sử dụng phương thức static fromEntity từ CategoryDTO
        return CategoryDTO.fromEntity(category);
    }
    
    /**
     * Maps a CategoryDTO to a Category entity
     */
    public static Category mapToCategoryEntity(CategoryDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Category category = new Category();
        category.setId(dto.getId());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setSlug(dto.getSlug());
        category.setCreatedAt(dto.getCreatedAt());
        category.setUpdatedAt(dto.getUpdatedAt());
        
        return category;
    }
    
    /**
     * Maps a Category entity to a CategoryDTO including subcategories
     * @deprecated Sử dụng CategoryDTO.fromEntity thay thế
     */
    @Deprecated
    public static CategoryDTO mapToCategoryDTOWithSubcategories(Category category) {
        if (category == null) {
            return null;
        }
        
        // Sử dụng phương thức static fromEntity từ CategoryDTO
        return CategoryDTO.fromEntity(category);
        
        // Lưu ý: CategoryDTO mới không còn trường subcategories
        // nên không cần gán subcategories nữa
    }
    
    /**
     * Maps a ProductImage entity to a ProductImageDTO
     */
    public static ProductImageDTO mapToProductImageDTO(ProductImage image) {
        if (image == null) {
            return null;
        }
        
        ProductImageDTO dto = new ProductImageDTO();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());
        dto.setAlt(image.getAlt());
        dto.setSortOrder(image.getSortOrder());
        
        if (image.getProduct() != null) {
            dto.setProductId(image.getProduct().getId());
        }
        
        dto.setCreatedAt(image.getCreatedAt());
        
        return dto;
    }
    
    /**
     * Maps a ProductImageDTO to a ProductImage entity
     */
    public static ProductImage mapToProductImageEntity(ProductImageDTO dto) {
        if (dto == null) {
            return null;
        }
        
        ProductImage image = new ProductImage();
        image.setId(dto.getId());
        image.setImageUrl(dto.getImageUrl());
        image.setAlt(dto.getAlt());
        image.setSortOrder(dto.getSortOrder());
        
        return image;
    }
    
    /**
     * Maps a Product entity to a ProductDTO
     */
    public static ProductDTO mapToProductDTO(Product product) {
        if (product == null) {
            return null;
        }
        
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setDiscount(product.getDiscount());
        dto.setQuantityInStock(product.getQuantityInStock());
        dto.setQuantitySold(product.getQuantitySold());
        dto.setSku(product.getSku());
        dto.setSpecifications(product.getSpecifications());
        dto.setIsActive(product.getIsActive());
        dto.setSlug(product.getSlug());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategory(mapToCategoryDTO(product.getCategory()));
        }
        
        if (product.getBrand() != null) {
            dto.setBrandId(product.getBrand().getId());
            dto.setBrand(mapToBrandDTO(product.getBrand()));
        }
        
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            List<ProductImageDTO> images = product.getImages().stream()
                .map(ModelMapper::mapToProductImageDTO)
                .collect(Collectors.toList());
            dto.setImages(images);
        }
        
        return dto;
    }
    
    /**
     * Maps a ProductDTO to a Product entity
     */
    public static Product mapToProductEntity(ProductDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Product product = new Product();
        product.setId(dto.getId());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setDiscount(dto.getDiscount());
        product.setQuantityInStock(dto.getQuantityInStock());
        product.setQuantitySold(dto.getQuantitySold());
        product.setSku(dto.getSku());
        product.setSpecifications(dto.getSpecifications());
        product.setIsActive(dto.getIsActive());
        product.setSlug(dto.getSlug());
        product.setCreatedAt(dto.getCreatedAt());
        product.setUpdatedAt(dto.getUpdatedAt());
        
        return product;
    }
    
    /**
     * Maps a list of entities to a list of DTOs
     */
    public static <D, E> List<D> mapList(Set<E> entities, java.util.function.Function<E, D> mapper) {
        return entities.stream()
            .map(mapper)
            .collect(Collectors.toList());
    }
}