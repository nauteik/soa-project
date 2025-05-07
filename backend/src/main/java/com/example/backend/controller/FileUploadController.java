package com.example.backend.controller;

import com.example.backend.service.S3StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    private final S3StorageService s3StorageService;

    @Autowired
    public FileUploadController(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = s3StorageService.store(file);
            Map<String, String> response = new HashMap<>();
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            response.put("filename", filename);
            response.put("url", imageUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/image/named")
    public ResponseEntity<Map<String, String>> uploadImageWithName(
            @RequestParam("file") MultipartFile file,
            @RequestParam("filename") String filename) {
        try {
            String imageUrl = s3StorageService.storeWithName(file, filename);
            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("url", imageUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/image/{filename}")
    public ResponseEntity<Map<String, Object>> deleteImage(@PathVariable String filename) {
        boolean deleted = s3StorageService.delete(filename);
        Map<String, Object> response = new HashMap<>();
        
        if (deleted) {
            response.put("success", true);
            response.put("message", "File deleted successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "File not found or couldn't be deleted");
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/image/{filename}")
    public ResponseEntity<Map<String, String>> getImageUrl(@PathVariable String filename) {
        try {
            String imageUrl = s3StorageService.getPublicUrl(filename);
            Map<String, String> response = new HashMap<>();
            response.put("url", imageUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}