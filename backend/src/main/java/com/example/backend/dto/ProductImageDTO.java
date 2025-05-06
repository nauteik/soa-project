package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ProductImageDTO {
    
    private Long id;
    private String imageUrl;
    private String alt;
    private Boolean isMain;
    private Integer sortOrder;
    private Long productId;
    private LocalDateTime createdAt;
}