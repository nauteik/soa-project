package com.example.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // External directory location for storing images
        // Map "/static/images/**" URL pattern to the external file system location
        String uploadPath = System.getProperty("user.dir") + "/uploads/images/";
        
        // Ensure the path is properly formatted for different OS
        Path uploadDir = Paths.get(uploadPath);
        String uploadDirPath = uploadDir.toFile().getAbsolutePath();
        
        // Map "/static/images/**" URL pattern to the file system location
        registry.addResourceHandler("/static/images/**")
                .addResourceLocations("file:" + uploadDirPath + "/");
    }
}