package com.example.backend.controller;

import com.example.backend.service.FileStorageService;
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

    private final FileStorageService fileStorageService;

    @Autowired
    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String filename = fileStorageService.store(file);
            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("url", "/static/images/" + filename);
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
            String savedFilename = fileStorageService.storeWithName(file, filename);
            Map<String, String> response = new HashMap<>();
            response.put("filename", savedFilename);
            response.put("url", "/static/images/" + savedFilename);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/image/{filename}")
    public ResponseEntity<Map<String, Object>> deleteImage(@PathVariable String filename) {
        boolean deleted = fileStorageService.delete(filename);
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
}