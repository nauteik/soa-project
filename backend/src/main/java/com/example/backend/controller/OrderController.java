package com.example.backend.controller;

import com.example.backend.dto.CreateOrderDTO;
import com.example.backend.dto.OrderResponseDTO;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.service.OrderService;
import com.example.backend.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    
    /**
     * Tạo đơn hàng mới
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderDTO createOrderDTO) {
        Long userId = SecurityUtils.getCurrentUserId();
        OrderResponseDTO order = orderService.createOrder(userId, createOrderDTO);
        
        // Trả về response đơn giản hơn
        Map<String, Object> response = new HashMap<>();
        response.put("orderNumber", order.getOrderNumber());
        response.put("success", true);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Lấy thông tin chi tiết đơn hàng bằng ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long orderId) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            OrderResponseDTO order = orderService.getOrderById(userId, orderId);
            return ResponseEntity.ok(order);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lấy thông tin chi tiết đơn hàng bằng orderNumber
     */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderResponseDTO> getOrderByNumber(@PathVariable String orderNumber) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            OrderResponseDTO order = orderService.getOrderByNumber(userId, orderNumber);
            return ResponseEntity.ok(order);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lấy danh sách đơn hàng của người dùng
     */
    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getUserOrders() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<OrderResponseDTO> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * Hủy đơn hàng bằng ID
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponseDTO> cancelOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false) String reason) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            OrderResponseDTO order = orderService.cancelOrder(userId, orderId, reason);
            return ResponseEntity.ok(order);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Hủy đơn hàng bằng orderNumber
     */
    @PostMapping("/number/{orderNumber}/cancel")
    public ResponseEntity<OrderResponseDTO> cancelOrderByNumber(
            @PathVariable String orderNumber,
            @RequestParam(required = false) String reason) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            OrderResponseDTO order = orderService.cancelOrderByNumber(userId, orderNumber, reason);
            return ResponseEntity.ok(order);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
   
} 