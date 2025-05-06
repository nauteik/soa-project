package com.example.backend.service;

import com.example.backend.dto.UserResponseDto;
import com.example.backend.model.UserRole;
import java.util.List;

public interface UserService {
    
    /**
     * Lấy danh sách tất cả người dùng
     * 
     * @return Danh sách tất cả người dùng
     */
    List<UserResponseDto> getAllUsers();
    
    /**
     * Lấy danh sách người dùng theo vai trò
     * 
     * @param role Vai trò của người dùng
     * @return Danh sách người dùng có vai trò đã cho
     */
    List<UserResponseDto> getUsersByRole(UserRole role);
    
    /**
     * Lấy thông tin người dùng theo ID
     * 
     * @param id ID của người dùng
     * @return Thông tin người dùng
     */
    UserResponseDto getUserById(Long id);
    
    /**
     * Cập nhật trạng thái hoạt động của người dùng
     * 
     * @param id ID của người dùng
     * @param enabled Trạng thái hoạt động
     * @return Thông tin người dùng sau khi cập nhật
     */
    UserResponseDto updateUserStatus(Long id, boolean enabled);
    
    /**
     * Cập nhật vai trò của người dùng
     * 
     * @param id ID của người dùng
     * @param role Vai trò mới
     * @return Thông tin người dùng sau khi cập nhật
     */
    UserResponseDto updateUserRole(Long id, UserRole role);
    
    /**
     * Xóa người dùng theo ID
     * 
     * @param id ID của người dùng
     */
    void deleteUser(Long id);
    
    /**
     * Tạo người dùng mới với vai trò STAFF hoặc MANAGER
     * 
     * @param userDto Thông tin người dùng
     * @param password Mật khẩu ban đầu
     * @param role Vai trò của người dùng
     * @return Thông tin người dùng sau khi tạo
     */
    UserResponseDto createStaffUser(UserResponseDto userDto, String password, UserRole role);
    
    /**
     * Cập nhật thông tin cơ bản của người dùng
     * 
     * @param id ID của người dùng
     * @param name Tên mới
     * @param mobileNumber Số điện thoại mới (có thể null)
     * @param profileImage Ảnh đại diện mới (có thể null)
     * @return Thông tin người dùng sau khi cập nhật
     */
    UserResponseDto updateUserInfo(Long id, String name, String mobileNumber, String profileImage);
} 