package com.example.backend.service;

import com.example.backend.dto.AuthResponseDto;
import com.example.backend.dto.PasswordUpdateDto;
import com.example.backend.dto.UserLoginDto;
import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.dto.UserResponseDto;

public interface AuthService {
    
    /**
     * Đăng ký người dùng mới
     * 
     * @param registrationDto thông tin đăng ký
     * @return thông tin phản hồi sau đăng ký
     */
    AuthResponseDto register(UserRegistrationDto registrationDto);
    
    /**
     * Đăng nhập người dùng
     * 
     * @param loginDto thông tin đăng nhập
     * @return thông tin phản hồi sau đăng nhập
     */
    AuthResponseDto login(UserLoginDto loginDto);
    
    /**
     * Đăng nhập dành cho admin (STAFF/MANAGER)
     * 
     * @param loginDto thông tin đăng nhập
     * @return thông tin phản hồi sau đăng nhập
     */
    AuthResponseDto adminLogin(UserLoginDto loginDto);
    
    /**
     * Lấy thông tin người dùng từ token
     * 
     * @param token JWT token
     * @return thông tin người dùng
     */
    UserResponseDto getUserFromToken(String token);
    
    /**
     * Cập nhật thông tin cá nhân của người dùng
     * 
     * @param token JWT token
     * @param userDto thông tin người dùng mới
     * @return thông tin người dùng sau khi cập nhật
     */
    UserResponseDto updateUserProfile(String token, UserResponseDto userDto);
    
    /**
     * Cập nhật mật khẩu người dùng
     * 
     * @param token JWT token
     * @param passwordDto thông tin mật khẩu
     */
    void updatePassword(String token, PasswordUpdateDto passwordDto);
} 