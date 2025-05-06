package com.example.backend.dto;

import com.example.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
} 