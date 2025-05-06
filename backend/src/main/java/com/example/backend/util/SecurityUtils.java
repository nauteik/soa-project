package com.example.backend.util;

import com.example.backend.exception.AuthenticationException;
import com.example.backend.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static User getUserFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationException("Người dùng chưa đăng nhập");
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        
        throw new AuthenticationException("Không thể xác thực người dùng");
    }
    
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return getUserFromAuthentication(authentication);
    }

    /**
     * Lấy ID của người dùng hiện tại đang đăng nhập
     * 
     * @return ID của người dùng, hoặc null nếu chưa đăng nhập
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                return ((com.example.backend.model.User) principal).getId();
            }
        }
        return null;
    }
    
    /**
     * Kiểm tra xem người dùng hiện tại có phải là Admin không
     * 
     * @return true nếu người dùng có quyền ADMIN, ngược lại trả về false
     */
    public static boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ADMIN"));
        }
        return false;
    }
    
    /**
     * Kiểm tra xem người dùng hiện tại có quyền truy cập vào tài nguyên của userId không
     * 
     * @param userId ID của người dùng cần kiểm tra
     * @return true nếu người dùng hiện tại có ID trùng với userId hoặc là Admin
     */
    public static boolean hasAccessToUser(Long userId) {
        if (isAdmin()) return true;
        
        Long currentUserId = getCurrentUserId();
        return currentUserId != null && currentUserId.equals(userId);
    }
} 