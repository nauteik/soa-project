package com.example.backend.dto;

import com.example.backend.model.OrderStatus;
import com.example.backend.model.PaymentMethod;
import com.example.backend.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDTO {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userName;
    private List<OrderItemDTO> items;
    private AddressDto shippingAddress;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String statusDisplayName;
    private PaymentMethod paymentMethod;
    private String paymentMethodDisplayName;
    private PaymentStatus paymentStatus;
    private String paymentStatusDisplayName;
    private String paymentTransactionId;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderStatusHistoryDTO> statusHistory;
    
    // Thêm thông tin về thanh toán trực tuyến khi cần thiết
    private String paymentUrl; // URL chuyển hướng đến trang thanh toán (nếu thanh toán online)
} 