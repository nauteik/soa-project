package com.example.backend.model;

public enum OrderItemStatus {
    PENDING("Chờ xác nhận"),
    CONFIRMED("Đã xác nhận"),
    PROCESSING("Đang xử lý"),
    SHIPPING("Đang giao hàng"),
    DELIVERED("Đã giao hàng"),
    RETURNED("Đã trả hàng"),
    CANCELED("Đã hủy");
    
    private final String displayName;
    
    OrderItemStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
} 