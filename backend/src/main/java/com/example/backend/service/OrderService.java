package com.example.backend.service;

import com.example.backend.dto.CreateOrderDTO;
import com.example.backend.dto.OrderResponseDTO;
import com.example.backend.model.OrderStatus;
import com.example.backend.model.PaymentStatus;
import com.example.backend.model.OrderItemStatus;

import java.util.List;

public interface OrderService {
    
    /**
     * Tạo đơn hàng mới từ các sản phẩm đã chọn trong giỏ hàng
     * 
     * @param userId ID của người dùng
     * @param createOrderDTO Thông tin để tạo đơn hàng
     * @return Thông tin đơn hàng đã tạo
     */
    OrderResponseDTO createOrder(Long userId, CreateOrderDTO createOrderDTO);
    
    /**
     * Lấy thông tin chi tiết đơn hàng
     * 
     * @param userId ID của người dùng
     * @param orderId ID của đơn hàng
     * @return Thông tin chi tiết đơn hàng
     */
    OrderResponseDTO getOrderById(Long userId, Long orderId);
    
    /**
     * Lấy thông tin chi tiết đơn hàng bằng orderNumber
     * 
     * @param userId ID của người dùng
     * @param orderNumber Mã đơn hàng
     * @return Thông tin chi tiết đơn hàng
     */
    OrderResponseDTO getOrderByNumber(Long userId, String orderNumber);
    
    /**
     * Lấy danh sách đơn hàng của người dùng
     * 
     * @param userId ID của người dùng
     * @return Danh sách đơn hàng
     */
    List<OrderResponseDTO> getUserOrders(Long userId);
    
    /**
     * Hủy đơn hàng
     * 
     * @param userId ID của người dùng
     * @param orderId ID của đơn hàng
     * @return Thông tin đơn hàng sau khi hủy
     */
    OrderResponseDTO cancelOrder(Long userId, Long orderId, String reason);
    
    /**
     * Hủy đơn hàng bằng orderNumber
     * 
     * @param userId ID của người dùng
     * @param orderNumber Mã đơn hàng
     * @return Thông tin đơn hàng sau khi hủy
     */
    OrderResponseDTO cancelOrderByNumber(Long userId, String orderNumber, String reason);
    
    /**
     * Cập nhật trạng thái đơn hàng (dành cho Admin)
     * 
     * @param orderId ID của đơn hàng
     * @param status Trạng thái mới
     * @param notes Ghi chú cho việc thay đổi trạng thái
     * @return Thông tin đơn hàng sau khi cập nhật
     */
    OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status, String notes);
    
    /**
     * Cập nhật trạng thái thanh toán của đơn hàng
     * 
     * @param orderId ID của đơn hàng
     * @param status Trạng thái thanh toán mới
     * @param transactionId ID giao dịch (nếu có)
     * @return Thông tin đơn hàng sau khi cập nhật
     */
    OrderResponseDTO updatePaymentStatus(Long orderId, PaymentStatus status, String transactionId);
    
    /**
     * Xử lý callback từ cổng thanh toán
     * 
     * @param paymentData Dữ liệu từ cổng thanh toán
     * @return true nếu xử lý thành công
     */
    boolean handlePaymentCallback(String orderId, String transactionId, boolean success);
    
    /**
     * Cập nhật trạng thái của một mục đơn hàng
     * 
     * @param orderId ID của đơn hàng
     * @param itemId ID của mục đơn hàng
     * @param status Trạng thái mới
     * @return Thông tin đơn hàng sau khi cập nhật
     */
    OrderResponseDTO updateOrderItemStatus(Long orderId, Long itemId, OrderItemStatus status);
    
    // Phương thức cho admin
    List<OrderResponseDTO> getAllOrders();
    OrderResponseDTO getOrderByIdForAdmin(Long orderId);
    List<OrderResponseDTO> getUserOrdersForAdmin(Long userId);
} 