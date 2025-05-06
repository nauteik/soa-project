package com.example.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /**
     * Xử lý lỗi validation
     */
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatus status,
            WebRequest request) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Lỗi dữ liệu không hợp lệ")
                .errors(errors)
                .path(request.getDescription(false))
                .build();
        
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Xử lý lỗi ResourceNotFoundException
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage())
                .path(request.getDescription(false))
                .build();
        
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }
    
    /**
     * Xử lý lỗi BadRequestException
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequestException(
            BadRequestException ex, WebRequest request) {
        
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .message(ex.getMessage())
                .path(request.getDescription(false))
                .build();
        
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Xử lý lỗi BadCredentialsException
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .message(ex.getMessage())
                .path(request.getDescription(false))
                .build();
        
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * Xử lý lỗi AuthenticationException
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(
            AuthenticationException ex, WebRequest request) {
        
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .message(ex.getMessage())
                .path(request.getDescription(false))
                .build();
        
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * Xử lý tất cả các exception khác
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGlobalException(
            Exception ex, WebRequest request) {
        
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("Đã xảy ra lỗi không mong muốn")
                .path(request.getDescription(false))
                .build();
        
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorResponse {
        private int status;
        private String message;
        private LocalDateTime timestamp;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationErrorResponse {
        private int status;
        private String message;
        private LocalDateTime timestamp;
        private Map<String, String> errors;
    }
}