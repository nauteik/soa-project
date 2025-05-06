package com.example.backend.controller;

import com.example.backend.dto.AuthResponseDto;
import com.example.backend.dto.PasswordUpdateDto;
import com.example.backend.dto.UserLoginDto;
import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        return new ResponseEntity<>(authService.register(registrationDto), HttpStatus.CREATED);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody UserLoginDto loginDto) {
        return ResponseEntity.ok(authService.login(loginDto));
    }
    
    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponseDto> adminLogin(@Valid @RequestBody UserLoginDto loginDto) {
        return ResponseEntity.ok(authService.adminLogin(loginDto));
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        return ResponseEntity.ok(authService.getUserFromToken(token));
    }
    
    @PutMapping("/update-profile")
    public ResponseEntity<UserResponseDto> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UserResponseDto userDto) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        return ResponseEntity.ok(authService.updateUserProfile(token, userDto));
    }
    
    @PutMapping("/update-password")
    public ResponseEntity<Void> updatePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody PasswordUpdateDto passwordDto) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        authService.updatePassword(token, passwordDto);
        return ResponseEntity.ok().build();
    }
} 