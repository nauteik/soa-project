package com.example.backend.controller;

import com.example.backend.dto.AddToCartDTO;
import com.example.backend.dto.CartDTO;
import com.example.backend.model.User;
import com.example.backend.service.CartService;
import com.example.backend.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDTO> getUserCart(Authentication authentication) {
        User user = SecurityUtils.getUserFromAuthentication(authentication);
        CartDTO cart = cartService.getUserCart(user.getId());
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/add")
    public ResponseEntity<CartDTO> addToCart(
            @RequestBody AddToCartDTO addToCartDTO,
            Authentication authentication) {
        User user = SecurityUtils.getUserFromAuthentication(authentication);
        CartDTO updatedCart = cartService.addToCart(user.getId(), addToCartDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(updatedCart);
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartDTO> updateCartItem(
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity,
            Authentication authentication) {
        User user = SecurityUtils.getUserFromAuthentication(authentication);
        CartDTO updatedCart = cartService.updateCartItem(user.getId(), cartItemId, quantity);
        return ResponseEntity.ok(updatedCart);
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartDTO> removeCartItem(
            @PathVariable Long cartItemId,
            Authentication authentication) {
        User user = SecurityUtils.getUserFromAuthentication(authentication);
        CartDTO updatedCart = cartService.removeCartItem(user.getId(), cartItemId);
        return ResponseEntity.ok(updatedCart);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        User user = SecurityUtils.getUserFromAuthentication(authentication);
        cartService.clearCart(user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getCartItemsCount(Authentication authentication) {
        User user = SecurityUtils.getUserFromAuthentication(authentication);
        Integer count = cartService.getCartItemsCount(user.getId());
        return ResponseEntity.ok(count);
    }
} 