package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGER')")
public class LogController {
    
    private final LogService logService;
    
    /**
     * Lấy danh sách ngày có log
     */
    @GetMapping("/dates")
    public ResponseEntity<ApiResponse<List<String>>> getLogDates(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<LocalDate> logDates = logService.getLogDates(startDate, endDate);
        
        // Chuyển từ LocalDate sang String để dễ xử lý ở frontend
        List<String> dateStrings = logDates.stream()
                .map(date -> date.toString())
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách ngày có log thành công", dateStrings));
    }
    
    /**
     * Lấy nội dung log của một ngày cụ thể
     */
    @GetMapping("/{date}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLogsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        String logContent = logService.getLogsByDate(date);
        
        Map<String, Object> result = new HashMap<>();
        result.put("date", date.toString());
        result.put("content", logContent);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy log thành công", result));
    }
    
    /**
     * Tìm kiếm trong logs
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchLogs(
            @RequestParam String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<LocalDate, List<String>> searchResults = logService.searchLogs(keyword, startDate, endDate);
        
        // Chuyển đổi kết quả tìm kiếm thành định dạng phù hợp cho frontend
        Map<String, List<String>> formattedResults = new HashMap<>();
        searchResults.forEach((date, lines) -> {
            formattedResults.put(date.toString(), lines);
        });
        
        Map<String, Object> result = new HashMap<>();
        result.put("keyword", keyword);
        result.put("startDate", startDate != null ? startDate.toString() : null);
        result.put("endDate", endDate != null ? endDate.toString() : null);
        result.put("results", formattedResults);
        result.put("totalMatches", formattedResults.values().stream().mapToInt(List::size).sum());
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Tìm kiếm thành công", result));
    }
    
    /**
     * Ghi test log
     */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<String>> testLog(@RequestParam String message, @RequestParam String level) {
        // Chỉ sử dụng trong môi trường phát triển
        switch (level.toLowerCase()) {
            case "info":
                logService.info("TEST LOG - INFO: " + message);
                break;
            case "error":
                logService.error("TEST LOG - ERROR: " + message);
                break;
            case "debug":
                logService.debug("TEST LOG - DEBUG: " + message);
                break;
            case "warn":
                logService.warn("TEST LOG - WARN: " + message);
                break;
            default:
                logService.info("TEST LOG - DEFAULT: " + message);
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Ghi log test thành công", "Đã ghi log: " + message));
    }
} 