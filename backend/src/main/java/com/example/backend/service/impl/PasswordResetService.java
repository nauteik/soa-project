package com.example.backend.service.impl;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final EmailService emailService;
    private final UserRepository userRepository;
    
    // Lưu trữ thông tin đặt lại mật khẩu: token -> ResetPasswordData
    private final Map<String, ResetPasswordData> resetTokenStorage = new ConcurrentHashMap<>();
    
    // Thời gian hết hạn token (5 phút)
    private static final long EXPIRATION_MINUTES = 5;

    /**
     * Tạo token đặt lại mật khẩu và gửi email
     * 
     * @param email Email của người dùng
     * @return true nếu gửi thành công, false nếu email không tồn tại
     */
    public boolean sendPasswordResetEmail(String email) {
        // Kiểm tra email tồn tại
        return userRepository.findByEmail(email)
                .map(user -> {
                    // Tạo token mới
                    String token = UUID.randomUUID().toString();
                    
                    // Lưu thông tin đặt lại mật khẩu
                    ResetPasswordData resetData = new ResetPasswordData(
                            email,
                            user.getName(),
                            LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES)
                    );
                    
                    resetTokenStorage.put(token, resetData);
                    
                    // Gửi email đặt lại mật khẩu
                    emailService.sendPasswordResetEmail(
                            email,
                            user.getName(),
                            token
                    );
                    
                    return true;
                })
                .orElse(false);
    }
    
    /**
     * Kiểm tra token có hợp lệ không
     * 
     * @param token token cần kiểm tra
     * @return true nếu token hợp lệ và chưa hết hạn
     */
    public boolean isTokenValid(String token) {
        ResetPasswordData resetData = resetTokenStorage.get(token);
        
        if (resetData == null) {
            return false;
        }
        
        // Kiểm tra token đã hết hạn chưa
        return !resetData.isExpired();
    }
    
    /**
     * Lấy email từ token
     * 
     * @param token token cần lấy thông tin
     * @return email nếu token hợp lệ, null nếu không hợp lệ
     */
    public String getEmailFromToken(String token) {
        ResetPasswordData resetData = resetTokenStorage.get(token);
        
        if (resetData == null || resetData.isExpired()) {
            return null;
        }
        
        return resetData.getEmail();
    }
    
    /**
     * Xác nhận đã đặt lại mật khẩu thành công và xóa token
     * 
     * @param token token cần xác nhận
     * @return true nếu xác nhận thành công
     */
    public boolean confirmPasswordReset(String token) {
        ResetPasswordData resetData = resetTokenStorage.get(token);
        
        if (resetData == null || resetData.isExpired()) {
            return false;
        }
        
        // Xóa token sau khi đã sử dụng
        resetTokenStorage.remove(token);
        
        return true;
    }
    
    /**
     * Lập lịch dọn dẹp các token hết hạn (chạy mỗi 5 phút)
     */
    @Scheduled(fixedRate = 300000) // Mỗi 5 phút
    public void cleanupExpiredTokens() {
        resetTokenStorage.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
    
    /**
     * Lớp lưu trữ thông tin đặt lại mật khẩu
     */
    private static class ResetPasswordData {
        private final String email;
        private final String name;
        private final LocalDateTime expiryDate;
        
        public ResetPasswordData(String email, String name, LocalDateTime expiryDate) {
            this.email = email;
            this.name = name;
            this.expiryDate = expiryDate;
        }
        
        public String getEmail() {
            return email;
        }
        
        public String getName() {
            return name;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryDate);
        }
    }
} 