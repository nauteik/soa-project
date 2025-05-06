package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ProductDTO {
    
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Float discount;
    private Integer quantityInStock;
    private Integer quantitySold;
    private String sku;
    private Map<String, Object> specifications;
    private Boolean isActive;
    private String slug;
    
    private Long categoryId;
    private Long brandId;
    private CategoryDTO category;
    private BrandDTO brand;
    private List<ProductImageDTO> images;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Helper methods - need to keep this as it contains custom logic
    public BigDecimal getDiscountedPrice() {
        if (discount == null || discount == 0) {
            return price;
        }
        
        BigDecimal discountRate = BigDecimal.valueOf(1 - (this.discount / 100.0));
        return price.multiply(discountRate);
    }
}