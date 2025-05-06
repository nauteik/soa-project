package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootLocation;

    public FileStorageService() {
        // Create the uploads/images directory in the project root
        String uploadPath = System.getProperty("user.dir") + "/uploads/images";
        this.rootLocation = Paths.get(uploadPath);
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    /**
     * Store a file with a generated unique filename
     * @param file The file to store
     * @return The filename of the stored file
     */
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file");
            }
            
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            
            // Generate a unique filename to avoid collisions
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            
            Path destinationFile = this.rootLocation.resolve(
                Paths.get(newFilename))
                .normalize().toAbsolutePath();
            
            // Check that the destination is inside the target directory
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new RuntimeException("Cannot store file outside current directory");
            }
            
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
            
            return newFilename;
        } catch (IOException e) {
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
                throw new RuntimeException("Failed to store empty file");
            }
            
            Path destinationFile = this.rootLocation.resolve(
                Paths.get(filename))
                .normalize().toAbsolutePath();
            
            // Check that the destination is inside the target directory
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new RuntimeException("Cannot store file outside current directory");
            }
            
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
            
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
    
    /**
     * Delete a file from storage
     * @param filename The filename to delete
     * @return true if successful, false otherwise
     */
    public boolean delete(String filename) {
        try {
            Path file = rootLocation.resolve(filename);
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            return false;
        }
    }
}