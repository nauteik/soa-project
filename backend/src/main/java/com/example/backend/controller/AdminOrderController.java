package com.example.backend.controller;

import com.example.backend.dto.OrderResponseDTO;
import com.example.backend.model.OrderStatus;
import com.example.backend.model.PaymentStatus;
import com.example.backend.model.OrderItemStatus;
import com.example.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('MANAGER', 'STAFF')")
public class AdminOrderController {

    private final OrderService orderService;
    
    /**
     * Lấy tất cả đơn hàng trong hệ thống (không phân trang)
     */
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        // Trả về tất cả đơn hàng, không phân trang - việc phân trang được xử lý ở frontend
        List<OrderResponseDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }
    
    /**
     * Lấy chi tiết đơn hàng theo ID
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long orderId) {
        OrderResponseDTO order = orderService.getOrderByIdForAdmin(orderId);
        return ResponseEntity.ok(order);
    }
    
    /**
     * Lấy tất cả đơn hàng của một người dùng
     */
    @GetMapping("/users/{userId}/orders")
    public ResponseEntity<List<OrderResponseDTO>> getUserOrders(@PathVariable Long userId) {
        List<OrderResponseDTO> orders = orderService.getUserOrdersForAdmin(userId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * Cập nhật trạng thái đơn hàng
     */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status,
            @RequestParam(required = false) String notes) {
        
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status);
            OrderResponseDTO order = orderService.updateOrderStatus(orderId, orderStatus, notes);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
    
    /**
     * Cập nhật trạng thái thanh toán
     */
    @PutMapping("/orders/{orderId}/payment-status")
    public ResponseEntity<OrderResponseDTO> updatePaymentStatus(
            @PathVariable Long orderId,
            @RequestParam String status,
            @RequestParam(required = false) String transactionId) {
        
        try {
            PaymentStatus paymentStatus = PaymentStatus.valueOf(status);
            OrderResponseDTO order = orderService.updatePaymentStatus(orderId, paymentStatus, transactionId);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
    
    /**
     * Cập nhật trạng thái của một mục đơn hàng
     */
    @PutMapping("/orders/{orderId}/items/{itemId}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderItemStatus(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestParam String status) {
        
        try {
            OrderItemStatus itemStatus = OrderItemStatus.valueOf(status);
            OrderResponseDTO order = orderService.updateOrderItemStatus(orderId, itemId, itemStatus);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
} 