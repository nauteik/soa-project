package com.example.backend.service.impl;

import com.example.backend.dto.PaymentResponseDTO;
import com.example.backend.model.Order;
import com.example.backend.model.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements com.example.backend.service.PaymentService {

    @Override
    public PaymentResponseDTO createPayment(Order order, PaymentMethod paymentMethod) {
        // Đơn giản hóa: tất cả các phương thức thanh toán đều thành công ngay lập tức
        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setOrderId(order.getOrderNumber());
        response.setSuccess(true);
        response.setAmount(order.getTotalAmount().longValue());
        response.setCurrency("VND");
        response.setDescription("Thanh toán đơn hàng: " + order.getOrderNumber());
        response.setCreatedAt(System.currentTimeMillis());
        response.setPaymentMethod(paymentMethod.getDisplayName());
        response.setTransactionId("PAYMENT_" + System.currentTimeMillis());
        
        return response;
    }
    
    @Override
    public boolean checkPaymentStatus(String orderId, String transactionId) {
        // Luôn trả về thành công
        return true;
    }
    
    @Override
    public boolean handleCallback(Map<String, String> params) {
        // Luôn trả về thành công
        return true;
    }
} 