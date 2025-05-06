package com.example.backend.dto;

import com.example.backend.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryDTO {
    private Long id;
    private OrderStatus status;
    private String statusDisplayName;
    private LocalDateTime createdAt;
    private String notes;
} 