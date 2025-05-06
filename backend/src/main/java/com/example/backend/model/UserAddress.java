package com.example.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAddress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    @Pattern(regexp = "^[A-Za-zÀ-ỹ\\s]+$", message = "Họ tên chỉ được chứa chữ cái và khoảng trắng")
    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không hợp lệ")
    @Column(name = "mobile_no", length = 20, nullable = false)
    private String mobileNo;
    
    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(min = 10, max = 500, message = "Địa chỉ phải từ 10 đến 500 ký tự")
    @Column(name = "full_address", columnDefinition = "TEXT", nullable = false)
    private String fullAddress; // formatted_address từ Google
    
    @NotBlank(message = "Đường/Số nhà không được để trống")
    @Size(max = 255, message = "Đường/Số nhà không được vượt quá 255 ký tự")
    @Column(length = 255, nullable = false)
    private String street;
    
    @NotBlank(message = "Phường/Xã không được để trống")
    @Size(max = 100, message = "Phường/Xã không được vượt quá 100 ký tự")
    @Column(length = 100, nullable = false)
    private String ward;
    
    @NotBlank(message = "Quận/Huyện không được để trống")
    @Size(max = 100, message = "Quận/Huyện không được vượt quá 100 ký tự")
    @Column(length = 100, nullable = false)
    private String district;
    
    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/Thành phố không được vượt quá 100 ký tự")
    @Column(length = 100, nullable = false)
    private String city;
    
    @NotBlank(message = "Quốc gia không được để trống")
    @Size(max = 100, message = "Quốc gia không được vượt quá 100 ký tự")
    @Column(length = 100, nullable = false)
    private String country;
    
    @Pattern(regexp = "^$|^[0-9]{5,6}$", message = "Mã bưu điện phải để trống hoặc có 5-6 chữ số")
    @Column(name = "postal_code", length = 6)
    private String postalCode;
    
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "shippingAddress")
    private List<Order> orders = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 