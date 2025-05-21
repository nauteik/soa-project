package com.example.backend.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class S3LoggingService {

    private final AmazonS3 s3Client;
    private final ExecutorService executorService;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Autowired
    public S3LoggingService(AmazonS3 s3Client) {
        this.s3Client = s3Client;
        // Tạo một thread pool để xử lý việc ghi log bất đồng bộ
        this.executorService = Executors.newSingleThreadExecutor();
    }

    /**
     * Ghi log vào S3 với key dựa trên ngày
     * @param message Nội dung log
     * @param logLevel Cấp độ log (INFO, ERROR, DEBUG, etc.)
     */
    public void log(String message, LogLevel logLevel) {
        // Thực hiện ghi log bất đồng bộ để không ảnh hưởng đến hiệu suất
        executorService.submit(() -> {
            try {
                String logEntry = buildLogEntry(message, logLevel);
                uploadLogToS3(logEntry);
            } catch (Exception e) {
                // Xử lý lỗi ghi log
                System.err.println("Lỗi khi ghi log vào S3: " + e.getMessage());
            }
        });
    }

    /**
     * Ghi log cấp độ INFO vào S3
     * @param message Nội dung log
     */
    public void info(String message) {
        log(message, LogLevel.INFO);
    }

    /**
     * Ghi log cấp độ ERROR vào S3
     * @param message Nội dung log
     */
    public void error(String message) {
        log(message, LogLevel.ERROR);
    }

    /**
     * Ghi log cấp độ ERROR vào S3 kèm Exception
     * @param message Nội dung log
     * @param e Exception cần log
     */
    public void error(String message, Exception e) {
        StringBuilder fullMessage = new StringBuilder(message);
        fullMessage.append("\nException: ").append(e.getClass().getName());
        fullMessage.append("\nMessage: ").append(e.getMessage());
        
        // Thêm stack trace
        fullMessage.append("\nStack trace:");
        for (StackTraceElement element : e.getStackTrace()) {
            fullMessage.append("\n    ").append(element.toString());
        }
        
        log(fullMessage.toString(), LogLevel.ERROR);
    }

    /**
     * Ghi log cấp độ DEBUG vào S3
     * @param message Nội dung log
     */
    public void debug(String message) {
        log(message, LogLevel.DEBUG);
    }

    /**
     * Ghi log cấp độ WARN vào S3
     * @param message Nội dung log
     */
    public void warn(String message) {
        log(message, LogLevel.WARN);
    }

    /**
     * Tạo nội dung log với định dạng chuẩn
     */
    private String buildLogEntry(String message, LogLevel logLevel) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        String timestamp = dateFormat.format(new Date());
        
        return String.format("[%s] [%s] [%s] %s", 
                timestamp, 
                logLevel.name(), 
                Thread.currentThread().getName(),
                message);
    }

    /**
     * Tải log lên S3
     */
    private void uploadLogToS3(String logEntry) throws IOException {
        // Tạo key dựa vào ngày hiện tại
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String currentDate = dateFormat.format(new Date());
        String key = String.format("logs/%s.log", currentDate);
        
        // Kiểm tra log đã tồn tại để append hoặc tạo mới
        String existingContent = "";
        try {
            if (s3Client.doesObjectExist(bucketName, key)) {
                existingContent = s3Client.getObjectAsString(bucketName, key);
                // Thêm dòng mới nếu nội dung không trống
                if (!existingContent.isEmpty() && !existingContent.endsWith("\n")) {
                    existingContent += "\n";
                }
            }
        } catch (Exception e) {
            // Bỏ qua lỗi, tạo file log mới
        }
        
        // Nối log mới vào cuối
        String fullContent = existingContent + logEntry + "\n";
        
        // Chuẩn bị metadata
        byte[] contentBytes = fullContent.getBytes("UTF-8");
        ByteArrayInputStream inputStream = new ByteArrayInputStream(contentBytes);
        
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(contentBytes.length);
        metadata.setContentType("text/plain");
        
        // Tải lên S3
        PutObjectRequest putRequest = new PutObjectRequest(
                bucketName,
                key,
                inputStream,
                metadata)
                .withCannedAcl(CannedAccessControlList.BucketOwnerFullControl);
        
        s3Client.putObject(putRequest);
    }
    
    /**
     * Cấp độ log
     */
    public enum LogLevel {
        INFO,
        ERROR,
        DEBUG,
        WARN
    }
} 