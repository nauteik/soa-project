package com.example.backend.service;

public interface EmailService {
    
    /**
     * Gửi email xác nhận đăng ký
     *
     * @param to địa chỉ email người nhận
     * @param name tên người nhận
     * @param token token xác nhận
     */
    void sendRegistrationConfirmationEmail(String to, String name, String token);
    
    /**
     * Gửi email thông báo đăng ký thành công
     *
     * @param to địa chỉ email người nhận
     * @param name tên người nhận
     */
    void sendRegistrationSuccessEmail(String to, String name);
    
    /**
     * Gửi email đặt lại mật khẩu
     *
     * @param to địa chỉ email người nhận
     * @param name tên người nhận
     * @param token token đặt lại mật khẩu
     */
    void sendPasswordResetEmail(String to, String name, String token);
} 