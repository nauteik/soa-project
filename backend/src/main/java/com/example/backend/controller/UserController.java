package com.example.backend.controller;

import com.example.backend.dto.UserResponseDto;
import com.example.backend.model.UserRole;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponseDto>> getUsersByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponseDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> payload) {
        Boolean enabled = payload.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.updateUserStatus(id, enabled));
    }
    
    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponseDto> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String roleName = payload.get("role");
        if (roleName == null || roleName.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            UserRole role = UserRole.valueOf(roleName);
            return ResponseEntity.ok(userService.updateUserRole(id, role));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUserInfo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        // Kiểm tra các trường bắt buộc
        String name = (String) payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Các trường tùy chọn
        String mobileNumber = (String) payload.get("mobileNumber");
        String profileImage = (String) payload.get("profileImage");
        
        return ResponseEntity.ok(userService.updateUserInfo(id, name, mobileNumber, profileImage));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/staff")
    public ResponseEntity<UserResponseDto> createStaffUser(
            @RequestBody Map<String, Object> payload) {
        UserResponseDto userDto = new UserResponseDto();
        userDto.setName((String) payload.get("name"));
        userDto.setEmail((String) payload.get("email"));
        userDto.setMobileNumber((String) payload.get("mobileNumber"));
        userDto.setProfileImage((String) payload.get("profileImage"));
        
        String password = (String) payload.get("password");
        UserRole role = UserRole.valueOf((String) payload.get("role"));
        
        return new ResponseEntity<>(userService.createStaffUser(userDto, password, role), HttpStatus.CREATED);
    }
} 