package com.example.backend.dto;

import com.example.backend.model.UserAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private Long id;
    
    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    @Pattern(regexp = "^[A-Za-zÀ-ỹ\\s]+$", message = "Họ tên chỉ được chứa chữ cái và khoảng trắng")
    private String fullName;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không hợp lệ")
    private String mobileNo;
    
    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(min = 10, max = 500, message = "Địa chỉ phải từ 10 đến 500 ký tự")
    private String fullAddress;
    
    @NotBlank(message = "Đường/Số nhà không được để trống")
    @Size(max = 255, message = "Đường/Số nhà không được vượt quá 255 ký tự")
    private String street;
    
    @NotBlank(message = "Phường/Xã không được để trống")
    @Size(max = 100, message = "Phường/Xã không được vượt quá 100 ký tự")
    private String ward;
    
    @NotBlank(message = "Quận/Huyện không được để trống")
    @Size(max = 100, message = "Quận/Huyện không được vượt quá 100 ký tự")
    private String district;
    
    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/Thành phố không được vượt quá 100 ký tự")
    private String city;
    
    @NotBlank(message = "Quốc gia không được để trống")
    @Size(max = 100, message = "Quốc gia không được vượt quá 100 ký tự")
    private String country;
    
    @Pattern(regexp = "^[0-9]*$", message = "Mã bưu điện chỉ được chứa số")
    @Size(max = 10, message = "Mã bưu điện không được vượt quá 10 ký tự")
    private String postalCode;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Chuyển từ entity sang DTO
     */
    public static AddressDto fromEntity(UserAddress address) {
        return AddressDto.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .mobileNo(address.getMobileNo())
                .fullAddress(address.getFullAddress())
                .street(address.getStreet())
                .ward(address.getWard())
                .district(address.getDistrict())
                .city(address.getCity())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
    
    /**
     * Cập nhật entity từ DTO
     */
    public void updateEntity(UserAddress address) {
        address.setFullName(this.fullName);
        address.setMobileNo(this.mobileNo);
        address.setFullAddress(this.fullAddress);
        address.setStreet(this.street);
        address.setWard(this.ward);
        address.setDistrict(this.district);
        address.setCity(this.city);
        address.setCountry(this.country);
        address.setPostalCode(this.postalCode);
        if (this.isDefault != null) {
            address.setIsDefault(this.isDefault);
        }
    }
} 