package com.example.backend.service.impl;

import com.example.backend.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    @Override
    public void sendRegistrationConfirmationEmail(String to, String name, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Xác nhận đăng ký tài khoản");
            
            String verificationLink = frontendUrl + "/verify-account?token=" + token;
            
            String emailContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #333;'>Xin chào " + name + ",</h2>"
                + "<p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + verificationLink + "' style='background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Xác nhận tài khoản</a>"
                + "</div>"
                + "<p>Liên kết này sẽ hết hạn sau 24 giờ. Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>"
                + "<p>Trân trọng,<br>Đội ngũ hỗ trợ</p>"
                + "</div>";
            
            helper.setText(emailContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email xác nhận: " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendRegistrationSuccessEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Đăng ký tài khoản thành công");
            
            String loginLink = frontendUrl + "/login";
            
            String emailContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #333;'>Xin chào " + name + ",</h2>"
                + "<p>Chúc mừng bạn đã xác nhận tài khoản thành công!</p>"
                + "<p>Bạn đã có thể đăng nhập và sử dụng tất cả các tính năng của hệ thống.</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + loginLink + "' style='background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Đăng nhập ngay</a>"
                + "</div>"
                + "<p>Trân trọng,<br>Đội ngũ hỗ trợ</p>"
                + "</div>";
            
            helper.setText(emailContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email thông báo: " + e.getMessage());
        }
    }
    
    @Async
    @Override
    public void sendPasswordResetEmail(String to, String name, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Đặt lại mật khẩu");
            
            String resetLink = frontendUrl + "/reset-password?token=" + token;
            
            String emailContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #333;'>Xin chào " + name + ",</h2>"
                + "<p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + resetLink + "' style='background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Đặt lại mật khẩu</a>"
                + "</div>"
                + "<p>Liên kết này sẽ hết hạn sau 5 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>"
                + "<p>Trân trọng,<br>Đội ngũ hỗ trợ</p>"
                + "</div>";
            
            helper.setText(emailContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage());
        }
    }
} 