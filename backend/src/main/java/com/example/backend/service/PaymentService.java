package com.example.backend.service;

import com.example.backend.dto.PaymentResponseDTO;
import com.example.backend.model.Order;
import com.example.backend.model.PaymentMethod;

import java.util.Map;

public interface PaymentService {
    
    /**
     * Tạo yêu cầu thanh toán cho đơn hàng
     * 
     * @param order Đơn hàng cần thanh toán
     * @param paymentMethod Phương thức thanh toán
     * @return Thông tin thanh toán (URL, mã giao dịch,...)
     */
    PaymentResponseDTO createPayment(Order order, PaymentMethod paymentMethod);
    
    /**
     * Kiểm tra trạng thái thanh toán của đơn hàng
     * 
     * @param orderId ID của đơn hàng
     * @param transactionId ID giao dịch (nếu có)
     * @return true nếu đã thanh toán thành công
     */
    boolean checkPaymentStatus(String orderId, String transactionId);
    
    /**
     * Xử lý callback từ cổng thanh toán
     * 
     * @param params Các tham số từ cổng thanh toán
     * @return true nếu xử lý thành công
     */
    boolean handleCallback(Map<String, String> params);
} 