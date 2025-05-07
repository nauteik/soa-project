package com.example.backend.dto;

import com.example.backend.model.OrderItemStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private String productSlug;
    private BigDecimal price;
    private Float discount;
    private Integer quantity;
    private BigDecimal subtotal;
    private OrderItemStatus status;
    private String statusDisplayName;
} 