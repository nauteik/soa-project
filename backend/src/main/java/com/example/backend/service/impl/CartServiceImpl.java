package com.example.backend.service.impl;

import com.example.backend.dto.AddToCartDTO;
import com.example.backend.dto.CartDTO;
import com.example.backend.dto.CartItemDTO;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.CartItem;
import com.example.backend.model.Product;
import com.example.backend.model.User;
import com.example.backend.repository.CartItemRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public CartDTO getUserCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        List<CartItem> cartItems = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        
        return mapToCartDTO(user, cartItems);
    }

    @Override
    @Transactional
    public CartDTO addToCart(Long userId, AddToCartDTO addToCartDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Product product = productRepository.findById(addToCartDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // Kiểm tra số lượng tồn kho
        if (product.getQuantityInStock() < addToCartDTO.getQuantity()) {
            throw new IllegalArgumentException("Không đủ số lượng sản phẩm trong kho");
        }
        
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        CartItem cartItem = cartItemRepository.findByUserAndProduct(user, product)
                .orElse(new CartItem());
        
        if (cartItem.getId() == null) {
            // Nếu chưa có trong giỏ hàng, tạo mới
            cartItem.setUser(user);
            cartItem.setProduct(product);
            cartItem.setQuantity(addToCartDTO.getQuantity());
        } else {
            // Nếu đã có, tăng số lượng
            int newQuantity = cartItem.getQuantity() + addToCartDTO.getQuantity();
            // Kiểm tra số lượng tồn kho
            if (product.getQuantityInStock() < newQuantity) {
                throw new IllegalArgumentException("Số lượng vượt quá hàng tồn kho");
            }
            cartItem.setQuantity(newQuantity);
        }
        
        cartItemRepository.save(cartItem);
        
        List<CartItem> cartItems = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        return mapToCartDTO(user, cartItems);
    }

    @Override
    @Transactional
    public CartDTO updateCartItem(Long userId, Long cartItemId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        
        // Kiểm tra xem cart item có thuộc về user không
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Cart item không thuộc về user này");
        }
        
        // Nếu số lượng là 0, xóa khỏi giỏ hàng
        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            // Kiểm tra số lượng tồn kho
            if (cartItem.getProduct().getQuantityInStock() < quantity) {
                throw new IllegalArgumentException("Số lượng vượt quá hàng tồn kho");
            }
            
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }
        
        List<CartItem> cartItems = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        return mapToCartDTO(user, cartItems);
    }

    @Override
    @Transactional
    public CartDTO removeCartItem(Long userId, Long cartItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        
        // Kiểm tra xem cart item có thuộc về user không
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Cart item không thuộc về user này");
        }
        
        cartItemRepository.delete(cartItem);
        
        List<CartItem> cartItems = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        return mapToCartDTO(user, cartItems);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        cartItemRepository.deleteByUser(user);
    }

    @Override
    public Integer getCartItemsCount(Long userId) {
        Integer count = cartItemRepository.countItemsByUserId(userId);
        return count != null ? count : 0;
    }
    
    private CartDTO mapToCartDTO(User user, List<CartItem> cartItems) {
        List<CartItemDTO> cartItemDTOs = cartItems.stream()
                .map(this::mapToCartItemDTO)
                .collect(Collectors.toList());
        
        CartDTO cartDTO = new CartDTO();
        cartDTO.setUserId(user.getId());
        cartDTO.setItems(cartItemDTOs);
        cartDTO.setTotalItems(cartItems.stream().mapToInt(CartItem::getQuantity).sum());
        
        // Tính tổng tiền
        BigDecimal totalPrice = cartItems.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        cartDTO.setTotalPrice(totalPrice);
        
        return cartDTO;
    }
    
    private CartItemDTO mapToCartItemDTO(CartItem cartItem) {
        Product product = cartItem.getProduct();
        
        CartItemDTO dto = new CartItemDTO();
        dto.setId(cartItem.getId());
        dto.setProductId(product.getId());
        dto.setProductName(product.getName());
        dto.setProductSlug(product.getSlug());
        dto.setProductPrice(product.getPrice());
        dto.setProductDiscount(product.getDiscount());
        dto.setQuantity(cartItem.getQuantity());
        dto.setSubtotal(cartItem.getSubtotal());
        dto.setCreatedAt(cartItem.getCreatedAt());
        
        // Lấy ảnh đầu tiên của sản phẩm
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            String imageUrl = product.getImages().stream()
                    .filter(img -> img.getIsMain())
                    .findFirst()
                    .orElse(product.getImages().iterator().next())
                    .getImageUrl();
            
            dto.setProductImage(imageUrl);
        }
        
        return dto;
    }
} 