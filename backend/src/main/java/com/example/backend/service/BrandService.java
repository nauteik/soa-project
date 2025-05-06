package com.example.backend.service;

import com.example.backend.model.Brand;

import java.util.List;
import java.util.Optional;

public interface BrandService {
    List<Brand> getAllBrands();
    
    Brand saveBrand(Brand brand);
    
    Optional<Brand> getBrandById(Long id);
    
    Optional<Brand> getBrandBySlug(String slug);
    
    void deleteBrand(Long id);
    
    List<Brand> getBrandsByCategoryId(Long categoryId);
}