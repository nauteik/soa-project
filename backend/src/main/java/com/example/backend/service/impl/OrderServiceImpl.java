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
            orderItem.setStatus(OrderItemStatus.PENDING);
            
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
        if (createOrderDTO.getPaymentMethod() != PaymentMethod.COD) {
            // Với mọi phương thức thanh toán, luôn cập nhật trạng thái thành công
            savedOrder.updatePaymentStatus(PaymentStatus.PAID, "PAYMENT_SUCCESS_" + System.currentTimeMillis());
            savedOrder.updateStatus(OrderStatus.CONFIRMED, "Đơn hàng đã được xác nhận sau khi thanh toán thành công");
            savedOrder = orderRepository.save(savedOrder);
        }

        // Chuyển đổi đơn hàng thành DTO và trả về
        OrderResponseDTO response = convertToOrderResponseDTO(savedOrder);
        
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
        
        // Chỉ cho phép hủy đơn hàng ở trạng thái PENDING, CONFIRMED, PROCESSING hoặc SHIPPING
        if (order.getStatus() != OrderStatus.PENDING && 
            order.getStatus() != OrderStatus.CONFIRMED && 
            order.getStatus() != OrderStatus.PROCESSING &&
            order.getStatus() != OrderStatus.SHIPPING) {
            throw new IllegalStateException("Không thể hủy đơn hàng ở trạng thái " + order.getStatus());
        }
        
        // Cập nhật trạng thái đơn hàng
        order.updateStatus(OrderStatus.CANCELED, "Đơn hàng bị hủy");
        
        // Cập nhật trạng thái các mục đơn hàng
        for (OrderItem item : order.getItems()) {
            item.updateStatus(OrderItemStatus.CANCELED);
        }
        
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
        
        Order savedOrder = orderRepository.save(order);
        
        return convertToOrderResponseDTO(savedOrder);
    }
    
    @Override
    @Transactional
    public OrderResponseDTO cancelOrderByNumber(Long userId, String orderNumber, String reason) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Chỉ cho phép hủy đơn hàng ở trạng thái PENDING, CONFIRMED, PROCESSING hoặc SHIPPING
        if (order.getStatus() != OrderStatus.PENDING && 
            order.getStatus() != OrderStatus.CONFIRMED && 
            order.getStatus() != OrderStatus.PROCESSING &&
            order.getStatus() != OrderStatus.SHIPPING) {
            throw new IllegalStateException("Không thể hủy đơn hàng ở trạng thái " + order.getStatus());
        }
        
        // Cập nhật trạng thái đơn hàng
        order.updateStatus(OrderStatus.CANCELED, "Đơn hàng bị hủy: " + reason);
        
        // Cập nhật trạng thái các mục đơn hàng
        for (OrderItem item : order.getItems()) {
            item.updateStatus(OrderItemStatus.CANCELED);
        }
        
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
        
        Order savedOrder = orderRepository.save(order);
        
        return convertToOrderResponseDTO(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Kiểm tra tính hợp lệ của luồng trạng thái
        validateStatusTransition(order.getStatus(), status);
        
        // Cập nhật trạng thái đơn hàng và lưu lịch sử
        order.updateStatus(status, notes);
        
        // Xử lý các trạng thái theo quy trình mới
        if (status == OrderStatus.CONFIRMED || status == OrderStatus.PROCESSING || 
            status == OrderStatus.SHIPPING || status == OrderStatus.DELIVERED) {
            // Chỉ cập nhật các mục không bị hủy
            for (OrderItem item : order.getItems()) {
                if (item.getStatus() != OrderItemStatus.CANCELED) {
                    // Chuyển đổi OrderStatus thành OrderItemStatus tương ứng
                    OrderItemStatus itemStatus;
                    switch (status) {
                        case CONFIRMED:
                            itemStatus = OrderItemStatus.CONFIRMED;
                            break;
                        case PROCESSING:
                            itemStatus = OrderItemStatus.PROCESSING;
                            break;
                        case SHIPPING:
                            itemStatus = OrderItemStatus.SHIPPING;
                            break;
                        case DELIVERED:
                            itemStatus = OrderItemStatus.DELIVERED;
                            break;
                        default:
                            continue;
                    }
                    
                    item.updateStatus(itemStatus);
                }
            }
            
            // Nếu là COD và đã giao hàng, cập nhật trạng thái thanh toán thành đã thanh toán
            if (status == OrderStatus.DELIVERED && order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.PAID);
            }
        } else if (status == OrderStatus.FULLY_RETURNED) {
            // Khi chuyển sang trạng thái trả hàng toàn bộ, cập nhật tất cả các mục đơn hàng không bị hủy sang trạng thái RETURNED
            for (OrderItem item : order.getItems()) {
                if (item.getStatus() != OrderItemStatus.CANCELED && item.getStatus() == OrderItemStatus.DELIVERED) {
                    item.updateStatus(OrderItemStatus.RETURNED);
                    
                    // Hoàn trả số lượng sản phẩm vào kho
                    Product product = item.getProduct();
                    product.setQuantityInStock(product.getQuantityInStock() + item.getQuantity());
                    product.setQuantitySold(product.getQuantitySold() - item.getQuantity());
                    productRepository.save(product);
                }
            }
            
            // Nếu đã thanh toán, cập nhật thành trạng thái hoàn tiền
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
        } else if (status == OrderStatus.CANCELED) {
            // Hủy tất cả các mục đơn hàng chưa bị hủy
            for (OrderItem item : order.getItems()) {
                if (item.getStatus() != OrderItemStatus.CANCELED) {
                    item.updateStatus(OrderItemStatus.CANCELED);
                    
                    // Hoàn trả số lượng sản phẩm vào kho
                    Product product = item.getProduct();
                    product.setQuantityInStock(product.getQuantityInStock() + item.getQuantity());
                    product.setQuantitySold(product.getQuantitySold() - item.getQuantity());
                    productRepository.save(product);
                }
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
        
        // Giả định tất cả thanh toán đều thành công
        order.updatePaymentStatus(PaymentStatus.PAID, transactionId);
        
        // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng thành CONFIRMED
        if (order.getStatus() == OrderStatus.PENDING) {
            order.updateStatus(OrderStatus.CONFIRMED, "Đơn hàng đã được xác nhận sau khi thanh toán thành công");
        }
        
        orderRepository.save(order);
        
        return true;
    }
    
    // Các phương thức cho admin
    @Override
    public List<OrderResponseDTO> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .map(this::convertToOrderResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public OrderResponseDTO updateOrderItemStatus(Long orderId, Long itemId, OrderItemStatus status) {
        // Lấy đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        
        // Tìm mục đơn hàng
        OrderItem orderItem = order.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục đơn hàng"));
        
        // Trong 4 trạng thái đầu tiên, chỉ cho phép hủy mục đơn hàng
        if (order.getStatus() == OrderStatus.PENDING || 
            order.getStatus() == OrderStatus.CONFIRMED ||
            order.getStatus() == OrderStatus.PROCESSING || 
            order.getStatus() == OrderStatus.SHIPPING) {
            
            if (status != OrderItemStatus.CANCELED) {
                throw new IllegalStateException("Trong các trạng thái đơn hàng ban đầu, chỉ có thể hủy từng mục đơn hàng");
            }
        }
        
        // Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái
        validateOrderItemStatusTransition(orderItem.getStatus(), status, order.getStatus());
        
        // Cập nhật trạng thái mục đơn hàng
        orderItem.updateStatus(status);
        
        // Xử lý trường hợp đặc biệt, ví dụ: mục trả hàng
        if (status == OrderItemStatus.RETURNED) {
            // Hoàn trả số lượng sản phẩm vào kho
            Product product = orderItem.getProduct();
            product.setQuantityInStock(product.getQuantityInStock() + orderItem.getQuantity());
            product.setQuantitySold(product.getQuantitySold() - orderItem.getQuantity());
            productRepository.save(product);
            
            // Kiểm tra xem tất cả các mục không bị hủy đã được trả hàng chưa
            boolean allNonCanceledItemsReturned = order.getItems().stream()
                    .filter(item -> item.getStatus() != OrderItemStatus.CANCELED)
                    .allMatch(item -> item.getStatus() == OrderItemStatus.RETURNED);
            
            // Nếu tất cả các mục không bị hủy đã được trả hàng, cập nhật trạng thái đơn hàng thành trả toàn bộ
            if (allNonCanceledItemsReturned) {
                order.updateStatus(OrderStatus.FULLY_RETURNED, "Tất cả các mục đơn hàng đã được trả lại");
                if (order.getPaymentStatus() == PaymentStatus.PAID) {
                    order.setPaymentStatus(PaymentStatus.REFUNDED);
                }
            } else {
                // Nếu chỉ một số mục được trả, cập nhật trạng thái thành trả một phần
                order.updateStatus(OrderStatus.PARTIALLY_RETURNED, "Một số mục đã được trả lại");
            }
        } else if (status == OrderItemStatus.CANCELED) {
            // Hoàn trả số lượng sản phẩm vào kho cho mục đã hủy
            Product product = orderItem.getProduct();
            product.setQuantityInStock(product.getQuantityInStock() + orderItem.getQuantity());
            product.setQuantitySold(product.getQuantitySold() - orderItem.getQuantity());
            productRepository.save(product);
            
            // Kiểm tra xem tất cả các mục đã bị hủy chưa
            boolean allCanceled = order.getItems().stream()
                    .allMatch(item -> item.getStatus() == OrderItemStatus.CANCELED);
            
            // Nếu tất cả đã hủy, cập nhật trạng thái đơn hàng
            if (allCanceled) {
                order.updateStatus(OrderStatus.CANCELED, "Tất cả các mục đã bị hủy");
                if (order.getPaymentStatus() == PaymentStatus.PAID) {
                    order.setPaymentStatus(PaymentStatus.REFUNDED);
                }
            }
        }
        
        Order savedOrder = orderRepository.save(order);
        return convertToOrderResponseDTO(savedOrder);
    }
    
    @Override
    public OrderResponseDTO getOrderByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        return convertToOrderResponseDTO(order);
    }
    
    @Override
    public List<OrderResponseDTO> getUserOrdersForAdmin(Long userId) {
        // Kiểm tra người dùng tồn tại
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
                
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream()
                .map(this::convertToOrderResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái mục đơn hàng
     */
    private void validateOrderItemStatusTransition(OrderItemStatus currentStatus, OrderItemStatus newStatus, OrderStatus orderStatus) {
        // Trường hợp hủy mục hàng
        if (newStatus == OrderItemStatus.CANCELED) {
            // Không thể hủy mục đơn hàng đã DELIVERED
            if (currentStatus == OrderItemStatus.DELIVERED) {
                throw new IllegalStateException("Không thể hủy mục đơn hàng đã giao hàng");
            }
            
            // Chỉ có thể hủy ở 4 trạng thái đầu tiên
            if (orderStatus != OrderStatus.PENDING && 
                orderStatus != OrderStatus.CONFIRMED && 
                orderStatus != OrderStatus.PROCESSING &&
                orderStatus != OrderStatus.SHIPPING) {
                throw new IllegalStateException("Chỉ có thể hủy mục đơn hàng khi đơn hàng ở trạng thái chờ xác nhận, đã xác nhận, đang xử lý hoặc đang giao hàng");
            }
            return;
        }
        
        // Trường hợp trả hàng
        if (newStatus == OrderItemStatus.RETURNED) {
            if (currentStatus != OrderItemStatus.DELIVERED) {
                throw new IllegalStateException("Chỉ có thể trả mục hàng ở trạng thái đã giao hàng");
            }
            if (orderStatus != OrderStatus.DELIVERED && 
                orderStatus != OrderStatus.PARTIALLY_RETURNED) {
                throw new IllegalStateException("Chỉ có thể trả mục hàng khi đơn hàng ở trạng thái đã giao hàng hoặc trả hàng một phần");
            }
            return;
        }
        
        // Các trường hợp chuyển đổi khác không được phép
        throw new IllegalStateException("Không cho phép chuyển đổi trạng thái mục đơn hàng riêng lẻ ngoài CANCELED hoặc RETURNED");
    }
    
    /**
     * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái đơn hàng
     */
    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        // Quy trình cơ bản: PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED
        switch (newStatus) {
            case CONFIRMED:
                if (currentStatus != OrderStatus.PENDING) {
                    throw new IllegalStateException("Chỉ có thể xác nhận đơn hàng ở trạng thái chờ xác nhận");
                }
                break;
            case PROCESSING:
                if (currentStatus != OrderStatus.CONFIRMED) {
                    throw new IllegalStateException("Chỉ có thể xử lý đơn hàng ở trạng thái đã xác nhận");
                }
                break;
            case SHIPPING:
                if (currentStatus != OrderStatus.PROCESSING) {
                    throw new IllegalStateException("Chỉ có thể giao đơn hàng ở trạng thái đang xử lý");
                }
                break;
            case DELIVERED:
                if (currentStatus != OrderStatus.SHIPPING) {
                    throw new IllegalStateException("Chỉ có thể hoàn thành đơn hàng ở trạng thái đang giao");
                }
                break;
            case FULLY_RETURNED:
                // Chỉ cho phép chuyển trực tiếp từ DELIVERED sang FULLY_RETURNED
                if (currentStatus != OrderStatus.DELIVERED) {
                    throw new IllegalStateException("Chỉ có thể trả hàng toàn bộ ở trạng thái đã giao hàng");
                }
                break;
            case PARTIALLY_RETURNED:
                throw new IllegalStateException("Không thể cập nhật đơn hàng sang trạng thái trả một phần. Trạng thái này chỉ được cập nhật tự động khi trả từng mục đơn hàng");
            case CANCELED:
                // Chỉ cho phép hủy ở 4 trạng thái đầu tiên
                if (currentStatus != OrderStatus.PENDING && 
                    currentStatus != OrderStatus.CONFIRMED && 
                    currentStatus != OrderStatus.PROCESSING &&
                    currentStatus != OrderStatus.SHIPPING) {
                    throw new IllegalStateException("Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận, đã xác nhận, đang xử lý hoặc đang giao hàng");
                }
                break;
            default:
                throw new IllegalStateException("Trạng thái không hợp lệ");
        }
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
        dto.setUserEmail(order.getUser().getEmail());
        
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
                    itemDTO.setStatus(item.getStatus());
                    itemDTO.setStatusDisplayName(item.getStatus().getDisplayName());
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