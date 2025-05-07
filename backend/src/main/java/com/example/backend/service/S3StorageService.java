package com.example.backend.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3StorageService {

    private final AmazonS3 s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.endpoint}")
    private String s3Endpoint;

    @Autowired
    public S3StorageService(AmazonS3 s3Client) {
        this.s3Client = s3Client;
    }

    /**
     * Lưu trữ file với tên được tạo ngẫu nhiên
     * @param file File để lưu trữ
     * @return URL của file đã lưu
     */
    public String store(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null ? 
            originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        
        // Tạo tên file duy nhất để tránh xung đột
        String key = "images/" + UUID.randomUUID().toString() + fileExtension;
        
        return uploadToS3(file, key);
    }

    /**
     * Lưu trữ file với tên chỉ định
     * @param file File để lưu trữ
     * @param filename Tên file để sử dụng
     * @return URL của file đã lưu
     */
    public String storeWithName(MultipartFile file, String filename) throws IOException {
        String key = "images/" + filename;
        return uploadToS3(file, key);
    }

    /**
     * Phương thức nội bộ để tải lên S3
     */
    private String uploadToS3(MultipartFile file, String key) throws IOException {
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());
        
        PutObjectRequest putRequest = new PutObjectRequest(
                bucketName, 
                key, 
                file.getInputStream(), 
                metadata)
                .withCannedAcl(CannedAccessControlList.PublicRead); // Đặt quyền đọc công khai
        
        s3Client.putObject(putRequest);
        
        // Trả về URL của file
        return s3Client.getUrl(bucketName, key).toString();
    }

    /**
     * Xóa file từ S3
     * @param key Khóa của file cần xóa
     * @return true nếu thành công, false nếu không
     */
    public boolean delete(String key) {
        try {
            // Nếu key là URL đầy đủ, cần trích xuất phần tương đối
            if (key.startsWith("http")) {
                key = key.substring(key.indexOf("images/"));
            } else if (!key.startsWith("images/")) {
                key = "images/" + key;
            }
            
            s3Client.deleteObject(new DeleteObjectRequest(bucketName, key));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Lấy URL công khai cho một key
     * @param key Khóa S3
     * @return URL công khai
     */
    public String getPublicUrl(String key) {
        if (!key.startsWith("images/")) {
            key = "images/" + key;
        }
        return s3Client.getUrl(bucketName, key).toString();
    }
} 