package com.example.backend.service.impl;

import com.example.backend.model.Brand;
import com.example.backend.model.Product;
import com.example.backend.repository.BrandRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.BrandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    
    @Autowired
    public BrandServiceImpl(BrandRepository brandRepository, ProductRepository productRepository) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }
    
    @Override
    public List<Brand> getAllBrands() {
        return brandRepository.findAll();
    }
    
    @Override
    public Brand saveBrand(Brand brand) {
        return brandRepository.save(brand);
    }
    
    @Override
    public Optional<Brand> getBrandById(Long id) {
        return brandRepository.findById(id);
    }
    
    @Override
    public Optional<Brand> getBrandBySlug(String slug) {
        return brandRepository.findBySlug(slug);
    }
    
    @Override
    public void deleteBrand(Long id) {
        brandRepository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Brand> getBrandsByCategoryId(Long categoryId) {
        // Get all products in the category
        List<Product> productsInCategory = productRepository.findByCategoryId(categoryId);
        
        // Extract unique brand IDs
        Set<Long> brandIdsSet = new HashSet<>();
        for (Product product : productsInCategory) {
            if (product.getBrand() != null) {
                brandIdsSet.add(product.getBrand().getId());
            }
        }
        
        // If no brands found, return empty list
        if (brandIdsSet.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Convert set to list for the query
        List<Long> brandIds = new ArrayList<>(brandIdsSet);
        
        // Get brands by IDs
        return brandRepository.findAllById(brandIds);
    }
}