package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * Adapter để chuyển hướng các phương thức lưu trữ file từ FileStorageService sang S3StorageService
 * Điều này giúp giữ backward compatibility với code cũ nhưng sử dụng S3 để lưu trữ
 */
@Service
public class FileStorageService {

    private final S3StorageService s3StorageService;
    private final LogService logService;

    @Autowired
    public FileStorageService(S3StorageService s3StorageService, LogService logService) {
        this.s3StorageService = s3StorageService;
        this.logService = logService;
    }

    /**
     * Store a file with a generated unique filename
     * @param file The file to store
     * @return The filename extracted from S3 URL
     */
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                logService.warn("Cố gắng lưu trữ file trống");
                throw new RuntimeException("Failed to store empty file");
            }
            
            // Sử dụng S3StorageService để lưu trữ
            String fullUrl = s3StorageService.store(file);
            
            // Trích xuất tên file từ URL đầy đủ
            String filename = extractFilenameFromUrl(fullUrl);
            logService.info("Đã lưu trữ file với tên được tạo: " + filename);
            return filename;
        } catch (IOException e) {
            logService.error("Lỗi khi lưu trữ file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }
    
    /**
     * Store a file with a specific filename
     * @param file The file to store
     * @param filename The filename to use
     * @return The filename of the stored file
     */
    public String storeWithName(MultipartFile file, String filename) {
        try {
            if (file.isEmpty()) {
                logService.warn("Cố gắng lưu trữ file trống với tên: " + filename);
                throw new RuntimeException("Failed to store empty file");
            }
            
            // Sử dụng S3StorageService để lưu trữ
            s3StorageService.storeWithName(file, filename);
            
            // Chỉ trả về tên file để giữ tương thích với interface cũ
            logService.info("Đã lưu trữ file với tên chỉ định: " + filename);
            return filename;
        } catch (IOException e) {
            logService.error("Lỗi khi lưu trữ file với tên chỉ định: " + filename, e);
            throw new RuntimeException("Failed to store file", e);
        }
    }
    
    /**
     * Delete a file from storage
     * @param filename The filename to delete
     * @return true if successful, false otherwise
     */
    public boolean delete(String filename) {
        // Ghi log trước khi xóa
        logService.info("Yêu cầu xóa file: " + filename);
        
        // Chuyển hướng sang S3StorageService
        boolean result = s3StorageService.delete(filename);
        
        // Ghi log kết quả
        if (result) {
            logService.info("Đã xóa file thành công: " + filename);
        } else {
            logService.warn("Không thể xóa file: " + filename);
        }
        
        return result;
    }
    
    /**
     * Trích xuất tên file từ URL đầy đủ của S3
     * @param url URL đầy đủ
     * @return Tên file (phần cuối cùng của URL)
     */
    private String extractFilenameFromUrl(String url) {
        return url.substring(url.lastIndexOf("/") + 1);
    }
}