package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${aws.s3.endpoint}")
    private String s3Endpoint;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Đăng ký xử lý URL /static/images/ để sử dụng tài nguyên từ S3
        registry.addResourceHandler("/static/images/**")
                .addResourceLocations(s3Endpoint + "/" + bucketName + "/images/");
    }
}