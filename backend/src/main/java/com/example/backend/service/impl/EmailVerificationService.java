package com.example.backend.service.impl;

import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.model.User;
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
public class EmailVerificationService {

    private final EmailService emailService;
    
    // Lưu trữ thông tin xác thực: token -> UserVerification
    private final Map<String, UserVerification> verificationStorage = new ConcurrentHashMap<>();
    
    // Thời gian hết hạn token (24 giờ)
    private static final long EXPIRATION_HOURS = 24;

    /**
     * Tạo token xác thực cho user và gửi email
     * 
     * @param registrationDto thông tin đăng ký
     * @return token xác thực đã tạo
     */
    public String sendVerificationEmail(UserRegistrationDto registrationDto) {
        // Tạo token mới
        String token = UUID.randomUUID().toString();
        
        // Lưu thông tin xác thực
        UserVerification verification = new UserVerification(
                registrationDto,
                LocalDateTime.now().plusHours(EXPIRATION_HOURS)
        );
        
        verificationStorage.put(token, verification);
        
        // Gửi email xác nhận
        emailService.sendRegistrationConfirmationEmail(
                registrationDto.getEmail(),
                registrationDto.getName(),
                token
        );
        
        return token;
    }
    
    /**
     * Kiểm tra token có hợp lệ không
     * 
     * @param token token cần kiểm tra
     * @return true nếu token hợp lệ và chưa hết hạn
     */
    public boolean isTokenValid(String token) {
        UserVerification verification = verificationStorage.get(token);
        
        if (verification == null) {
            return false;
        }
        
        // Kiểm tra token đã hết hạn chưa
        return !verification.isExpired();
    }
    
    /**
     * Lấy thông tin đăng ký từ token
     * 
     * @param token token cần lấy thông tin
     * @return thông tin đăng ký nếu token hợp lệ
     */
    public UserRegistrationDto getRegistrationData(String token) {
        UserVerification verification = verificationStorage.get(token);
        
        if (verification == null || verification.isExpired()) {
            return null;
        }
        
        return verification.getRegistrationData();
    }
    
    /**
     * Xác nhận email đã được xác thực và xóa token
     * 
     * @param token token cần xác nhận
     * @return true nếu xác nhận thành công
     */
    public boolean confirmVerification(String token) {
        UserVerification verification = verificationStorage.get(token);
        
        if (verification == null || verification.isExpired()) {
            return false;
        }
        
        // Xóa token sau khi đã xác nhận
        verificationStorage.remove(token);
        
        // Gửi email thông báo xác thực thành công
        emailService.sendRegistrationSuccessEmail(
                verification.getRegistrationData().getEmail(),
                verification.getRegistrationData().getName()
        );
        
        return true;
    }
    
    /**
     * Lập lịch dọn dẹp các token hết hạn (chạy mỗi giờ)
     */
    @Scheduled(fixedRate = 3600000) // Mỗi giờ
    public void cleanupExpiredTokens() {
        verificationStorage.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
    
    /**
     * Lớp lưu trữ thông tin xác thực
     */
    private static class UserVerification {
        private final UserRegistrationDto registrationData;
        private final LocalDateTime expiryDate;
        
        public UserVerification(UserRegistrationDto registrationData, LocalDateTime expiryDate) {
            this.registrationData = registrationData;
            this.expiryDate = expiryDate;
        }
        
        public UserRegistrationDto getRegistrationData() {
            return registrationData;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryDate);
        }
    }
} 