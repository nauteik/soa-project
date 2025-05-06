package com.example.backend.service;

import com.example.backend.dto.AddressDto;
import java.util.List;

public interface AddressService {
    
    /**
     * Lấy danh sách địa chỉ của người dùng hiện tại
     */
    List<AddressDto> getCurrentUserAddresses();
    
    /**
     * Lấy địa chỉ theo ID
     */
    AddressDto getAddressById(Long id);
    
    /**
     * Thêm địa chỉ mới
     */
    AddressDto addAddress(AddressDto addressDto);
    
    /**
     * Cập nhật địa chỉ
     */
    AddressDto updateAddress(Long id, AddressDto addressDto);
    
    /**
     * Xóa địa chỉ
     */
    void deleteAddress(Long id);
    
    /**
     * Đặt địa chỉ mặc định
     */
    AddressDto setDefaultAddress(Long id);
   
} 