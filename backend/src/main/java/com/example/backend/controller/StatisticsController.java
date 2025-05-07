package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('MANAGER', 'STAFF')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * Endpoint để lấy dữ liệu tổng quan cho dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStatistics() {
        Map<String, Object> statistics = statisticsService.getDashboardStatistics();
        return ResponseEntity.ok(new ApiResponse<>(true, "Dữ liệu thống kê dashboard", statistics));
    }

    /**
     * Endpoint để lấy thống kê doanh thu theo khoảng thời gian
     */
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> statistics = statisticsService.getRevenueStatistics(startDate, endDate);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dữ liệu thống kê doanh thu", statistics));
    }

    /**
     * Endpoint để lấy thống kê sản phẩm (sản phẩm bán chạy, tồn kho, v.v)
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductStatistics() {
        Map<String, Object> statistics = statisticsService.getProductStatistics();
        return ResponseEntity.ok(new ApiResponse<>(true, "Dữ liệu thống kê sản phẩm", statistics));
    }

    /**
     * Endpoint để lấy thống kê người dùng (người dùng mới, hoạt động, v.v)
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> statistics = statisticsService.getUserStatistics(startDate, endDate);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dữ liệu thống kê người dùng", statistics));
    }

    /**
     * Endpoint để lấy thống kê đơn hàng (số đơn hàng theo trạng thái, v.v)
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> statistics = statisticsService.getOrderStatistics(startDate, endDate);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dữ liệu thống kê đơn hàng", statistics));
    }
} 