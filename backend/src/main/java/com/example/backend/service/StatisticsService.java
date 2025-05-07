package com.example.backend.service;

import java.time.LocalDate;
import java.util.Map;

/**
 * Service cung cấp các phương thức thống kê dữ liệu cho admin dashboard và báo cáo
 */
public interface StatisticsService {
    
    /**
     * Lấy dữ liệu thống kê tổng quan cho dashboard
     * Bao gồm: doanh thu, số đơn hàng, số người dùng, số sản phẩm, v.v
     * 
     * @return Map chứa các thông tin thống kê
     */
    Map<String, Object> getDashboardStatistics();
    
    /**
     * Lấy thống kê doanh thu theo khoảng thời gian
     * 
     * @param startDate Ngày bắt đầu (có thể null để lấy từ đầu)
     * @param endDate Ngày kết thúc (có thể null để lấy đến hiện tại)
     * @return Map chứa các thông tin thống kê doanh thu
     */
    Map<String, Object> getRevenueStatistics(LocalDate startDate, LocalDate endDate);
    
    /**
     * Lấy thống kê sản phẩm
     * Bao gồm: sản phẩm bán chạy, sản phẩm tồn kho, sản phẩm theo danh mục, v.v
     * 
     * @return Map chứa các thông tin thống kê sản phẩm
     */
    Map<String, Object> getProductStatistics();
    
    /**
     * Lấy thống kê người dùng
     * Bao gồm: người dùng mới, người dùng hoạt động, người dùng theo vai trò, v.v
     * 
     * @param startDate Ngày bắt đầu (có thể null để lấy từ đầu)
     * @param endDate Ngày kết thúc (có thể null để lấy đến hiện tại)
     * @return Map chứa các thông tin thống kê người dùng
     */
    Map<String, Object> getUserStatistics(LocalDate startDate, LocalDate endDate);
    
    /**
     * Lấy thống kê đơn hàng
     * Bao gồm: số đơn hàng theo trạng thái, đơn hàng theo phương thức thanh toán, v.v
     * 
     * @param startDate Ngày bắt đầu (có thể null để lấy từ đầu)
     * @param endDate Ngày kết thúc (có thể null để lấy đến hiện tại)
     * @return Map chứa các thông tin thống kê đơn hàng
     */
    Map<String, Object> getOrderStatistics(LocalDate startDate, LocalDate endDate);
} 