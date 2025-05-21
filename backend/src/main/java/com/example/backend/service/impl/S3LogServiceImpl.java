package com.example.backend.service.impl;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ListObjectsV2Request;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.example.backend.service.LogService;
import com.example.backend.service.S3LoggingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class S3LogServiceImpl implements LogService {
    
    private final S3LoggingService s3LoggingService;
    private final AmazonS3 s3Client;
    
    @Value("${aws.s3.bucket}")
    private String bucketName;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    @Override
    public void info(String message) {
        s3LoggingService.info(message);
    }
    
    @Override
    public void error(String message) {
        s3LoggingService.error(message);
    }
    
    @Override
    public void error(String message, Exception e) {
        s3LoggingService.error(message, e);
    }
    
    @Override
    public void debug(String message) {
        s3LoggingService.debug(message);
    }
    
    @Override
    public void warn(String message) {
        s3LoggingService.warn(message);
    }
    
    @Override
    public String getLogsByDate(LocalDate date) {
        String key = getLogKey(date);
        
        try {
            if (s3Client.doesObjectExist(bucketName, key)) {
                return s3Client.getObjectAsString(bucketName, key);
            } else {
                return "Không tìm thấy log cho ngày " + date.format(DATE_FORMATTER);
            }
        } catch (Exception e) {
            return "Lỗi khi lấy log: " + e.getMessage();
        }
    }
    
    @Override
    public List<LocalDate> getLogDates(LocalDate startDate, LocalDate endDate) {
        List<LocalDate> logDates = new ArrayList<>();
        
        // Nếu không có ngày bắt đầu, lấy từ đầu
        if (startDate == null) {
            startDate = LocalDate.of(2000, 1, 1); // Ngày đủ xa trong quá khứ
        }
        
        // Nếu không có ngày kết thúc, lấy đến hiện tại
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        try {
            ListObjectsV2Request request = new ListObjectsV2Request()
                    .withBucketName(bucketName)
                    .withPrefix("logs/");
            
            ListObjectsV2Result result = s3Client.listObjectsV2(request);
            
            for (S3ObjectSummary objectSummary : result.getObjectSummaries()) {
                String key = objectSummary.getKey();
                
                // Kiểm tra xem key có đúng định dạng logs/yyyy-MM-dd.log không
                if (key.matches("logs/\\d{4}-\\d{2}-\\d{2}\\.log")) {
                    String dateStr = key.substring(5, 15); // Trích xuất yyyy-MM-dd
                    LocalDate logDate = LocalDate.parse(dateStr, DATE_FORMATTER);
                    
                    // Chỉ thêm vào nếu trong khoảng thời gian yêu cầu
                    if (!logDate.isBefore(startDate) && !logDate.isAfter(endDate)) {
                        logDates.add(logDate);
                    }
                }
            }
        } catch (Exception e) {
            // Xử lý lỗi
            e.printStackTrace();
        }
        
        // Sắp xếp theo ngày giảm dần (mới nhất trước)
        return logDates.stream()
                .sorted((d1, d2) -> d2.compareTo(d1))
                .collect(Collectors.toList());
    }
    
    @Override
    public Map<LocalDate, List<String>> searchLogs(String keyword, LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, List<String>> results = new HashMap<>();
        
        // Lấy danh sách các ngày có log
        List<LocalDate> logDates = getLogDates(startDate, endDate);
        
        // Biên dịch pattern để tìm kiếm
        Pattern pattern = Pattern.compile(".*" + Pattern.quote(keyword) + ".*", Pattern.CASE_INSENSITIVE);
        
        // Duyệt qua từng ngày và tìm kiếm
        for (LocalDate date : logDates) {
            String logContent = getLogsByDate(date);
            if (logContent != null && !logContent.startsWith("Không tìm thấy") && !logContent.startsWith("Lỗi khi lấy")) {
                // Tách nội dung log thành các dòng
                String[] lines = logContent.split("\n");
                
                // Tìm các dòng khớp với từ khóa
                List<String> matchedLines = new ArrayList<>();
                for (String line : lines) {
                    if (pattern.matcher(line).matches()) {
                        matchedLines.add(line);
                    }
                }
                
                // Thêm vào kết quả nếu có dòng nào khớp
                if (!matchedLines.isEmpty()) {
                    results.put(date, matchedLines);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Tạo key cho log dựa trên ngày
     */
    private String getLogKey(LocalDate date) {
        return String.format("logs/%s.log", date.format(DATE_FORMATTER));
    }
} 