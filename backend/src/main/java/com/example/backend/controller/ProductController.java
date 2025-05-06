package com.example.backend.controller;

import com.example.backend.dto.ProductDTO;
import com.example.backend.model.Product;
import com.example.backend.service.ProductService;
import com.example.backend.util.ModelMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;
    private final ObjectMapper objectMapper;

    @Autowired
    public ProductController(ProductService productService, ObjectMapper objectMapper) {
        this.productService = productService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(required = false) Long category_id,
            @RequestParam(required = false) List<Long> brand_id,
            @RequestParam(required = false) Double min_price,
            @RequestParam(required = false) Double max_price,
            @RequestParam(required = false) String specifications_json,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "0") Integer skip,
            @RequestParam(required = false, defaultValue = "12") Integer limit,
            @RequestParam(required = false) Boolean is_featured,
            @RequestParam(required = false, defaultValue = "true") Boolean is_active
    ) {
        try {
            // Parse specifications JSON if provided
            Map<String, List<String>> specifications = new HashMap<>();
            if (specifications_json != null && !specifications_json.isEmpty()) {
                specifications = objectMapper.readValue(specifications_json, 
                    new TypeReference<Map<String, List<String>>>() {});
            }

            // Get filtered products
            Map<String, Object> result = productService.getFilteredProducts(
                category_id, brand_id, min_price, max_price, specifications, 
                sort, skip, limit, is_featured, is_active
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/category/slug/{categorySlug}")
    public ResponseEntity<Map<String, Object>> getProductsByCategorySlug(
            @PathVariable String categorySlug,
            @RequestParam(required = false) List<Long> brand_id,
            @RequestParam(required = false) Double min_price,
            @RequestParam(required = false) Double max_price,
            @RequestParam(required = false) String specifications_json,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "0") Integer skip,
            @RequestParam(required = false, defaultValue = "12") Integer limit,
            @RequestParam(required = false) Boolean is_featured,
            @RequestParam(required = false, defaultValue = "true") Boolean is_active
    ) {
        try {
            // Parse specifications JSON if provided
            Map<String, List<String>> specifications = new HashMap<>();
            if (specifications_json != null && !specifications_json.isEmpty()) {
                System.out.println("Received specifications_json: " + specifications_json);
                try {
                    specifications = objectMapper.readValue(specifications_json, 
                        new TypeReference<Map<String, List<String>>>() {});
                    System.out.println("Parsed specifications: " + specifications);
                } catch (Exception jsonEx) {
                    System.err.println("Error parsing specifications_json: " + jsonEx.getMessage());
                    jsonEx.printStackTrace();
                    // Tiếp tục với specifications rỗng thay vì dừng hoàn toàn
                }
            }

            // Get products by category slug
            Map<String, Object> result = productService.getProductsByCategorySlug(
                categorySlug, brand_id, min_price, max_price, specifications, 
                sort, skip, limit, is_featured, is_active
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error in getProductsByCategorySlug: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("error_type", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<Product> getProductBySlug(@PathVariable String slug) {
        Optional<Product> product = productService.getProductBySlug(slug);
        return product.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/slug/{categorySlug}/specifications")
    public ResponseEntity<Map<String, List<String>>> getSpecificationsByCategorySlug(
            @PathVariable String categorySlug) {
        Map<String, List<String>> specifications = productService.getSpecificationsByCategorySlug(categorySlug);
        return ResponseEntity.ok(specifications);
    }
}