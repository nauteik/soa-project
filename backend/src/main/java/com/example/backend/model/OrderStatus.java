package com.example.backend.model;

public enum OrderStatus {
    PENDING("Chờ xác nhận"), 
    CONFIRMED("Đã xác nhận"),
    PROCESSING("Đang xử lý"),
    SHIPPING("Đang giao hàng"),
    DELIVERED("Đã giao hàng"),
    COMPLETED("Hoàn thành"),
    CANCELED("Đã hủy"),
    RETURNED("Đã trả hàng"),
    FAILED_DELIVERY("Giao hàng thất bại");
    
    private final String displayName;
    
    OrderStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
} 