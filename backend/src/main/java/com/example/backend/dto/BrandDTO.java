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
public class BrandDTO {
    
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String slug;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}