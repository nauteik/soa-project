package com.example.backend.service;

import com.example.backend.dto.AuthResponseDto;
import com.example.backend.dto.ForgotPasswordDto;
import com.example.backend.dto.PasswordUpdateDto;
import com.example.backend.dto.ResetPasswordDto;
import com.example.backend.dto.UserLoginDto;
import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.dto.UserResponseDto;

public interface AuthService {
    
    /**
     * Đăng ký người dùng mới và gửi email xác thực
     * 
     * @param registrationDto thông tin đăng ký
     */
    void registerUser(UserRegistrationDto registrationDto);
    
    /**
     * Xác thực email từ token
     * 
     * @param token token xác thực
     * @return true nếu xác thực thành công
     */
    boolean verifyEmail(String token);
    
    /**
     * Đăng ký người dùng mới (không yêu cầu xác thực email)
     * 
     * @param registrationDto thông tin đăng ký
     * @return thông tin phản hồi sau đăng ký
     * @deprecated sử dụng registerUser(UserRegistrationDto) thay thế
     */
    @Deprecated
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
    
    /**
     * Xử lý yêu cầu quên mật khẩu
     * 
     * @param forgotPasswordDto thông tin quên mật khẩu
     * @return true nếu email tồn tại và đã gửi email đặt lại mật khẩu
     */
    boolean forgotPassword(ForgotPasswordDto forgotPasswordDto);
    
    /**
     * Kiểm tra token đặt lại mật khẩu có hợp lệ không
     * 
     * @param token token đặt lại mật khẩu
     * @return true nếu token hợp lệ
     */
    boolean validateResetPasswordToken(String token);
    
    /**
     * Đặt lại mật khẩu
     * 
     * @param resetPasswordDto thông tin đặt lại mật khẩu
     * @return true nếu đặt lại mật khẩu thành công
     */
    boolean resetPassword(ResetPasswordDto resetPasswordDto);
} 