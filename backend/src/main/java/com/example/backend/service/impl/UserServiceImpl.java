package com.example.backend.service.impl;

import com.example.backend.dto.UserResponseDto;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.User;
import com.example.backend.model.UserRole;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserResponseDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserResponseDto> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::convertToUserResponseDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public UserResponseDto getUserById(Long id) {
        User user = getUserEntityById(id);
        return convertToUserResponseDto(user);
    }
    
    @Override
    @Transactional
    public UserResponseDto updateUserStatus(Long id, boolean enabled) {
        User user = getUserEntityById(id);
        user.setIsEnabled(enabled);
        user.setUpdatedAt(LocalDateTime.now());
        
        User updatedUser = userRepository.save(user);
        return convertToUserResponseDto(updatedUser);
    }
    
    @Override
    @Transactional
    public UserResponseDto updateUserRole(Long id, UserRole role) {
        User user = getUserEntityById(id);
        user.setRole(role);
        user.setUpdatedAt(LocalDateTime.now());
        
        User updatedUser = userRepository.save(user);
        return convertToUserResponseDto(updatedUser);
    }
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = getUserEntityById(id);
        
        // Không cho phép xóa người dùng đã có đơn hàng
        if (user.getOrders() != null && !user.getOrders().isEmpty()) {
            throw new BadRequestException("Không thể xóa người dùng đã có đơn hàng. Hãy vô hiệu hóa tài khoản thay vì xóa.");
        }
        
        userRepository.delete(user);
    }
    
    @Override
    @Transactional
    public UserResponseDto createStaffUser(UserResponseDto userDto, String password, UserRole role) {
        // Kiểm tra role hợp lệ (chỉ chấp nhận STAFF hoặc MANAGER)
        if (role != UserRole.ORDER_STAFF &&  role != UserRole.PRODUCT_STAFF && role != UserRole.MANAGER) {
            throw new BadRequestException("Vai trò không hợp lệ. Chỉ chấp nhận STAFF hoặc MANAGER.");
        }
        
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng.");
        }
        
        // Tạo người dùng mới
        User newUser = new User();
        newUser.setName(userDto.getName());
        newUser.setEmail(userDto.getEmail());
        newUser.setMobileNumber(userDto.getMobileNumber());
        newUser.setProfileImage(userDto.getProfileImage());
        newUser.setPassword(passwordEncoder.encode(password));
        newUser.setRole(role);
        newUser.setIsEnabled(true);
        
        User savedUser = userRepository.save(newUser);
        return convertToUserResponseDto(savedUser);
    }
    
    @Override
    @Transactional
    public UserResponseDto updateUserInfo(Long id, String name, String mobileNumber, String profileImage) {
        User user = getUserEntityById(id);
        
        // Cập nhật thông tin
        user.setName(name);
        user.setMobileNumber(mobileNumber);
        user.setProfileImage(profileImage);
        user.setUpdatedAt(LocalDateTime.now());
        
        User updatedUser = userRepository.save(user);
        return convertToUserResponseDto(updatedUser);
    }
    
    /**
     * Lấy entity User từ ID
     */
    private User getUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", id));
    }
    
    /**
     * Chuyển đổi từ User entity sang UserResponseDto
     */
    private UserResponseDto convertToUserResponseDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getProfileImage(),
                user.getRole(),
                user.getIsEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
} 