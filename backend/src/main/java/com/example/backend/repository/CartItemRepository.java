package com.example.backend.repository;

import com.example.backend.model.CartItem;
import com.example.backend.model.Product;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByUser(User user);
    
    List<CartItem> findByUserOrderByCreatedAtDesc(User user);
    
    Optional<CartItem> findByUserAndProduct(User user, Product product);
    
    void deleteByUser(User user);
    
    @Query("SELECT SUM(ci.quantity) FROM CartItem ci WHERE ci.user.id = ?1")
    Integer countItemsByUserId(Long userId);
    
    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.user.id = ?1")
    Integer countDistinctItemsByUserId(Long userId);
    
    List<CartItem> findByIdInAndUserIdOrderByCreatedAtDesc(List<Long> ids, Long userId);
    
    List<CartItem> findAllByIdInAndUserId(List<Long> ids, Long userId);
} 