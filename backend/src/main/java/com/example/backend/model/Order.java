package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String orderNumber;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
    
    @ManyToOne
    @JoinColumn(name = "shipping_address_id")
    private UserAddress shippingAddress;
    
    @Column(nullable = false)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;
    
    @Column
    private String paymentTransactionId;
    
    @Column
    private String notes;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.orderNumber = generateOrderNumber();
        
        // Thêm trạng thái ban đầu vào lịch sử
        OrderStatusHistory initialStatus = new OrderStatusHistory();
        initialStatus.setOrder(this);
        initialStatus.setStatus(this.status);
        initialStatus.setCreatedAt(LocalDateTime.now());
        initialStatus.setNotes("Đơn hàng được tạo");
        this.statusHistory.add(initialStatus);
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    private String generateOrderNumber() {
        LocalDateTime now = LocalDateTime.now();
        // Thêm số ngẫu nhiên 6 chữ số để tránh trùng lặp khi nhiều người dùng tạo cùng lúc
        String randomNum = String.format("%03d", new Random().nextInt(999));
        return "OD" + now.format(DateTimeFormatter.ofPattern("yyMMddHHmmss")) + randomNum;
    }
    
    // Phương thức để cập nhật trạng thái đơn hàng và lưu lịch sử
    public void updateStatus(OrderStatus newStatus, String notes) {
        this.status = newStatus;
        
        OrderStatusHistory statusChange = new OrderStatusHistory();
        statusChange.setOrder(this);
        statusChange.setStatus(newStatus);
        statusChange.setCreatedAt(LocalDateTime.now());
        statusChange.setNotes(notes);
        
        this.statusHistory.add(statusChange);
    }
    
    // Phương thức để cập nhật trạng thái thanh toán
    public void updatePaymentStatus(PaymentStatus newStatus, String transactionId) {
        this.paymentStatus = newStatus;
        if (transactionId != null) {
            this.paymentTransactionId = transactionId;
        }
    }
} 