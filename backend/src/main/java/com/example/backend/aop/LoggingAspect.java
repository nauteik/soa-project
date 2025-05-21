package com.example.backend.aop;

import com.example.backend.service.LogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Aspect
@Component
@RequiredArgsConstructor
public class LoggingAspect {

    private final LogService logService;

    /**
     * Pointcut cho các hoạt động thay đổi dữ liệu trong API controller
     */
    @Pointcut("within(com.example.backend.controller..*) && (" +
             "execution(* com.example.backend.controller..*.add*(..)) || " +
             "execution(* com.example.backend.controller..*.create*(..)) || " +
             "execution(* com.example.backend.controller..*.update*(..)) || " +
             "execution(* com.example.backend.controller..*.save*(..)) || " +
             "execution(* com.example.backend.controller..*.delete*(..)) || " +
             "execution(* com.example.backend.controller..*.remove*(..)) || " +
             "execution(* com.example.backend.controller..*.upload*(..)) || " +
             "@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
             "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
             "@annotation(org.springframework.web.bind.annotation.DeleteMapping))")
    public void modifyingApiPointcut() {
    }
    
    /**
     * Pointcut cho các service xử lý business logic
     */
    @Pointcut("within(com.example.backend.service.impl..*)")
    public void servicePointcut() {
    }
    
    /**
     * Pointcut cho các hoạt động quan trọng cần log
     */
    @Pointcut("execution(* com.example.backend.service.impl.*ServiceImpl.create*(..)) || " +
              "execution(* com.example.backend.service.impl.*ServiceImpl.update*(..)) || " +
              "execution(* com.example.backend.service.impl.*ServiceImpl.delete*(..)) || " +
              "execution(* com.example.backend.service.impl.*ServiceImpl.remove*(..)) || " +
              "execution(* com.example.backend.service.impl.*ServiceImpl.save*(..)) || " +
              "execution(* com.example.backend.service.impl.AuthServiceImpl.login(..)) || " +
              "execution(* com.example.backend.service.impl.AuthServiceImpl.register*(..))")
    public void importantOperationsPointcut() {
    }

    /**
     * Log các cuộc gọi API controller liên quan đến thay đổi dữ liệu và thời gian thực thi
     */
    @Around("modifyingApiPointcut()")
    public Object logModifyingApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        String username = getUsername();
        String parameters = getParameters(joinPoint);
        
        logService.info(String.format("API Modify: %s | User: %s | Params: %s", methodName, username, parameters));
        
        long startTime = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long executionTime = System.currentTimeMillis() - startTime;
        
        logService.info(String.format("API Modify Completed: %s | Time: %dms", methodName, executionTime));
        
        return result;
    }
    
    /**
     * Log các hoạt động quan trọng
     */
    @Around("importantOperationsPointcut()")
    public Object logImportantOperations(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        String username = getUsername();
        
        logService.info(String.format("Important Operation: %s | User: %s", methodName, username));
        
        Object result = joinPoint.proceed();
        
        // Log chi tiết hơn cho các hoạt động cụ thể
        if (methodName.contains("login")) {
            logService.info("User logged in: " + username);
        } else if (methodName.contains("register")) {
            String email = Arrays.stream(joinPoint.getArgs())
                    .findFirst()
                    .map(obj -> obj.toString())
                    .orElse("unknown");
            logService.info("New user registration: " + email);
        }
        
        return result;
    }
    
    /**
     * Log các ngoại lệ từ service
     */
    @AfterThrowing(pointcut = "servicePointcut()", throwing = "e")
    public void logServiceException(JoinPoint joinPoint, Exception e) {
        String methodName = joinPoint.getSignature().toShortString();
        String username = getUsername();
        
        logService.error(String.format("Exception in %s | User: %s | Exception: %s", 
                methodName, username, e.getMessage()), e);
    }
    
    /**
     * Lấy tên người dùng hiện tại từ authentication
     */
    private String getUsername() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                return authentication.getName();
            }
        } catch (Exception e) {
            // Bỏ qua nếu không thể lấy được thông tin xác thực
        }
        return "anonymous";
    }
    
    /**
     * Chuyển đổi parameters thành string để log
     */
    private String getParameters(JoinPoint joinPoint) {
        try {
            return Arrays.stream(joinPoint.getArgs())
                    .map(arg -> {
                        if (arg == null) {
                            return "null";
                        } else if (arg instanceof byte[] || arg instanceof Byte[] || 
                                  arg.toString().length() > 100) {
                            // Tránh log dữ liệu lớn
                            return "[data]";
                        } else {
                            return arg.toString();
                        }
                    })
                    .limit(5) // Giới hạn số lượng parameter để log
                    .collect(Collectors.joining(", "));
        } catch (Exception e) {
            return "[Error getting parameters]";
        }
    }
} 