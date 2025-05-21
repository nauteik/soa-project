package com.example.backend.service.impl;

import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailService emailService;
    
    // Lưu trữ thông tin xác thực: token -> UserVerification
    private final Map<String, UserVerification> verificationStorage = new ConcurrentHashMap<>();
    
    // Lưu trữ các token đã được sử dụng thành công: token -> thời gian sử dụng
    private final Map<String, LocalDateTime> usedTokensStorage = new ConcurrentHashMap<>();
    
    // Thời gian hết hạn token (24 giờ)
    private static final long EXPIRATION_HOURS = 24;
    
    // Thời gian lưu token đã sử dụng (1 giờ)
    private static final long USED_TOKEN_RETENTION_HOURS = 1;

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
        log.info("Đã tạo token xác thực cho email: {}, token sẽ hết hạn vào: {}", 
            registrationDto.getEmail(), verification.getExpirationDate());
        
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
        log.info("Kiểm tra token: {}", token);
        log.debug("Danh sách token hiện có: {}", verificationStorage.keySet());
        
        // Kiểm tra xem token đã được sử dụng thành công chưa
        if (isTokenUsed(token)) {
            log.info("Token đã được sử dụng thành công trước đó: {}", token);
            return true;
        }
        
        UserVerification verification = verificationStorage.get(token);
        
        if (verification == null) {
            log.warn("Token không tồn tại trong hệ thống: {}", token);
            return false;
        }
        
        // Kiểm tra token đã hết hạn chưa
        boolean isValid = !verification.isExpired();
        if (!isValid) {
            log.warn("Token đã hết hạn: {}, hết hạn vào: {}", token, verification.getExpirationDate());
        } else {
            log.info("Token hợp lệ: {}, email: {}", token, verification.getRegistrationData().getEmail());
        }
        
        return isValid;
    }
    
    /**
     * Kiểm tra xem token đã được sử dụng thành công chưa
     * 
     * @param token token cần kiểm tra
     * @return true nếu token đã được sử dụng
     */
    public boolean isTokenUsed(String token) {
        return usedTokensStorage.containsKey(token);
    }
    
    /**
     * Lấy thông tin đăng ký từ token
     * 
     * @param token token cần lấy thông tin
     * @return thông tin đăng ký nếu token hợp lệ
     */
    public UserRegistrationDto getRegistrationData(String token) {
        // Nếu token đã được sử dụng thành công trước đó,
        // không cần lấy thông tin đăng ký nữa vì tài khoản đã được tạo
        if (isTokenUsed(token)) {
            log.info("Token đã được sử dụng thành công trước đó, không cần lấy thông tin đăng ký: {}", token);
            return null;
        }
        
        UserVerification verification = verificationStorage.get(token);
        
        if (verification == null) {
            log.warn("Không tìm thấy dữ liệu đăng ký cho token: {}", token);
            return null;
        }
        
        if (verification.isExpired()) {
            log.warn("Không thể lấy dữ liệu đăng ký vì token đã hết hạn: {}, hết hạn vào: {}", 
                token, verification.getExpirationDate());
            return null;
        }
        
        log.info("Lấy dữ liệu đăng ký thành công cho token: {}, email: {}", 
            token, verification.getRegistrationData().getEmail());
        return verification.getRegistrationData();
    }
    
    /**
     * Xác nhận email đã được xác thực và xóa token
     * 
     * @param token token cần xác nhận
     * @return true nếu xác nhận thành công
     */
    public boolean confirmVerification(String token) {
        // Nếu token đã được sử dụng thành công trước đó, trả về true luôn
        if (isTokenUsed(token)) {
            log.info("Token đã được sử dụng thành công trước đó: {}", token);
            return true;
        }
        
        UserVerification verification = verificationStorage.get(token);
        
        if (verification == null) {
            log.warn("Không thể xác nhận, token không tồn tại: {}", token);
            return false;
        }
        
        if (verification.isExpired()) {
            log.warn("Không thể xác nhận, token đã hết hạn: {}, hết hạn vào: {}", 
                token, verification.getExpirationDate());
            return false;
        }
        
        // Đánh dấu token đã được sử dụng thành công
        usedTokensStorage.put(token, LocalDateTime.now());
        
        // Xóa token sau khi đã xác nhận
        verificationStorage.remove(token);
        log.info("Xác nhận email thành công và đã xóa token: {}, email: {}", 
            token, verification.getRegistrationData().getEmail());
        
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
        // Dọn dẹp token xác thực chưa sử dụng
        int sizeBefore = verificationStorage.size();
        verificationStorage.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().isExpired();
            if (expired) {
                log.info("Đã xóa token hết hạn: {}, email: {}, hết hạn vào: {}", 
                    entry.getKey(), 
                    entry.getValue().getRegistrationData().getEmail(),
                    entry.getValue().getExpirationDate());
            }
            return expired;
        });
        int sizeAfter = verificationStorage.size();
        log.info("Dọn dẹp token hết hạn: đã xóa {} token", sizeBefore - sizeAfter);
        
        // Dọn dẹp token đã sử dụng quá thời gian lưu trữ
        int usedSizeBefore = usedTokensStorage.size();
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(USED_TOKEN_RETENTION_HOURS);
        usedTokensStorage.entrySet().removeIf(entry -> {
            boolean shouldRemove = entry.getValue().isBefore(cutoffTime);
            if (shouldRemove) {
                log.info("Đã xóa token đã sử dụng: {}, thời gian sử dụng: {}", entry.getKey(), entry.getValue());
            }
            return shouldRemove;
        });
        int usedSizeAfter = usedTokensStorage.size();
        log.info("Dọn dẹp token đã sử dụng: đã xóa {} token", usedSizeBefore - usedSizeAfter);
    }
    
    /**
     * Kiểm tra số lượng token trong bộ nhớ
     */
    public int getTokenCount() {
        return verificationStorage.size();
    }
    
    /**
     * Debug method: In danh sách tất cả các token hiện tại
     */
    public void printAllTokens() {
        log.info("==== DANH SÁCH TẤT CẢ TOKEN TRONG HỆ THỐNG ({} tokens) ====", verificationStorage.size());
        verificationStorage.forEach((token, data) -> {
            log.info("Token: {}, Email: {}, Hết hạn: {}, Đã hết hạn: {}", 
                token, 
                data.getRegistrationData().getEmail(),
                data.getExpirationDate(),
                data.isExpired());
        });
        
        log.info("==== DANH SÁCH TẤT CẢ TOKEN ĐÃ SỬ DỤNG ({} tokens) ====", usedTokensStorage.size());
        usedTokensStorage.forEach((token, time) -> {
            log.info("Token: {}, Thời gian sử dụng: {}", token, time);
        });
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
        
        public LocalDateTime getExpirationDate() {
            return expiryDate;
        }
    }
} 