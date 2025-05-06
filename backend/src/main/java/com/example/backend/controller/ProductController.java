package com.example.backend.controller;

import com.example.backend.model.Product;
import com.example.backend.service.ProductService;
import com.example.backend.dto.ProductCreateDTO;
import com.example.backend.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.ArrayList;

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

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(required = false, defaultValue = "0") Integer skip,
            @RequestParam(required = false, defaultValue = "0") Integer limit
    ) {
        try {
            // Lấy tất cả sản phẩm không có lọc
            List<Product> allProducts = productService.getAllProducts();
            
            // Tính tổng số sản phẩm
            int total = allProducts.size();
            
            // Áp dụng phân trang nếu cần
            if (limit > 0 && skip < total) {
                int end = Math.min(skip + limit, total);
                allProducts = allProducts.subList(skip, end);
            } else if (limit > 0) {
                allProducts = new ArrayList<>();
            }
            
            // Tạo response với cấu trúc giống như API khác
            Map<String, Object> result = new HashMap<>();
            result.put("items", allProducts);
            result.put("total", total);

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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestParam("name") String name,
            @RequestParam("sku") String sku,
            @RequestParam("slug") String slug,
            @RequestParam("description") String description,
            @RequestParam("price") Double price,
            @RequestParam("discount") Integer discount,
            @RequestParam("quantityInStock") Integer quantityInStock,
            @RequestParam("category_id") Long categoryId,
            @RequestParam("brand_id") Long brandId,
            @RequestParam("isActive") Boolean isActive,
            @RequestParam("isFeatured") Boolean isFeatured,
            @RequestParam("specifications") String specificationsJson,
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam("image_alt_texts") List<String> imageAltTexts,
            @RequestParam("image_is_main") List<String> imageIsMain,
            @RequestParam("image_sort_orders") List<String> imageSortOrders
    ) {
        try {
            // Kiểm tra SKU đã tồn tại chưa
            if (productService.isSkuExists(sku)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Mã SKU '" + sku + "' đã tồn tại trong hệ thống. Vui lòng sử dụng mã SKU khác.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            
            // Tạo đối tượng ProductCreateDTO để truyền dữ liệu cho service
            ProductCreateDTO productDTO = new ProductCreateDTO();
            productDTO.setName(name);
            productDTO.setSku(sku);
            productDTO.setSlug(slug);
            productDTO.setDescription(description);
            productDTO.setPrice(price);
            productDTO.setDiscount(discount);
            productDTO.setQuantityInStock(quantityInStock);
            productDTO.setCategoryId(categoryId);
            productDTO.setBrandId(brandId);
            productDTO.setActive(isActive);
            productDTO.setFeatured(isFeatured);
            
            // Chuyển đổi JSON specifications thành Map
            Map<String, Object> specifications = new HashMap<>();
            if (specificationsJson != null && !specificationsJson.isEmpty()) {
                specifications = objectMapper.readValue(specificationsJson, 
                    new TypeReference<Map<String, Object>>() {});
            }
            productDTO.setSpecifications(specifications);
            
            // Xử lý thông tin hình ảnh
            List<Map<String, Object>> imageDataList = new ArrayList<>();
            for (int i = 0; i < images.size(); i++) {
                Map<String, Object> imageData = new HashMap<>();
                imageData.put("file", images.get(i));
                imageData.put("altText", i < imageAltTexts.size() ? imageAltTexts.get(i) : name);
                imageData.put("isMain", i < imageIsMain.size() ? Boolean.parseBoolean(imageIsMain.get(i)) : false);
                imageData.put("sortOrder", i < imageSortOrders.size() ? Integer.parseInt(imageSortOrders.get(i)) : i);
                imageDataList.add(imageData);
            }
            productDTO.setImageDataList(imageDataList);
            
            // Gọi service để tạo sản phẩm mới
            Product newProduct = productService.createProduct(productDTO);
            
            // Trả về sản phẩm mới được tạo
            return ResponseEntity.status(HttpStatus.CREATED).body(newProduct);
        } catch (ResourceNotFoundException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            String errorMessage = e.getMessage();
            
            // Kiểm tra lỗi trùng SKU từ exception message
            if (errorMessage != null && errorMessage.contains("ukfhmd06dsmj6k0n90swsh8ie9g") && errorMessage.contains("duplicate key value") && errorMessage.contains("sku")) {
                // Trích xuất giá trị SKU từ thông báo lỗi nếu có
                String sku_value = "";
                int startIdx = errorMessage.indexOf("(sku)=(");
                int endIdx = errorMessage.indexOf(")", startIdx);
                if (startIdx > 0 && endIdx > startIdx) {
                    sku_value = errorMessage.substring(startIdx + 7, endIdx);
                }
                
                error.put("message", "Mã SKU '" + (sku_value.isEmpty() ? sku : sku_value) + "' đã tồn tại trong hệ thống. Vui lòng sử dụng mã SKU khác.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            
            error.put("message", "Lỗi khi tạo sản phẩm: " + errorMessage);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping(path = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("sku") String sku,
            @RequestParam("slug") String slug,
            @RequestParam("description") String description,
            @RequestParam("price") Double price,
            @RequestParam("discount") Integer discount,
            @RequestParam("quantityInStock") Integer quantityInStock,
            @RequestParam("category_id") Long categoryId,
            @RequestParam("brand_id") Long brandId,
            @RequestParam("isActive") Boolean isActive,
            @RequestParam("isFeatured") Boolean isFeatured,
            @RequestParam("specifications") String specificationsJson,
            @RequestParam(value = "new_images", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "image_alt_texts", required = false) List<String> imageAltTexts,
            @RequestParam(value = "image_is_main", required = false) List<String> imageIsMain,
            @RequestParam(value = "image_sort_orders", required = false) List<String> imageSortOrders,
            @RequestParam(value = "existing_images", required = false) String existingImagesJson,
            @RequestParam(value = "deleted_image_ids", required = false) String deletedImageIdsJson
    ) {
        try {
            // Kiểm tra sản phẩm tồn tại không
            Optional<Product> existingProductOpt = productService.getProductById(id);
            if (existingProductOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Không tìm thấy sản phẩm với ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Product existingProduct = existingProductOpt.get();
            
            // Kiểm tra SKU đã tồn tại và không phải là SKU của sản phẩm này
            if (!existingProduct.getSku().equals(sku) && productService.isSkuExists(sku)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Mã SKU '" + sku + "' đã tồn tại trong hệ thống. Vui lòng sử dụng mã SKU khác.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            
            // Tạo đối tượng DTO để cập nhật
            ProductCreateDTO productDTO = new ProductCreateDTO();
            productDTO.setName(name);
            productDTO.setSku(sku);
            productDTO.setSlug(slug);
            productDTO.setDescription(description);
            productDTO.setPrice(price);
            productDTO.setDiscount(discount);
            productDTO.setQuantityInStock(quantityInStock);
            productDTO.setCategoryId(categoryId);
            productDTO.setBrandId(brandId);
            productDTO.setActive(isActive);
            productDTO.setFeatured(isFeatured);
            
            // Chuyển đổi JSON specifications thành Map
            Map<String, Object> specifications = new HashMap<>();
            if (specificationsJson != null && !specificationsJson.isEmpty()) {
                specifications = objectMapper.readValue(specificationsJson, 
                    new TypeReference<Map<String, Object>>() {});
            }
            productDTO.setSpecifications(specifications);
            
            // Xử lý thông tin ảnh hiện có cần cập nhật
            List<Map<String, Object>> existingImagesList = new ArrayList<>();
            if (existingImagesJson != null && !existingImagesJson.isEmpty()) {
                existingImagesList = objectMapper.readValue(existingImagesJson,
                    new TypeReference<List<Map<String, Object>>>() {});
            }
            productDTO.setExistingImagesList(existingImagesList);
            
            // Xử lý danh sách ID ảnh cần xóa
            List<Long> deletedImageIds = new ArrayList<>();
            if (deletedImageIdsJson != null && !deletedImageIdsJson.isEmpty()) {
                deletedImageIds = objectMapper.readValue(deletedImageIdsJson,
                    new TypeReference<List<Long>>() {});
            }
            productDTO.setDeletedImageIds(deletedImageIds);
            
            // Xử lý thông tin hình ảnh mới
            List<Map<String, Object>> newImageDataList = new ArrayList<>();
            if (newImages != null && !newImages.isEmpty()) {
                for (int i = 0; i < newImages.size(); i++) {
                    Map<String, Object> imageData = new HashMap<>();
                    imageData.put("file", newImages.get(i));
                    imageData.put("altText", 
                        (imageAltTexts != null && i < imageAltTexts.size()) ? imageAltTexts.get(i) : name);
                    imageData.put("isMain", 
                        (imageIsMain != null && i < imageIsMain.size()) ? Boolean.parseBoolean(imageIsMain.get(i)) : false);
                    imageData.put("sortOrder", 
                        (imageSortOrders != null && i < imageSortOrders.size()) ? Integer.parseInt(imageSortOrders.get(i)) : i);
                    newImageDataList.add(imageData);
                }
            }
            productDTO.setImageDataList(newImageDataList);
            
            // Gọi service để cập nhật sản phẩm
            Product updatedProduct = productService.updateProduct(id, productDTO);
            
            // Trả về sản phẩm đã cập nhật
            return ResponseEntity.ok(updatedProduct);
        } catch (ResourceNotFoundException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            String errorMessage = e.getMessage();
            
            // Kiểm tra lỗi trùng SKU từ exception message
            if (errorMessage != null && errorMessage.contains("ukfhmd06dsmj6k0n90swsh8ie9g") && errorMessage.contains("duplicate key value") && errorMessage.contains("sku")) {
                // Trích xuất giá trị SKU từ thông báo lỗi nếu có
                String sku_value = "";
                int startIdx = errorMessage.indexOf("(sku)=(");
                int endIdx = errorMessage.indexOf(")", startIdx);
                if (startIdx > 0 && endIdx > startIdx) {
                    sku_value = errorMessage.substring(startIdx + 7, endIdx);
                }
                
                error.put("message", "Mã SKU '" + (sku_value.isEmpty() ? sku : sku_value) + "' đã tồn tại trong hệ thống. Vui lòng sử dụng mã SKU khác.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            
            error.put("message", "Lỗi khi cập nhật sản phẩm: " + errorMessage);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}