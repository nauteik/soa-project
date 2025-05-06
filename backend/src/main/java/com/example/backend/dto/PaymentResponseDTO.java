package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
    private String orderId;
    private String transactionId;
    private String paymentUrl;
    private boolean success;
    private String message;
    private long amount;
    private String currency;
    private String description;
    private long createdAt;
    private String paymentMethod;
} 