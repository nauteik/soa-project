package com.example.backend.service.impl;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    @Override
    public Map<String, Object> getDashboardStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        // Tính tổng doanh thu
        BigDecimal totalRevenue = calculateTotalRevenue();
        result.put("totalRevenue", totalRevenue);
        
        // Lấy tổng số đơn hàng
        long totalOrders = orderRepository.count();
        result.put("totalOrders", totalOrders);
        
        // Lấy số đơn hàng mới trong 7 ngày qua
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minus(7, ChronoUnit.DAYS);
        List<Order> recentOrders = orderRepository.findByCreatedAtBetween(sevenDaysAgo, LocalDateTime.now());
        result.put("newOrders", recentOrders.size());
        
        // Lấy tổng số người dùng
        long totalUsers = userRepository.count();
        result.put("totalUsers", totalUsers);
        
        // Lấy số người dùng mới trong 7 ngày qua
        long newUsers = userRepository.findAll().stream()
                .filter(user -> user.getCreatedAt() != null && user.getCreatedAt().isAfter(sevenDaysAgo))
                .count();
        result.put("newUsers", newUsers);
        
        // Lấy tổng số sản phẩm
        long totalProducts = productRepository.count();
        result.put("totalProducts", totalProducts);
        
        // Lấy sản phẩm bán chạy nhất
        List<Map<String, Object>> bestSellingProducts = productRepository.findAll().stream()
                .sorted(Comparator.comparing(Product::getQuantitySold).reversed())
                .limit(5)
                .map(this::convertProductToMap)
                .collect(Collectors.toList());
        result.put("bestSellingProducts", bestSellingProducts);
        
        // Lấy đơn hàng gần đây - chuyển đổi thành Map để tránh tham chiếu vòng tròn
        List<Map<String, Object>> latestOrders = recentOrders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(5)
                .map(this::convertOrderToSimpleMap)
                .collect(Collectors.toList());
        result.put("latestOrders", latestOrders);
        
        return result;
    }

    @Override
    public Map<String, Object> getRevenueStatistics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new HashMap<>();
        
        // Xử lý startDate và endDate
        LocalDateTime startDateTime = startDate != null ? 
                LocalDateTime.of(startDate, LocalTime.MIN) :
                LocalDateTime.of(LocalDate.now().minus(30, ChronoUnit.DAYS), LocalTime.MIN);
        
        LocalDateTime endDateTime = endDate != null ?
                LocalDateTime.of(endDate, LocalTime.MAX) :
                LocalDateTime.now();
        
        // Lấy đơn hàng trong khoảng thời gian
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        
        // Tính doanh thu theo ngày
        Map<LocalDate, BigDecimal> dailyRevenue = new HashMap<>();
        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.DELIVERED) {
                LocalDate orderDate = order.getCreatedAt().toLocalDate();
                BigDecimal orderAmount = order.getTotalAmount();
                
                dailyRevenue.put(orderDate, 
                        dailyRevenue.getOrDefault(orderDate, BigDecimal.ZERO).add(orderAmount));
            }
        }
        result.put("dailyRevenue", dailyRevenue);
        
        // Tính tổng doanh thu
        BigDecimal totalRevenue = dailyRevenue.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        result.put("totalRevenue", totalRevenue);
        
        // Tính doanh thu theo phương thức thanh toán
        Map<PaymentMethod, BigDecimal> revenueByPaymentMethod = new HashMap<>();
        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.DELIVERED) {
                PaymentMethod paymentMethod = order.getPaymentMethod();
                BigDecimal orderAmount = order.getTotalAmount();
                
                revenueByPaymentMethod.put(paymentMethod, 
                        revenueByPaymentMethod.getOrDefault(paymentMethod, BigDecimal.ZERO).add(orderAmount));
            }
        }
        result.put("revenueByPaymentMethod", revenueByPaymentMethod);
        
        // Thống kê số lượng đơn hàng theo trạng thái
        Map<OrderStatus, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        result.put("ordersByStatus", ordersByStatus);
        
        return result;
    }

    @Override
    public Map<String, Object> getProductStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        // Lấy tổng số sản phẩm
        long totalProducts = productRepository.count();
        result.put("totalProducts", totalProducts);
        
        // Lấy số sản phẩm theo danh mục
        Map<String, Long> productsByCategory = productRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        product -> product.getCategory().getName(),
                        Collectors.counting()
                ));
        result.put("productsByCategory", productsByCategory);
        
        // Lấy số sản phẩm theo thương hiệu
        Map<String, Long> productsByBrand = productRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        product -> product.getBrand().getName(),
                        Collectors.counting()
                ));
        result.put("productsByBrand", productsByBrand);
        
        // Lấy top 10 sản phẩm bán chạy nhất
        List<Map<String, Object>> bestSellingProducts = productRepository.findAll().stream()
                .sorted(Comparator.comparing(Product::getQuantitySold).reversed())
                .limit(10)
                .map(this::convertProductToMap)
                .collect(Collectors.toList());
        result.put("bestSellingProducts", bestSellingProducts);
        
        // Lấy top 10 sản phẩm có lượng tồn kho thấp nhất
        List<Map<String, Object>> lowStockProducts = productRepository.findAll().stream()
                .filter(product -> product.getIsActive())
                .sorted(Comparator.comparing(Product::getQuantityInStock))
                .limit(10)
                .map(this::convertProductToMap)
                .collect(Collectors.toList());
        result.put("lowStockProducts", lowStockProducts);
        
        return result;
    }

    @Override
    public Map<String, Object> getUserStatistics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new HashMap<>();
        
        // Xử lý startDate và endDate
        LocalDateTime startDateTime = startDate != null ? 
                LocalDateTime.of(startDate, LocalTime.MIN) :
                LocalDateTime.of(LocalDate.now().minus(30, ChronoUnit.DAYS), LocalTime.MIN);
        
        LocalDateTime endDateTime = endDate != null ?
                LocalDateTime.of(endDate, LocalTime.MAX) :
                LocalDateTime.now();
        
        // Lấy tổng số người dùng
        long totalUsers = userRepository.count();
        result.put("totalUsers", totalUsers);
        
        // Lấy số người dùng theo vai trò
        Map<UserRole, Long> usersByRole = userRepository.findAll().stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        result.put("usersByRole", usersByRole);
        
        // Lấy số người dùng mới trong khoảng thời gian
        long newUsers = userRepository.findAll().stream()
                .filter(user -> user.getCreatedAt() != null 
                        && user.getCreatedAt().isAfter(startDateTime) 
                        && user.getCreatedAt().isBefore(endDateTime))
                .count();
        result.put("newUsers", newUsers);
        
        // Thống kê theo ngày
        Map<LocalDate, Long> newUsersByDay = userRepository.findAll().stream()
                .filter(user -> user.getCreatedAt() != null 
                        && user.getCreatedAt().isAfter(startDateTime) 
                        && user.getCreatedAt().isBefore(endDateTime))
                .collect(Collectors.groupingBy(
                        user -> user.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));
        result.put("newUsersByDay", newUsersByDay);
        
        // Lấy top người dùng có nhiều đơn hàng nhất
        Map<Long, Long> usersOrderCount = orderRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        order -> order.getUser().getId(),
                        Collectors.counting()
                ));
        
        List<Map<String, Object>> topUsers = usersOrderCount.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Map<String, Object> userMap = new HashMap<>();
                    User user = userRepository.findById(entry.getKey()).orElse(null);
                    if (user != null) {
                        userMap.put("id", user.getId());
                        userMap.put("name", user.getName());
                        userMap.put("email", user.getEmail());
                        userMap.put("orderCount", entry.getValue());
                    }
                    return userMap;
                })
                .collect(Collectors.toList());
        result.put("topUsers", topUsers);
        
        return result;
    }

    @Override
    public Map<String, Object> getOrderStatistics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new HashMap<>();
        
        // Xử lý startDate và endDate
        LocalDateTime startDateTime = startDate != null ? 
                LocalDateTime.of(startDate, LocalTime.MIN) :
                LocalDateTime.of(LocalDate.now().minus(30, ChronoUnit.DAYS), LocalTime.MIN);
        
        LocalDateTime endDateTime = endDate != null ?
                LocalDateTime.of(endDate, LocalTime.MAX) :
                LocalDateTime.now();
        
        // Lấy đơn hàng trong khoảng thời gian
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        
        // Tổng số đơn hàng
        long totalOrders = orders.size();
        result.put("totalOrders", totalOrders);
        
        // Thống kê theo trạng thái
        Map<OrderStatus, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        result.put("ordersByStatus", ordersByStatus);
        
        // Thống kê theo phương thức thanh toán
        Map<PaymentMethod, Long> ordersByPaymentMethod = orders.stream()
                .collect(Collectors.groupingBy(Order::getPaymentMethod, Collectors.counting()));
        result.put("ordersByPaymentMethod", ordersByPaymentMethod);
        
        // Thống kê theo trạng thái thanh toán
        Map<PaymentStatus, Long> ordersByPaymentStatus = orders.stream()
                .collect(Collectors.groupingBy(Order::getPaymentStatus, Collectors.counting()));
        result.put("ordersByPaymentStatus", ordersByPaymentStatus);
        
        // Thống kê số đơn hàng theo ngày
        Map<LocalDate, Long> ordersByDay = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));
        result.put("ordersByDay", ordersByDay);
        
        // Thống kê tổng giá trị đơn hàng theo ngày
        Map<LocalDate, BigDecimal> revenueByDay = new HashMap<>();
        for (Order order : orders) {
            LocalDate orderDate = order.getCreatedAt().toLocalDate();
            BigDecimal orderAmount = order.getTotalAmount();
            
            revenueByDay.put(orderDate, 
                    revenueByDay.getOrDefault(orderDate, BigDecimal.ZERO).add(orderAmount));
        }
        result.put("revenueByDay", revenueByDay);
        
        return result;
    }
    
    // Phương thức hỗ trợ
    
    private BigDecimal calculateTotalRevenue() {
        return orderRepository.findAll().stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private Map<String, Object> convertProductToMap(Product product) {
        Map<String, Object> productMap = new HashMap<>();
        productMap.put("id", product.getId());
        productMap.put("name", product.getName());
        productMap.put("price", product.getPrice());
        productMap.put("quantitySold", product.getQuantitySold());
        productMap.put("quantityInStock", product.getQuantityInStock());
        productMap.put("category", product.getCategory() != null ? product.getCategory().getName() : null);
        productMap.put("brand", product.getBrand() != null ? product.getBrand().getName() : null);
        
        if(product.getDiscount() != null && product.getDiscount() > 0) {
            BigDecimal discountAmount = product.getPrice()
                    .multiply(BigDecimal.valueOf(product.getDiscount() / 100.0))
                    .setScale(0, RoundingMode.HALF_UP);
            BigDecimal discountedPrice = product.getPrice().subtract(discountAmount);
            productMap.put("discountedPrice", discountedPrice);
        }
        
        return productMap;
    }

    // Phương thức chuyển đổi Order thành Map đơn giản, tránh tham chiếu vòng tròn
    private Map<String, Object> convertOrderToSimpleMap(Order order) {
        Map<String, Object> orderMap = new HashMap<>();
        orderMap.put("id", order.getId());
        orderMap.put("orderNumber", order.getOrderNumber());
        orderMap.put("totalAmount", order.getTotalAmount());
        orderMap.put("status", order.getStatus());
        orderMap.put("createdAt", order.getCreatedAt());
        
        if (order.getUser() != null) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", order.getUser().getId());
            userMap.put("name", order.getUser().getName());
            userMap.put("email", order.getUser().getEmail());
            orderMap.put("user", userMap);
        }
        
        return orderMap;
    }
} 