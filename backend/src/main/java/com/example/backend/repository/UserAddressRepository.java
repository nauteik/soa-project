package com.example.backend.repository;

import com.example.backend.model.User;
import com.example.backend.model.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    
    List<UserAddress> findByUserId(Long userId);
    
    Optional<UserAddress> findByIdAndUserId(Long id, Long userId);
    
    Optional<UserAddress> findByUserIdAndIsDefaultTrue(Long userId);
    
  
    @Modifying
    @Query("UPDATE UserAddress a SET a.isDefault = false WHERE a.user.id = ?1")
    void resetDefaultAddresses(Long userId);

    /**
     * Tìm tất cả địa chỉ của một người dùng
     * @param user Đối tượng người dùng
     * @return Danh sách địa chỉ
     */
    List<UserAddress> findByUserOrderByIsDefaultDesc(User user);
    
    /**
     * Tìm địa chỉ mặc định của người dùng
     * @param user Đối tượng người dùng
     * @return Địa chỉ mặc định (nếu có)
     */
    Optional<UserAddress> findByUserAndIsDefaultTrue(User user);
    
    /**
     * Đếm số địa chỉ của một người dùng
     * @param user Đối tượng người dùng
     * @return Số lượng địa chỉ
     */
    long countByUser(User user);
    
    /**
     * Tìm địa chỉ theo ID và người dùng
     * @param id ID địa chỉ
     * @param user Đối tượng người dùng
     * @return Địa chỉ (nếu có)
     */
    Optional<UserAddress> findByIdAndUser(Long id, User user);
    
    /**
     * Bỏ đánh dấu tất cả địa chỉ mặc định của người dùng
     * @param user Đối tượng người dùng
     * @return Số lượng bản ghi bị ảnh hưởng
     */
    @Modifying
    @Query("UPDATE UserAddress a SET a.isDefault = false WHERE a.user = :user")
    int removeDefaultAddress(@Param("user") User user);
} 