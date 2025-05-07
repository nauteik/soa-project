package com.example.backend.model;

public enum OrderStatus {
    PENDING("Chờ xác nhận"), 
    CONFIRMED("Đã xác nhận"),
    PROCESSING("Đang xử lý"),
    SHIPPING("Đang giao hàng"),
    DELIVERED("Đã giao hàng"),
    PARTIALLY_RETURNED("Trả hàng một phần"),
    FULLY_RETURNED("Trả hàng toàn bộ"),
    CANCELED("Đã hủy");
    
    private final String displayName;
    
    OrderStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
} 