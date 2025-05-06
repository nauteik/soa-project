package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private String productSlug;
    private BigDecimal productPrice;
    private Float productDiscount;
    private Integer quantity;
    private BigDecimal subtotal;
    private LocalDateTime createdAt;
} 