package com.example.backend.repository;

import com.example.backend.model.Order;
import com.example.backend.model.OrderItem;
import com.example.backend.model.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    /**
     * Tìm tất cả OrderItem theo Order
     * @param order Order cần tìm
     * @return Danh sách OrderItem
     */
    List<OrderItem> findByOrder(Order order);
    
    /**
     * Tìm tất cả OrderItem theo OrderId
     * @param orderId ID của Order cần tìm
     * @return Danh sách OrderItem
     */
    List<OrderItem> findByOrderId(Long orderId);
    
    /**
     * Tìm tất cả OrderItem theo trạng thái
     * @param status Trạng thái cần tìm
     * @return Danh sách OrderItem
     */
    List<OrderItem> findByStatus(OrderItemStatus status);
    
    /**
     * Đếm số lượng OrderItem theo OrderId
     * @param orderId ID của Order cần đếm
     * @return Số lượng OrderItem
     */
    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.order.id = ?1")
    long countByOrderId(Long orderId);
    
    /**
     * Xóa tất cả OrderItem theo OrderId
     * @param orderId ID của Order cần xóa
     */
    void deleteByOrderId(Long orderId);
} 