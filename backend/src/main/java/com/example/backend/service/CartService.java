package com.example.backend.service;

import com.example.backend.dto.AddToCartDTO;
import com.example.backend.dto.CartDTO;

public interface CartService {
    
    CartDTO getUserCart(Long userId);
    
    CartDTO addToCart(Long userId, AddToCartDTO addToCartDTO);
    
    CartDTO updateCartItem(Long userId, Long cartItemId, Integer quantity);
    
    CartDTO removeCartItem(Long userId, Long cartItemId);
    
    void clearCart(Long userId);
    
    Integer getCartItemsCount(Long userId);
} 