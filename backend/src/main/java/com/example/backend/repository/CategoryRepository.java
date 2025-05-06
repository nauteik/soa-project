package com.example.backend.repository;

import com.example.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    Optional<Category> findBySlug(String slug);
    
    List<Category> findByParent(Category parent);
    
    List<Category> findByParentId(Long parentId);
    
    List<Category> findByParentIsNull();
    
    Optional<Category> findByName(String name);
}