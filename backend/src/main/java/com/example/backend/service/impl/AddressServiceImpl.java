package com.example.backend.service.impl;

import com.example.backend.dto.AddressDto;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.User;
import com.example.backend.model.UserAddress;
import com.example.backend.repository.UserAddressRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AddressService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    public List<AddressDto> getCurrentUserAddresses() {
        User currentUser = getCurrentUser();
        return addressRepository.findByUserId(currentUser.getId())
                .stream()
                .map(AddressDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public AddressDto getAddressById(Long id) {
        User currentUser = getCurrentUser();
        UserAddress address = addressRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ", "id", id));
        return AddressDto.fromEntity(address);
    }

    @Override
    @Transactional
    public AddressDto addAddress(AddressDto addressDto) {
        User currentUser = getCurrentUser();
        
        UserAddress address = new UserAddress();
        addressDto.updateEntity(address);
        address.setUser(currentUser);
        
        // Nếu đây là địa chỉ đầu tiên thì đặt làm mặc định
        if (addressRepository.findByUserId(currentUser.getId()).isEmpty()) {
            addressRepository.resetDefaultAddresses(currentUser.getId());
            address.setIsDefault(true);
        } else {
            // Luôn đặt isDefault = false, chỉ có thể cập nhật qua phương thức setDefaultAddress
            address.setIsDefault(false);
        }
        
        UserAddress savedAddress = addressRepository.save(address);
        return AddressDto.fromEntity(savedAddress);
    }

    @Override
    @Transactional
    public AddressDto updateAddress(Long id, AddressDto addressDto) {
        User currentUser = getCurrentUser();
        
        UserAddress existingAddress = addressRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ", "id", id));
        
        // Lưu giá trị isDefault hiện tại
        boolean wasDefault = Boolean.TRUE.equals(existingAddress.getIsDefault());
        
        // Cập nhật các trường (không bao gồm isDefault)
        addressDto.updateEntity(existingAddress);
        existingAddress.setUpdatedAt(LocalDateTime.now());
        
        // Khôi phục giá trị isDefault
        existingAddress.setIsDefault(wasDefault);
        
        UserAddress updatedAddress = addressRepository.save(existingAddress);
        return AddressDto.fromEntity(updatedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Long id) {
        User currentUser = getCurrentUser();
        
        UserAddress address = addressRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ", "id", id));
        
        // Kiểm tra nếu đây là địa chỉ mặc định và có nhiều hơn 1 địa chỉ
        if (Boolean.TRUE.equals(address.getIsDefault()) && addressRepository.findByUserId(currentUser.getId()).size() > 1) {
            throw new BadRequestException("Không thể xóa địa chỉ mặc định. Vui lòng đặt một địa chỉ khác làm mặc định trước khi xóa.");
        }
        
        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public AddressDto setDefaultAddress(Long id) {
        User currentUser = getCurrentUser();
        
        UserAddress address = addressRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ", "id", id));
        
        // Chỉ thực hiện các thay đổi khi địa chỉ chưa phải là mặc định
        if (!Boolean.TRUE.equals(address.getIsDefault())) {
            // Hủy tất cả các địa chỉ mặc định hiện tại
            addressRepository.resetDefaultAddresses(currentUser.getId());
            
            // Đặt địa chỉ này làm mặc định
            address.setIsDefault(true);
            address = addressRepository.save(address);
        }
        
        return AddressDto.fromEntity(address);
    }

    @Override
    public List<AddressDto> getUserAddressesByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
                
        return addressRepository.findByUserId(userId)
                .stream()
                .map(AddressDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin người dùng hiện tại từ SecurityContext
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "email", email));
    }
} 