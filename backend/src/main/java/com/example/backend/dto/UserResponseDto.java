package com.example.backend.dto;

import com.example.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String name;
    private String email;
    private String mobileNumber;
    private String profileImage;
    private UserRole role;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor phụ cho tương thích ngược
    public UserResponseDto(Long id, String name, String email, String mobileNumber, String profileImage, UserRole role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.profileImage = profileImage;
        this.role = role;
        this.isEnabled = true; // Giá trị mặc định
        this.createdAt = LocalDateTime.now(); // Giá trị mặc định
    }
} 