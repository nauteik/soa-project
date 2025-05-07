package com.example.backend.controller;

import com.example.backend.dto.AuthResponseDto;
import com.example.backend.dto.ForgotPasswordDto;
import com.example.backend.dto.PasswordUpdateDto;
import com.example.backend.dto.ResetPasswordDto;
import com.example.backend.dto.UserLoginDto;
import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        authService.registerUser(registrationDto);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng ký tài khoản thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam("token") String token) {
        boolean verified = authService.verifyEmail(token);
        
        Map<String, String> response = new HashMap<>();
        if (verified) {
            response.put("message", "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "Token không hợp lệ hoặc đã hết hạn.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
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
    
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordDto forgotPasswordDto) {
        boolean sent = authService.forgotPassword(forgotPasswordDto);
        
        Map<String, String> response = new HashMap<>();
        if (sent) {
            response.put("message", "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "Không tìm thấy email trong hệ thống.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @GetMapping("/validate-reset-token")
    public ResponseEntity<Map<String, String>> validateResetToken(@RequestParam("token") String token) {
        boolean valid = authService.validateResetPasswordToken(token);
        
        Map<String, String> response = new HashMap<>();
        if (valid) {
            response.put("message", "Token hợp lệ.");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "Token không hợp lệ hoặc đã hết hạn.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        boolean reset = authService.resetPassword(resetPasswordDto);
        
        Map<String, String> response = new HashMap<>();
        if (reset) {
            response.put("message", "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "Token không hợp lệ hoặc đã hết hạn.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
} 