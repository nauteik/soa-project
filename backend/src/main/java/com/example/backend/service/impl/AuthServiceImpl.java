package com.example.backend.service.impl;

import com.example.backend.dto.AuthResponseDto;
import com.example.backend.dto.PasswordUpdateDto;
import com.example.backend.dto.UserLoginDto;
import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.User;
import com.example.backend.model.UserRole;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import com.example.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    // Pattern mật khẩu: không có khoảng trắng
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^\\S+$");
    
    /**
     * Kiểm tra tính hợp lệ của mật khẩu
     * @param password mật khẩu cần kiểm tra
     * @throws BadRequestException nếu mật khẩu không hợp lệ
     */
    private void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BadRequestException("Mật khẩu không được chứa khoảng trắng");
        }
    }
    
    @Override
    public AuthResponseDto register(UserRegistrationDto registrationDto) {
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        
        // Kiểm tra mật khẩu
        validatePassword(registrationDto.getPassword());
        
        // Tạo user mới
        User user = new User();
        user.setName(registrationDto.getName());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        user.setMobileNumber(registrationDto.getMobileNumber());
        user.setRole(UserRole.USER); // Mặc định tất cả người dùng mới đều là USER
        
        // Lưu user vào DB
        user = userRepository.save(user);
        
        // Tạo token JWT
        String token = jwtService.generateToken(user.getEmail());
        
        // Tạo response DTO
        UserResponseDto userResponseDto = convertToUserResponseDto(user);
        
        return new AuthResponseDto(token, userResponseDto);
    }
    
    @Override
    public AuthResponseDto login(UserLoginDto loginDto) {
        // Tìm user theo email
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không tồn tại"));
        
        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }
        
        // Kiểm tra tài khoản đã bị vô hiệu hóa chưa
        if (!user.getIsEnabled()) {
            throw new BadCredentialsException("Tài khoản của bạn đã bị vô hiệu hóa");
        }
        
        // Tạo token JWT
        String token = jwtService.generateToken(user.getEmail());
        
        // Tạo response DTO
        UserResponseDto userResponseDto = convertToUserResponseDto(user);
        
        return new AuthResponseDto(token, userResponseDto);
    }
    
    @Override
    public AuthResponseDto adminLogin(UserLoginDto loginDto) {
        // Tìm user theo email
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không tồn tại"));
        
        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }
        
        // Kiểm tra tài khoản đã bị vô hiệu hóa chưa
        if (!user.getIsEnabled()) {
            throw new BadCredentialsException("Tài khoản của bạn đã bị vô hiệu hóa");
        }
        
        // Kiểm tra phân quyền - chỉ cho phép STAFF và MANAGER đăng nhập
        if (user.getRole() == UserRole.USER) {
            throw new BadCredentialsException("Không đủ quyền hạn để đăng nhập vào hệ thống quản trị");
        }
        
        // Tạo token JWT
        String token = jwtService.generateToken(user.getEmail());
        
        // Tạo response DTO
        UserResponseDto userResponseDto = convertToUserResponseDto(user);
        
        return new AuthResponseDto(token, userResponseDto);
    }
    
    @Override
    public UserResponseDto getUserFromToken(String token) {
        // Lấy email từ token
        String email = jwtService.extractUsername(token);
        
        // Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        
        return convertToUserResponseDto(user);
    }
    
    @Override
    public UserResponseDto updateUserProfile(String token, UserResponseDto userDto) {
        // Lấy thông tin người dùng từ token
        String email = jwtService.extractUsername(token);
        
        // Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        
        // Cập nhật thông tin
        user.setName(userDto.getName());
        if (userDto.getMobileNumber() != null) {
            user.setMobileNumber(userDto.getMobileNumber());
        }
        if (userDto.getProfileImage() != null) {
            user.setProfileImage(userDto.getProfileImage());
        }
        
        // Lưu thông tin đã cập nhật
        user = userRepository.save(user);
        
        // Trả về thông tin đã cập nhật
        return convertToUserResponseDto(user);
    }
    
    @Override
    public void updatePassword(String token, PasswordUpdateDto passwordDto) {
        // Lấy thông tin người dùng từ token
        String email = jwtService.extractUsername(token);
        
        // Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        
        // Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(passwordDto.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }
        
        // Kiểm tra mật khẩu mới hợp lệ
        validatePassword(passwordDto.getNewPassword());
        
        // Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
        if (passwordEncoder.matches(passwordDto.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }
        
        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(passwordDto.getNewPassword()));
        
        // Lưu thông tin đã cập nhật
        userRepository.save(user);
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
                user.getRole()
        );
    }
} 