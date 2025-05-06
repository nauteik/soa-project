package com.example.backend.dto;

import com.example.backend.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderDTO {
    private Long shippingAddressId;
    private PaymentMethod paymentMethod;
    private String notes;
    private List<Long> cartItemIds; // Danh sách các cart item được chọn để thanh toán
} 