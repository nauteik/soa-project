package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.service.OrderService;
import com.example.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final OrderService orderService;
    private final PaymentService paymentService;
    
    /**
     * Xử lý callback từ VnPay
     */
    @GetMapping("/callback")
    public ResponseEntity<String> handleVnPayCallback(@RequestParam Map<String, String> params) {
        // Kiểm tra tính hợp lệ của callback
        boolean isValidCallback = paymentService.handleCallback(params);
        
        String orderId = params.get("vnp_TxnRef");
        String transactionId = params.get("vnp_TransactionNo");
        
        if (isValidCallback) {
            // Cập nhật trạng thái đơn hàng
            orderService.handlePaymentCallback(orderId, transactionId, true);
            
            // Chuyển hướng đến trang thành công
            return ResponseEntity.ok("<html><body><h1>Thanh toán thành công</h1>" +
                    "<p>Đơn hàng " + orderId + " đã được thanh toán thành công</p>" +
                    "<p>Mã giao dịch: " + transactionId + "</p>" +
                    "<a href='/orders'>Xem đơn hàng của tôi</a></body></html>");
        } else {
            // Cập nhật trạng thái đơn hàng thất bại
            orderService.handlePaymentCallback(orderId, transactionId, false);
            
            // Chuyển hướng đến trang thất bại
            return ResponseEntity.ok("<html><body><h1>Thanh toán thất bại</h1>" +
                    "<p>Thanh toán cho đơn hàng " + orderId + " không thành công</p>" +
                    "<a href='/orders'>Xem đơn hàng của tôi</a></body></html>");
        }
    }
    
    /**
     * Lấy thông tin trạng thái thanh toán của đơn hàng
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatus(@PathVariable String orderId) {
        boolean isPaid = paymentService.checkPaymentStatus(orderId, null);
        
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", orderId);
        data.put("paid", isPaid);
        
        ApiResponse<Map<String, Object>> response = new ApiResponse<>(true, "Trạng thái thanh toán", data);
        
        return ResponseEntity.ok(response);
    }
} 