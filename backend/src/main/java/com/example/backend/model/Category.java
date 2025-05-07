package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ToString(exclude = {"parent", "subcategories", "products"})
@EqualsAndHashCode(exclude = {"parent", "subcategories", "products"})
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(unique = true)
    private String slug;
    
    private String description;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    // Thêm getter/setter cho image_url để chuyển đổi json
    @JsonProperty("image_url")
    public String getImage_url() {
        return imageUrl;
    }
    
    @JsonProperty("image_url")
    public void setImage_url(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnore
    private Category parent;
    
    // Add this method to expose parent_id in JSON responses
    public Long getParent_id() {
        return parent != null ? parent.getId() : null;
    }
    
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Category> subcategories = new HashSet<>();
    
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Product> products = new HashSet<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Getter để đổi tên thành created_at cho frontend
    @JsonProperty("created_at")
    public LocalDateTime getCreated_at() {
        return createdAt;
    }
    
    // Getter để đổi tên thành updated_at cho frontend
    @JsonProperty("updated_at")
    public LocalDateTime getUpdated_at() {
        return updatedAt;
    }
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonProperty("specificationFields")
    private java.util.List<SpecificationField> specificationFields;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecificationField {
        private String key;
        private String labelVi;
        private String labelEn;
        private String type;
        private Integer sortOrder;
    }

    // Getter thủ công để kiểm soát trường hợp null/exception
    public List<SpecificationField> getSpecificationFields() {
        try {
            return specificationFields;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}