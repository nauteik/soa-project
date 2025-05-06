package com.example.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Class để đại diện cho các lỗi API trả về
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiError {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private String path;
    private Map<String, String> errors;
} 