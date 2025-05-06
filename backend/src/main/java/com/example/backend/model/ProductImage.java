package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class ProductImage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;
    
    @Column(nullable = false)
    @JsonProperty("image_url") // This annotation makes it serialize as "image_url" in JSON
    private String imageUrl;
    
    @JsonProperty("alt_text") // Add this to match frontend property name
    private String alt;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @JsonProperty("is_main") // Add this to match frontend property name
    private Boolean isMain = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}