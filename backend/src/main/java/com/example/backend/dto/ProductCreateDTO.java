package com.example.backend.dto;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

/**
 * DTO cho việc tạo và cập nhật sản phẩm
 */
public class ProductCreateDTO {
    private String name;
    private String sku;
    private String slug;
    private String description;
    private Double price;
    private Integer discount;
    private Integer quantityInStock;
    private Long categoryId;
    private Long brandId;
    private Boolean isActive;
    private Boolean isFeatured;
    private Map<String, Object> specifications;
    private List<Map<String, Object>> imageDataList;
    
    // Các trường bổ sung cho cập nhật sản phẩm
    private List<Map<String, Object>> existingImagesList;
    private List<Long> deletedImageIds;

    // Getters và Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getDiscount() {
        return discount;
    }

    public void setDiscount(Integer discount) {
        this.discount = discount;
    }

    public Integer getQuantityInStock() {
        return quantityInStock;
    }

    public void setQuantityInStock(Integer quantityInStock) {
        this.quantityInStock = quantityInStock;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Long getBrandId() {
        return brandId;
    }

    public void setBrandId(Long brandId) {
        this.brandId = brandId;
    }

    public Boolean isActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public Boolean isFeatured() {
        return isFeatured;
    }

    public void setFeatured(Boolean featured) {
        isFeatured = featured;
    }

    public Map<String, Object> getSpecifications() {
        return specifications;
    }

    public void setSpecifications(Map<String, Object> specifications) {
        this.specifications = specifications;
    }

    public List<Map<String, Object>> getImageDataList() {
        return imageDataList;
    }

    public void setImageDataList(List<Map<String, Object>> imageDataList) {
        this.imageDataList = imageDataList;
    }

    public List<Map<String, Object>> getExistingImagesList() {
        return existingImagesList;
    }

    public void setExistingImagesList(List<Map<String, Object>> existingImagesList) {
        this.existingImagesList = existingImagesList;
    }

    public List<Long> getDeletedImageIds() {
        return deletedImageIds;
    }

    public void setDeletedImageIds(List<Long> deletedImageIds) {
        this.deletedImageIds = deletedImageIds;
    }
} 