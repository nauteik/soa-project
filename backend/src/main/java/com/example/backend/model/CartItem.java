package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @Transient
    public BigDecimal getSubtotal() {
        if (product != null && product.getPrice() != null) {
            BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                new BigDecimal(product.getDiscount().toString()).divide(new BigDecimal("100"))
            );
            return product.getPrice().multiply(discountMultiplier).multiply(new BigDecimal(quantity));
        }
        return BigDecimal.ZERO;
    }
} 