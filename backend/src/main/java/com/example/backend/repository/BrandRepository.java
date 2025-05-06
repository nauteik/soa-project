package com.example.backend.repository;

import com.example.backend.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    
    Optional<Brand> findBySlug(String slug);
    
    Optional<Brand> findByName(String name);
}