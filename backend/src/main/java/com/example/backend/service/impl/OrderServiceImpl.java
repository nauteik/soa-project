package com.example.backend.service.impl;

import com.example.backend.dto.*;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.service.OrderService;
import com.example.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final PaymentService paymentService;

    @Override
    @Transactional
    public OrderResponseDTO createOrder(Long userId, CreateOrderDTO createOrderDTO) {
        // Lấy thông tin người dùng
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Lấy địa chỉ giao hàng
        UserAddress shippingAddress = addressRepository.findByIdAndUserId(createOrderDTO.getShippingAddressId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ giao hàng"));

        // Lấy các sản phẩm từ giỏ hàng
        List<CartItem> cartItems = cartItemRepository.findAllByIdInAndUserId(createOrderDTO.getCartItemIds(), userId);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Không có sản phẩm nào được chọn để đặt hàng");
        }

        // Tạo đơn hàng
        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(shippingAddress);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(createOrderDTO.getPaymentMethod());
        order.setNotes(createOrderDTO.getNotes());
        
        // Thiết lập trạng thái thanh toán dựa trên phương thức thanh toán
        if (createOrderDTO.getPaymentMethod() == PaymentMethod.COD) {
            order.setPaymentStatus(PaymentStatus.COD_PENDING);
        } else {
            order.setPaymentStatus(PaymentStatus.PENDING);
        }

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Tạo các mục đơn hàng từ giỏ hàng
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            
            // Kiểm tra số lượng tồn kho
            if (product.getQuantityInStock() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Sản phẩm " + product.getName() + " không đủ số lượng trong kho");
            }
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setPrice(product.getPrice());
            orderItem.setDiscount(product.getDiscount());
            orderItem.setQuantity(cartItem.getQuantity());
            
            // Tính thành tiền cho mỗi sản phẩm (đã áp dụng giảm giá)
            BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                    new BigDecimal(product.getDiscount().toString()).divide(new BigDecimal("100"))
            );
            BigDecimal subtotal = product.getPrice().multiply(discountMultiplier).multiply(new BigDecimal(cartItem.getQuantity()));
            orderItem.setSubtotal(subtotal);
            
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(subtotal);
            
            // Cập nhật số lượng tồn kho và số lượng đã bán
            product.setQuantityInStock(product.getQuantityInStock() - cartItem.getQuantity());
            product.setQuantitySold(product.getQuantitySold() + cartItem.getQuantity());
            productRepository.save(product);
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);
        
        // Lưu đơn hàng vào cơ sở dữ liệu
        Order savedOrder = orderRepository.save(order);
        
        // Xóa các sản phẩm đã đặt hàng khỏi giỏ hàng
        cartItemRepository.deleteAll(cartItems);
        
        // Xử lý thanh toán online nếu cần
        PaymentResponseDTO paymentResponse = null;
        if (createOrderDTO.getPaymentMethod() != PaymentMethod.COD) {
            paymentResponse = paymentService.createPayment(savedOrder, createOrderDTO.getPaymentMethod());
        }

        // Chuyển đổi đơn hàng thành DTO và trả về
        OrderResponseDTO response = convertToOrderResponseDTO(savedOrder);
        
        // Thêm URL thanh toán nếu có
        if (paymentResponse != null && paymentResponse.isSuccess()) {
            response.setPaymentUrl(paymentResponse.getPaymentUrl());
        }
        
        return response;
    }

    @Override
    public OrderResponseDTO getOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        return convertToOrderResponseDTO(order);
    }

    @Override
    public OrderResponseDTO getOrderByNumber(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        return convertToOrderResponseDTO(order);
    }

    @Override
    public List<OrderResponseDTO> getUserOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        return orders.stream()
                .map(this::convertToOrderResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponseDTO cancelOrder(Long userId, Long orderId, String reason) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Chỉ cho phép hủy đơn hàng ở trạng thái PENDING hoặc CONFIRMED
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Không thể hủy đơn hàng ở trạng thái " + order.getStatus());
        }
        
        // Cập nhật trạng thái đơn hàng
        order.updateStatus(OrderStatus.CANCELED, "Đơn hàng bị hủy: " + reason);
        
        // Hoàn trả số lượng sản phẩm vào kho
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setQuantityInStock(product.getQuantityInStock() + item.getQuantity());
            product.setQuantitySold(product.getQuantitySold() - item.getQuantity());
            productRepository.save(product);
        }
        
        Order savedOrder = orderRepository.save(order);
        
        return convertToOrderResponseDTO(savedOrder);
    }
    
    @Override
    @Transactional
    public OrderResponseDTO cancelOrderByNumber(Long userId, String orderNumber, String reason) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Chỉ cho phép hủy đơn hàng ở trạng thái PENDING hoặc CONFIRMED
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Không thể hủy đơn hàng ở trạng thái " + order.getStatus());
        }
        
        // Cập nhật trạng thái đơn hàng
        order.updateStatus(OrderStatus.CANCELED, "Đơn hàng bị hủy: " + reason);
        
        // Hoàn trả số lượng sản phẩm vào kho
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setQuantityInStock(product.getQuantityInStock() + item.getQuantity());
            product.setQuantitySold(product.getQuantitySold() - item.getQuantity());
            productRepository.save(product);
        }
        
        Order savedOrder = orderRepository.save(order);
        
        return convertToOrderResponseDTO(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Cập nhật trạng thái đơn hàng và lưu lịch sử
        order.updateStatus(status, notes);
        
        // Xử lý trạng thái đặc biệt
        if (status == OrderStatus.DELIVERED) {
            // Nếu là COD và đã giao hàng, cập nhật trạng thái thanh toán thành đã thanh toán
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.PAID);
            }
        } else if (status == OrderStatus.COMPLETED) {
            // Đánh dấu đơn hàng hoàn thành
            order.setPaymentStatus(PaymentStatus.PAID);
        } else if (status == OrderStatus.CANCELED) {
            // Hoàn trả số lượng sản phẩm vào kho
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setQuantityInStock(product.getQuantityInStock() + item.getQuantity());
                product.setQuantitySold(product.getQuantitySold() - item.getQuantity());
                productRepository.save(product);
            }
            
            // Nếu đã thanh toán, cập nhật thành trạng thái hoàn tiền
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
        }
        
        Order savedOrder = orderRepository.save(order);
        
        return convertToOrderResponseDTO(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponseDTO updatePaymentStatus(Long orderId, PaymentStatus status, String transactionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Cập nhật trạng thái thanh toán
        order.updatePaymentStatus(status, transactionId);
        
        // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
        if (status == PaymentStatus.PAID && order.getStatus() == OrderStatus.PENDING) {
            order.updateStatus(OrderStatus.CONFIRMED, "Đơn hàng đã được xác nhận sau khi thanh toán thành công");
        }
        
        Order savedOrder = orderRepository.save(order);
        
        return convertToOrderResponseDTO(savedOrder);
    }

    @Override
    @Transactional
    public boolean handlePaymentCallback(String orderId, String transactionId, boolean success) {
        Order order = orderRepository.findByOrderNumber(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        if (success) {
            order.updatePaymentStatus(PaymentStatus.PAID, transactionId);
            
            // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng thành CONFIRMED
            if (order.getStatus() == OrderStatus.PENDING) {
                order.updateStatus(OrderStatus.CONFIRMED, "Đơn hàng đã được xác nhận sau khi thanh toán thành công");
            }
        } else {
            order.updatePaymentStatus(PaymentStatus.FAILED, transactionId);
        }
        
        orderRepository.save(order);
        
        return true;
    }
    
    /**
     * Chuyển đổi từ entity Order sang DTO
     */
    private OrderResponseDTO convertToOrderResponseDTO(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setUserId(order.getUser().getId());
        dto.setUserName(order.getUser().getName());
        
        // Chuyển đổi địa chỉ giao hàng
        if (order.getShippingAddress() != null) {
            dto.setShippingAddress(AddressDto.fromEntity(order.getShippingAddress()));
        }
        
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setStatusDisplayName(order.getStatus().getDisplayName());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentMethodDisplayName(order.getPaymentMethod().getDisplayName());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentStatusDisplayName(order.getPaymentStatus().getDisplayName());
        dto.setPaymentTransactionId(order.getPaymentTransactionId());
        dto.setNotes(order.getNotes());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        
        // Chuyển đổi các mục đơn hàng
        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(item -> {
                    OrderItemDTO itemDTO = new OrderItemDTO();
                    itemDTO.setId(item.getId());
                    itemDTO.setProductId(item.getProduct().getId());
                    itemDTO.setProductName(item.getProductName());
                    
                    // Lấy hình ảnh đầu tiên của sản phẩm (nếu có)
                    if (!item.getProduct().getImages().isEmpty()) {
                        itemDTO.setProductImage(item.getProduct().getImages().iterator().next().getImageUrl());
                    }
                    
                    itemDTO.setProductSlug(item.getProduct().getSlug());
                    itemDTO.setPrice(item.getPrice());
                    itemDTO.setDiscount(item.getDiscount());
                    itemDTO.setQuantity(item.getQuantity());
                    itemDTO.setSubtotal(item.getSubtotal());
                    return itemDTO;
                })
                .collect(Collectors.toList());
        dto.setItems(itemDTOs);
        
        // Chuyển đổi lịch sử trạng thái
        List<OrderStatusHistoryDTO> historyDTOs = order.getStatusHistory().stream()
                .map(history -> {
                    OrderStatusHistoryDTO historyDTO = new OrderStatusHistoryDTO();
                    historyDTO.setId(history.getId());
                    historyDTO.setStatus(history.getStatus());
                    historyDTO.setStatusDisplayName(history.getStatus().getDisplayName());
                    historyDTO.setCreatedAt(history.getCreatedAt());
                    historyDTO.setNotes(history.getNotes());
                    return historyDTO;
                })
                .collect(Collectors.toList());
        dto.setStatusHistory(historyDTOs);
        
        return dto;
    }
} 