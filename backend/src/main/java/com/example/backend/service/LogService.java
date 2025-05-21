package com.example.backend.service;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;

public interface LogService {
    
    /**
     * Ghi log cấp độ INFO
     * @param message Nội dung log
     */
    void info(String message);
    
    /**
     * Ghi log cấp độ ERROR
     * @param message Nội dung log
     */
    void error(String message);
    
    /**
     * Ghi log cấp độ ERROR kèm theo exception
     * @param message Nội dung log
     * @param e Exception cần ghi log
     */
    void error(String message, Exception e);
    
    /**
     * Ghi log cấp độ DEBUG
     * @param message Nội dung log
     */
    void debug(String message);
    
    /**
     * Ghi log cấp độ WARN
     * @param message Nội dung log
     */
    void warn(String message);
    
    /**
     * Lấy nội dung log của một ngày cụ thể
     * @param date Ngày cần lấy log
     * @return Nội dung log
     */
    String getLogsByDate(LocalDate date);
    
    /**
     * Lấy danh sách các ngày có log
     * @param startDate Ngày bắt đầu (có thể null để lấy từ đầu)
     * @param endDate Ngày kết thúc (có thể null để lấy đến hiện tại)
     * @return Danh sách các ngày có log
     */
    List<LocalDate> getLogDates(LocalDate startDate, LocalDate endDate);
    
    /**
     * Tìm kiếm trong logs theo từ khóa
     * @param keyword Từ khóa cần tìm
     * @param startDate Ngày bắt đầu (có thể null để tìm từ đầu)
     * @param endDate Ngày kết thúc (có thể null để tìm đến hiện tại)
     * @return Map chứa kết quả tìm kiếm, key là ngày, value là danh sách các dòng log
     */
    Map<LocalDate, List<String>> searchLogs(String keyword, LocalDate startDate, LocalDate endDate);
} 