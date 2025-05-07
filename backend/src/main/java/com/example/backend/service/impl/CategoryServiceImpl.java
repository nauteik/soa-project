package com.example.backend.service.impl;

import com.example.backend.model.Category;
import com.example.backend.model.Product;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    
    @Autowired
    public CategoryServiceImpl(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }
    
    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    @Override
    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }
    
    @Override
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
    
    @Override
    public Optional<Category> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }
    
    @Override
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryHierarchy(Long categoryId) {
        Optional<Category> categoryOpt = categoryRepository.findById(categoryId);
        
        if (categoryOpt.isEmpty()) {
            throw new IllegalArgumentException("Category not found with ID: " + categoryId);
        }
        
        Category category = categoryOpt.get();
        List<Category> ancestors = new ArrayList<>();
        
        // Find all ancestors by traversing up the tree
        Category current = category;
        while (current.getParent() != null) {
            Category parent = current.getParent();
            ancestors.add(0, parent); // Add at the beginning to maintain order
            current = parent;
        }
        
        // Find all descendants (children categories)
        List<Category> children = categoryRepository.findByParent(category);
        
        Map<String, Object> hierarchyResult = new HashMap<>();
        hierarchyResult.put("category", category);
        hierarchyResult.put("ancestors", ancestors);
        hierarchyResult.put("children", children);
        
        return hierarchyResult;
    }

    @Override
    @Transactional(readOnly = true)
    public Category findRootCategory(Category category) {
        if (category == null) {
            return null;
        }
        
        Category current = category;
        while (current.getParent() != null) {
            current = current.getParent();
        }
        
        return current;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Category> findSubcategories(Long parentId) {
        if (parentId == null) {
            return new ArrayList<>();
        }
        
        Optional<Category> parentOpt = categoryRepository.findById(parentId);
        if (parentOpt.isEmpty()) {
            return new ArrayList<>();
        }
        
        return categoryRepository.findByParent(parentOpt.get());
    }

    @Override
    @Transactional
    public Category updateCategoryWithSpecifications(Category updatedCategory, List<Category.SpecificationField> oldSpecFields) {
        // Lấy danh mục hiện tại từ DB
        Optional<Category> existingCategoryOpt = categoryRepository.findById(updatedCategory.getId());
        if (existingCategoryOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy danh mục với ID: " + updatedCategory.getId());
        }
        
        Category existingCategory = existingCategoryOpt.get();
        
        // Kiểm tra nếu danh mục này không phải là danh mục gốc
        if (existingCategory.getParent() != null) {
            throw new IllegalArgumentException("Chỉ có thể cập nhật thông số kỹ thuật cho danh mục gốc");
        }
        
        // Xử lý các thay đổi trong thông số kỹ thuật
        if (oldSpecFields != null && updatedCategory.getSpecificationFields() != null) {
            Map<String, Category.SpecificationField> oldSpecMap = oldSpecFields.stream()
                    .collect(Collectors.toMap(Category.SpecificationField::getKey, field -> field));
            
            Map<String, Category.SpecificationField> newSpecMap = updatedCategory.getSpecificationFields().stream()
                    .collect(Collectors.toMap(Category.SpecificationField::getKey, field -> field));
            
            // Kiểm tra các key đã bị xóa
            for (String oldKey : oldSpecMap.keySet()) {
                if (!newSpecMap.containsKey(oldKey)) {
                    // Kiểm tra xem key này có đang được sử dụng không trước khi xóa
                    if (isSpecificationKeyUsedInProducts(updatedCategory.getId(), oldKey)) {
                        throw new IllegalStateException("Không thể xóa thông số '" + oldKey + 
                                "' vì nó đang được sử dụng trong các sản phẩm");
                    }
                }
            }
            
            // Kiểm tra các key đã được đổi tên (key mới có cùng sortOrder và labelVi/labelEn với key cũ)
            for (Category.SpecificationField newSpec : updatedCategory.getSpecificationFields()) {
                for (Category.SpecificationField oldSpec : oldSpecFields) {
                    // Nếu không trùng key nhưng có cùng thứ tự và gần giống label, có thể đây là đổi tên key
                    if (!newSpec.getKey().equals(oldSpec.getKey()) && 
                            newSpec.getSortOrder().equals(oldSpec.getSortOrder()) &&
                            (newSpec.getLabelVi().equals(oldSpec.getLabelVi()) || 
                             newSpec.getLabelEn().equals(oldSpec.getLabelEn()))) {
                        
                        // Cập nhật key trong tất cả products
                        updateSpecificationKeyInProducts(updatedCategory.getId(), oldSpec.getKey(), newSpec.getKey());
                        break;
                    }
                }
            }
        }
        
        // Lưu category với thông số kỹ thuật mới
        return categoryRepository.save(updatedCategory);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isSpecificationKeyUsedInProducts(Long categoryId, String key) {
        // Lấy tất cả category liên quan (category hiện tại và tất cả category con)
        List<Category> relatedCategories = getAllSubcategories(categoryId);
        relatedCategories.add(categoryRepository.findById(categoryId).orElse(null));
        
        // Kiểm tra tất cả products thuộc các category này
        for (Category category : relatedCategories) {
            if (category == null) continue;
            
            List<Product> products = productRepository.findByCategory(category);
            for (Product product : products) {
                if (product.getSpecifications() != null && product.getSpecifications().containsKey(key)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    @Override
    @Transactional
    public void updateSpecificationKeyInProducts(Long categoryId, String oldKey, String newKey) {
        // Lấy tất cả category liên quan (category hiện tại và tất cả category con)
        List<Category> relatedCategories = getAllSubcategories(categoryId);
        relatedCategories.add(categoryRepository.findById(categoryId).orElse(null));
        
        // Cập nhật key trong tất cả products thuộc các category này
        for (Category category : relatedCategories) {
            if (category == null) continue;
            
            List<Product> products = productRepository.findByCategory(category);
            for (Product product : products) {
                if (product.getSpecifications() != null && product.getSpecifications().containsKey(oldKey)) {
                    // Lấy giá trị của key cũ
                    Object value = product.getSpecifications().get(oldKey);
                    
                    // Tạo map mới để tránh ConcurrentModificationException
                    Map<String, Object> updatedSpecs = new HashMap<>(product.getSpecifications());
                    
                    // Xóa key cũ và thêm key mới với cùng giá trị
                    updatedSpecs.remove(oldKey);
                    updatedSpecs.put(newKey, value);
                    
                    // Cập nhật specifications của product
                    product.setSpecifications(updatedSpecs);
                    productRepository.save(product);
                }
            }
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Category> getAllSubcategories(Long categoryId) {
        List<Category> allSubcategories = new ArrayList<>();
        Optional<Category> categoryOpt = categoryRepository.findById(categoryId);
        
        if (categoryOpt.isPresent()) {
            collectSubcategories(categoryOpt.get(), allSubcategories, new HashSet<>());
        }
        
        return allSubcategories;
    }
    
    // Helper method để thu thập tất cả category con (đệ quy)
    private void collectSubcategories(Category category, List<Category> result, Set<Long> visited) {
        // Tránh vòng lặp vô hạn trong trường hợp có lỗi dữ liệu
        if (visited.contains(category.getId())) {
            return;
        }
        
        visited.add(category.getId());
        List<Category> directSubcategories = categoryRepository.findByParent(category);
        
        result.addAll(directSubcategories);
        
        for (Category subCategory : directSubcategories) {
            collectSubcategories(subCategory, result, visited);
        }
    }
}