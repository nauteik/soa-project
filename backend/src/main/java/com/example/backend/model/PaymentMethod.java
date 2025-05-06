package com.example.backend.model;

public enum PaymentMethod {
    COD("Thanh toán khi nhận hàng"),
    BANK_TRANSFER("Chuyển khoản ngân hàng"),
    CREDIT_CARD("Thẻ tín dụng"),
    E_WALLET("Ví điện tử"),
    VNPAY("Thanh toán qua VNPAY"),
    MOMO("Thanh toán qua MoMo");
    
    private final String displayName;
    
    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
} 