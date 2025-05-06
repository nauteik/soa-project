package com.example.backend.service.impl;
import com.example.backend.model.Category;
import com.example.backend.model.Product;
import com.example.backend.model.Brand;
import com.example.backend.model.ProductImage;
import com.example.backend.dto.ProductCreateDTO;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.BrandRepository;
import com.example.backend.repository.ProductImageRepository;
import com.example.backend.service.ProductService;
import com.example.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductImageRepository productImageRepository;
    private final FileStorageService fileStorageService;
    
    @Autowired
    public ProductServiceImpl(
            ProductRepository productRepository, 
            CategoryRepository categoryRepository,
            BrandRepository brandRepository,
            ProductImageRepository productImageRepository,
            FileStorageService fileStorageService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productImageRepository = productImageRepository;
        this.fileStorageService = fileStorageService;
    }
    
    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    @Override
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
    
    @Override
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }
    
    @Override
    public Optional<Product> getProductBySlug(String slug) {
        return productRepository.findBySlug(slug);
    }
    
    @Override
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    @Override
    public List<Product> getProductsByCategoryId(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFilteredProducts(
            Long categoryId, 
            List<Long> brandIds, 
            Double minPrice, 
            Double maxPrice,
            Map<String, List<String>> specifications,
            String sortBy,
            Integer skip,
            Integer limit,
            Boolean isFeatured,
            Boolean isActive) {
        
        List<Product> filteredProducts;
        
        // Step 1: Get base product list based on primary filters
        if (isFeatured != null && isActive != null) {
            filteredProducts = productRepository.findByFeaturedAndActive(isFeatured, isActive);
        } else if (categoryId != null) {
            // Use different repository methods based on sort option
            if (sortBy != null) {
                switch (sortBy) {
                    case "price_asc":
                        filteredProducts = productRepository.findActiveByCategoryIdAndSortByPriceAsc(categoryId);
                        break;
                    case "price_desc":
                        filteredProducts = productRepository.findActiveByCategoryIdAndSortByPriceDesc(categoryId);
                        break;
                    case "best_selling":
                        filteredProducts = productRepository.findActiveByCategoryIdAndSortByBestSelling(categoryId);
                        break;
                    case "newest":
                    default:
                        filteredProducts = productRepository.findActiveByCategoryIdAndSortByNewest(categoryId);
                        break;
                }
            } else {
                filteredProducts = productRepository.findActiveByCategoryId(categoryId);
            }
        } else {
            filteredProducts = productRepository.findAll();
        }
        
        // Step 2: Apply secondary filters
        
        // Brand filter
        if (brandIds != null && !brandIds.isEmpty()) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> product.getBrand() != null && brandIds.contains(product.getBrand().getId()))
                .collect(Collectors.toList());
        }
        
        // Price range filter
        if (minPrice != null && maxPrice != null) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    // Calculate discounted price using BigDecimal.multiply
                    BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                            BigDecimal.valueOf(product.getDiscount()).divide(BigDecimal.valueOf(100.0)));
                    BigDecimal actualPrice = product.getPrice().multiply(discountMultiplier);
                    
                    return actualPrice.doubleValue() >= minPrice && actualPrice.doubleValue() <= maxPrice;
                })
                .collect(Collectors.toList());
        } else if (minPrice != null) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    // Calculate discounted price using BigDecimal.multiply
                    BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                            BigDecimal.valueOf(product.getDiscount()).divide(BigDecimal.valueOf(100.0)));
                    BigDecimal actualPrice = product.getPrice().multiply(discountMultiplier);
                    
                    return actualPrice.doubleValue() >= minPrice;
                })
                .collect(Collectors.toList());
        } else if (maxPrice != null) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    // Calculate discounted price using BigDecimal.multiply
                    BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                            BigDecimal.valueOf(product.getDiscount()).divide(BigDecimal.valueOf(100.0)));
                    BigDecimal actualPrice = product.getPrice().multiply(discountMultiplier);
                    
                    return actualPrice.doubleValue() <= maxPrice;
                })
                .collect(Collectors.toList());
        }
        
        // Specifications filter
        if (specifications != null && !specifications.isEmpty()) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    Map<String, Object> productSpecs = product.getSpecifications();
                    
                    // If product has no specifications, it doesn't match
                    if (productSpecs == null || productSpecs.isEmpty()) {
                        return false;
                    }
                    
                    // Check if all specification filters match
                    for (Map.Entry<String, List<String>> entry : specifications.entrySet()) {
                        String specKey = entry.getKey();
                        List<String> allowedValues = entry.getValue();
                        
                        // If no values specified for this spec key, skip this filter
                        if (allowedValues == null || allowedValues.isEmpty()) {
                            continue;
                        }
                        
                        // Get the product's value for this specification
                        Object productSpecValue = productSpecs.get(specKey);
                        
                        // If product doesn't have this specification, it doesn't match
                        if (productSpecValue == null) {
                            return false;
                        }
                        
                        // Xử lý khác nhau tùy theo kiểu dữ liệu của specifications
                        boolean matchesAny = false;
                        
                        if (productSpecValue instanceof String || productSpecValue instanceof Number || productSpecValue instanceof Boolean) {
                            // Đối với giá trị đơn
                            String valueStr = String.valueOf(productSpecValue);
                            matchesAny = allowedValues.contains(valueStr);
                        } else if (productSpecValue instanceof List || productSpecValue instanceof Object[]) {
                            // Đối với danh sách giá trị
                            List<?> valueList;
                            if (productSpecValue instanceof Object[]) {
                                valueList = Arrays.asList((Object[]) productSpecValue);
                            } else {
                                valueList = (List<?>) productSpecValue;
                            }
                            
                            // Kiểm tra nếu bất kỳ giá trị nào trong danh sách của sản phẩm khớp với bất kỳ giá trị nào trong danh sách cho phép
                            for (Object item : valueList) {
                                String itemStr = String.valueOf(item);
                                if (allowedValues.contains(itemStr)) {
                                    matchesAny = true;
                                    break;
                                }
                            }
                        } else if (productSpecValue instanceof Map) {
                            // Đối với Map - duyệt qua các giá trị
                            Map<?, ?> valueMap = (Map<?, ?>) productSpecValue;
                            for (Object mapValue : valueMap.values()) {
                                String mapValueStr = String.valueOf(mapValue);
                                if (allowedValues.contains(mapValueStr)) {
                                    matchesAny = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!matchesAny) {
                            return false;
                        }
                    }
                    
                    return true;
                })
                .collect(Collectors.toList());
        }
        
        // Calculate total before pagination
        int total = filteredProducts.size();
        
        // Apply pagination
        if (skip != null && limit != null) {
            int startIndex = Math.min(skip, total);
            int endIndex = Math.min(startIndex + limit, total);
            
            if (startIndex < endIndex) {
                filteredProducts = filteredProducts.subList(startIndex, endIndex);
            } else {
                filteredProducts = new ArrayList<>();
            }
        }
        
        // Prepare response
        Map<String, Object> result = new HashMap<>();
        result.put("items", filteredProducts);
        result.put("total", total);
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, List<String>> getSpecificationsByCategorySlug(String categorySlug) {
        // Tìm danh mục theo slug
        Optional<Category> categoryOpt = categoryRepository.findBySlug(categorySlug);
        
        // Nếu không tồn tại danh mục, trả về kết quả rỗng
        if (categoryOpt.isEmpty()) {
            return new HashMap<>();
        }
        
        // Lấy danh mục và ID
        Category category = categoryOpt.get();
        Long categoryId = category.getId();
        
        // Lấy danh sách tất cả ID danh mục (bao gồm danh mục con)
        List<Long> allCategoryIds = getAllChildCategoryIds(categoryId);
        System.out.println("Lấy thông số kỹ thuật cho danh mục slug: " + categorySlug + " và danh mục con: " + allCategoryIds);
        
        Map<String, List<String>> specs = new HashMap<>();
        
        // Duyệt qua từng ID danh mục
        for (Long id : allCategoryIds) {
            // Lấy tất cả sản phẩm trong danh mục này
            List<Product> products = productRepository.findByCategoryId(id);
            
            // Duyệt qua từng sản phẩm để lấy thông số kỹ thuật
            for (Product product : products) {
                if (product.getSpecifications() != null) {
                    for (Map.Entry<String, Object> entry : product.getSpecifications().entrySet()) {
                        String key = entry.getKey();
                        Object value = entry.getValue();
                        
                        // Khởi tạo danh sách giá trị nếu chưa tồn tại
                        if (!specs.containsKey(key)) {
                            specs.put(key, new ArrayList<>());
                        }
                        
                        // Xử lý các kiểu dữ liệu khác nhau
                        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
                            // Đối với kiểu đơn giản
                            String strValue = String.valueOf(value);
                            if (!specs.get(key).contains(strValue)) {
                                specs.get(key).add(strValue);
                            }
                        } else if (value instanceof List || value instanceof Object[]) {
                            // Xử lý mảng hoặc danh sách
                            List<?> valueList;
                            if (value instanceof Object[]) {
                                valueList = Arrays.asList((Object[]) value);
                            } else {
                                valueList = (List<?>) value;
                            }
                            
                            for (Object item : valueList) {
                                String strItem = String.valueOf(item);
                                if (!specs.get(key).contains(strItem)) {
                                    specs.get(key).add(strItem);
                                }
                            }
                        } else if (value instanceof Map) {
                            // Xử lý Map nếu cần
                            Map<?, ?> mapValue = (Map<?, ?>) value;
                            for (Object mapItem : mapValue.values()) {
                                String strItem = String.valueOf(mapItem);
                                if (!specs.get(key).contains(strItem)) {
                                    specs.get(key).add(strItem);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Sắp xếp các giá trị trong từng danh sách
        for (List<String> values : specs.values()) {
            Collections.sort(values);
        }
        
        return specs;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProductsByCategorySlug(
            String categorySlug,
            List<Long> brandIds, 
            Double minPrice, 
            Double maxPrice,
            Map<String, List<String>> specifications,
            String sortBy,
            Integer skip,
            Integer limit,
            Boolean isFeatured,
            Boolean isActive) {
        
        // Tìm danh mục theo slug
        Optional<Category> categoryOpt = categoryRepository.findBySlug(categorySlug);
        
        // Nếu không tồn tại danh mục, trả về kết quả rỗng
        if (categoryOpt.isEmpty()) {
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("items", new ArrayList<>());
            emptyResult.put("total", 0);
            return emptyResult;
        }
        
        // Lấy danh mục và ID
        Category category = categoryOpt.get();
        Long categoryId = category.getId();
        
        // Lấy tất cả các ID của danh mục con (bao gồm cả danh mục hiện tại)
        List<Long> allCategoryIds = getAllChildCategoryIds(categoryId);
        System.out.println("Danh sách tất cả ID danh mục (bao gồm con): " + allCategoryIds);
        
        // Không dùng getFilteredProducts mà thay thế bằng logic tương tự nhưng có chỉnh sửa
        List<Product> filteredProducts = new ArrayList<>();
        
        // Duyệt qua từng ID danh mục và lấy sản phẩm
        for (Long id : allCategoryIds) {
            // Dùng repository method phù hợp dựa trên tùy chọn sắp xếp
            List<Product> productsForCategory;
            if (sortBy != null) {
                switch (sortBy) {
                    case "price_asc":
                        productsForCategory = productRepository.findActiveByCategoryIdAndSortByPriceAsc(id);
                        break;
                    case "price_desc":
                        productsForCategory = productRepository.findActiveByCategoryIdAndSortByPriceDesc(id);
                        break;
                    case "best_selling":
                        productsForCategory = productRepository.findActiveByCategoryIdAndSortByBestSelling(id);
                        break;
                    case "newest":
                    default:
                        productsForCategory = productRepository.findActiveByCategoryIdAndSortByNewest(id);
                        break;
                }
            } else {
                productsForCategory = productRepository.findActiveByCategoryId(id);
            }
            
            filteredProducts.addAll(productsForCategory);
        }
        
        // Loại bỏ trùng lặp nếu có
        filteredProducts = filteredProducts.stream().distinct().collect(Collectors.toList());
        
        // Áp dụng bộ lọc thứ cấp
        
        // Bộ lọc thương hiệu
        if (brandIds != null && !brandIds.isEmpty()) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> product.getBrand() != null && brandIds.contains(product.getBrand().getId()))
                .collect(Collectors.toList());
        }
        
        // Bộ lọc khoảng giá
        if (minPrice != null && maxPrice != null) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                            BigDecimal.valueOf(product.getDiscount()).divide(BigDecimal.valueOf(100.0)));
                    BigDecimal actualPrice = product.getPrice().multiply(discountMultiplier);
                    
                    return actualPrice.doubleValue() >= minPrice && actualPrice.doubleValue() <= maxPrice;
                })
                .collect(Collectors.toList());
        } else if (minPrice != null) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                            BigDecimal.valueOf(product.getDiscount()).divide(BigDecimal.valueOf(100.0)));
                    BigDecimal actualPrice = product.getPrice().multiply(discountMultiplier);
                    
                    return actualPrice.doubleValue() >= minPrice;
                })
                .collect(Collectors.toList());
        } else if (maxPrice != null) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                            BigDecimal.valueOf(product.getDiscount()).divide(BigDecimal.valueOf(100.0)));
                    BigDecimal actualPrice = product.getPrice().multiply(discountMultiplier);
                    
                    return actualPrice.doubleValue() <= maxPrice;
                })
                .collect(Collectors.toList());
        }
        
        // Bộ lọc thông số kỹ thuật
        if (specifications != null && !specifications.isEmpty()) {
            filteredProducts = filteredProducts.stream()
                .filter(product -> {
                    Map<String, Object> productSpecs = product.getSpecifications();
                    
                    // If product has no specifications, it doesn't match
                    if (productSpecs == null || productSpecs.isEmpty()) {
                        return false;
                    }
                    
                    // Check if all specification filters match
                    for (Map.Entry<String, List<String>> entry : specifications.entrySet()) {
                        String specKey = entry.getKey();
                        List<String> allowedValues = entry.getValue();
                        
                        // If no values specified for this spec key, skip this filter
                        if (allowedValues == null || allowedValues.isEmpty()) {
                            continue;
                        }
                        
                        // Get the product's value for this specification
                        Object productSpecValue = productSpecs.get(specKey);
                        
                        // If product doesn't have this specification, it doesn't match
                        if (productSpecValue == null) {
                            return false;
                        }
                        
                        // Xử lý khác nhau tùy theo kiểu dữ liệu của specifications
                        boolean matchesAny = false;
                        
                        if (productSpecValue instanceof String || productSpecValue instanceof Number || productSpecValue instanceof Boolean) {
                            // Đối với giá trị đơn
                            String valueStr = String.valueOf(productSpecValue);
                            matchesAny = allowedValues.contains(valueStr);
                        } else if (productSpecValue instanceof List || productSpecValue instanceof Object[]) {
                            // Đối với danh sách giá trị
                            List<?> valueList;
                            if (productSpecValue instanceof Object[]) {
                                valueList = Arrays.asList((Object[]) productSpecValue);
                            } else {
                                valueList = (List<?>) productSpecValue;
                            }
                            
                            // Kiểm tra nếu bất kỳ giá trị nào trong danh sách của sản phẩm khớp với bất kỳ giá trị nào trong danh sách cho phép
                            for (Object item : valueList) {
                                String itemStr = String.valueOf(item);
                                if (allowedValues.contains(itemStr)) {
                                    matchesAny = true;
                                    break;
                                }
                            }
                        } else if (productSpecValue instanceof Map) {
                            // Đối với Map - duyệt qua các giá trị
                            Map<?, ?> valueMap = (Map<?, ?>) productSpecValue;
                            for (Object mapValue : valueMap.values()) {
                                String mapValueStr = String.valueOf(mapValue);
                                if (allowedValues.contains(mapValueStr)) {
                                    matchesAny = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!matchesAny) {
                            return false;
                        }
                    }
                    
                    return true;
                })
                .collect(Collectors.toList());
        }
        
        // Tính tổng số sản phẩm trước khi phân trang
        int total = filteredProducts.size();
        
        // Sắp xếp lại theo sortBy nếu cần (vì đã gộp sản phẩm từ nhiều danh mục)
        if (sortBy != null) {
            switch (sortBy) {
                case "price_asc":
                    filteredProducts.sort(Comparator.comparing(p -> p.getPrice().multiply(
                            BigDecimal.ONE.subtract(BigDecimal.valueOf(p.getDiscount()).divide(BigDecimal.valueOf(100.0))))));
                    break;
                case "price_desc":
                    filteredProducts.sort((p1, p2) -> {
                        BigDecimal p1ActualPrice = p1.getPrice().multiply(
                                BigDecimal.ONE.subtract(BigDecimal.valueOf(p1.getDiscount()).divide(BigDecimal.valueOf(100.0))));
                        BigDecimal p2ActualPrice = p2.getPrice().multiply(
                                BigDecimal.ONE.subtract(BigDecimal.valueOf(p2.getDiscount()).divide(BigDecimal.valueOf(100.0))));
                        return p2ActualPrice.compareTo(p1ActualPrice);
                    });
                    break;
                case "best_selling":
                    filteredProducts.sort(Comparator.comparing(Product::getQuantitySold).reversed());
                    break;
                case "newest":
                default:
                    filteredProducts.sort(Comparator.comparing(Product::getCreatedAt).reversed());
                    break;
            }
        }
        
        // Áp dụng phân trang
        if (skip != null && limit != null) {
            int startIndex = Math.min(skip, total);
            int endIndex = Math.min(startIndex + limit, total);
            
            if (startIndex < endIndex) {
                filteredProducts = filteredProducts.subList(startIndex, endIndex);
            } else {
                filteredProducts = new ArrayList<>();
            }
        }
        
        // Chuẩn bị kết quả
        Map<String, Object> result = new HashMap<>();
        result.put("items", filteredProducts);
        result.put("total", total);
        
        return result;
    }

    // Phương thức đệ quy để lấy tất cả ID của danh mục con
    private List<Long> getAllChildCategoryIds(Long parentCategoryId) {
        List<Long> result = new ArrayList<>();
        
        // Thêm ID của danh mục hiện tại
        result.add(parentCategoryId);
        
        // Lấy danh mục từ repository
        Optional<Category> parentCategoryOpt = categoryRepository.findById(parentCategoryId);
        if (parentCategoryOpt.isPresent()) {
            Category parentCategory = parentCategoryOpt.get();
            
            // Lấy tất cả các danh mục con trực tiếp
            Set<Category> directChildren = parentCategory.getSubcategories();
            
            // Nếu có danh mục con
            if (directChildren != null && !directChildren.isEmpty()) {
                // Duyệt qua từng danh mục con
                for (Category child : directChildren) {
                    // Thêm ID danh mục con
                    result.add(child.getId());
                    
                    // Đệ quy để lấy các ID từ các danh mục con của danh mục con này
                    result.addAll(getAllChildCategoryIds(child.getId()));
                }
            }
        }
        
        return result.stream().distinct().collect(Collectors.toList());
    }

    /**
     * Tạo mới sản phẩm từ ProductCreateDTO
     * @param productDTO Thông tin sản phẩm mới
     * @return Sản phẩm đã được tạo
     * @throws ResourceNotFoundException Nếu không tìm thấy danh mục hoặc thương hiệu
     */
    @Override
    @Transactional
    public Product createProduct(ProductCreateDTO productDTO) throws ResourceNotFoundException {
        // Kiểm tra và lấy Category
        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + productDTO.getCategoryId()));
        
        // Kiểm tra và lấy Brand
        Brand brand = brandRepository.findById(productDTO.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với ID: " + productDTO.getBrandId()));
        
        // Tạo mới đối tượng Product
        Product product = new Product();
        product.setName(productDTO.getName());
        product.setSku(productDTO.getSku());
        product.setSlug(productDTO.getSlug());
        product.setDescription(productDTO.getDescription());
        product.setPrice(BigDecimal.valueOf(productDTO.getPrice()));
        product.setDiscount(productDTO.getDiscount().floatValue());
        product.setQuantityInStock(productDTO.getQuantityInStock());
        product.setQuantitySold(0); // Sản phẩm mới chưa bán được
        product.setIsActive(productDTO.isActive());
        product.setIsFeatured(productDTO.isFeatured());
        product.setCategory(category);
        product.setBrand(brand);
        product.setSpecifications(productDTO.getSpecifications());
        
        // Lưu sản phẩm vào database
        Product savedProduct = productRepository.save(product);
        
        // Xử lý và lưu các hình ảnh
        if (productDTO.getImageDataList() != null && !productDTO.getImageDataList().isEmpty()) {
            for (Map<String, Object> imageData : productDTO.getImageDataList()) {
                MultipartFile file = (MultipartFile) imageData.get("file");
                String altText = (String) imageData.get("altText");
                Boolean isMain = (Boolean) imageData.get("isMain");
                Integer sortOrder = (Integer) imageData.get("sortOrder");
                
                try {
                    // Sử dụng FileStorageService để lưu hình ảnh
                    String savedFileName = fileStorageService.store(file);
                    
                    // Tạo ProductImage và lưu vào database
                    ProductImage productImage = new ProductImage();
                    productImage.setProduct(savedProduct);
                    productImage.setImageUrl(savedFileName); // Đường dẫn tương đối
                    productImage.setAlt(altText);
                    productImage.setIsMain(isMain);
                    productImage.setSortOrder(sortOrder);
                    
                    productImageRepository.save(productImage);
                } catch (Exception e) {
                    throw new RuntimeException("Lỗi khi lưu hình ảnh: " + e.getMessage(), e);
                }
            }
        }
        
        return savedProduct;
    }

    /**
     * Kiểm tra mã SKU đã tồn tại trong hệ thống chưa
     * @param sku Mã SKU cần kiểm tra
     * @return true nếu SKU đã tồn tại, false nếu chưa tồn tại
     */
    @Override
    public boolean isSkuExists(String sku) {
        return productRepository.existsBySku(sku);
    }

    /**
     * Cập nhật sản phẩm từ ProductCreateDTO
     * @param id ID của sản phẩm cần cập nhật 
     * @param productDTO Thông tin sản phẩm cập nhật
     * @return Sản phẩm đã được cập nhật
     * @throws ResourceNotFoundException Nếu không tìm thấy sản phẩm, danh mục hoặc thương hiệu
     */
    @Override
    @Transactional
    public Product updateProduct(Long id, ProductCreateDTO productDTO) throws ResourceNotFoundException {
        // Tìm sản phẩm cần cập nhật
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        
        // Kiểm tra và lấy Category
        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + productDTO.getCategoryId()));
        
        // Kiểm tra và lấy Brand
        Brand brand = brandRepository.findById(productDTO.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với ID: " + productDTO.getBrandId()));
        
        // Cập nhật thông tin sản phẩm
        product.setName(productDTO.getName());
        product.setSku(productDTO.getSku());
        product.setSlug(productDTO.getSlug());
        product.setDescription(productDTO.getDescription());
        product.setPrice(BigDecimal.valueOf(productDTO.getPrice()));
        product.setDiscount(productDTO.getDiscount().floatValue());
        product.setQuantityInStock(productDTO.getQuantityInStock());
        product.setIsActive(productDTO.isActive());
        product.setIsFeatured(productDTO.isFeatured());
        product.setCategory(category);
        product.setBrand(brand);
        product.setSpecifications(productDTO.getSpecifications());
        
        // Lưu sản phẩm để cập nhật thông tin
        Product savedProduct = productRepository.save(product);
        
        // Xử lý hình ảnh bị xóa
        if (productDTO.getDeletedImageIds() != null && !productDTO.getDeletedImageIds().isEmpty()) {
            for (Long imageId : productDTO.getDeletedImageIds()) {
                productImageRepository.deleteById(imageId);
            }
        }
        
        // Xử lý cập nhật thông tin hình ảnh hiện có
        if (productDTO.getExistingImagesList() != null && !productDTO.getExistingImagesList().isEmpty()) {
            for (Map<String, Object> imageData : productDTO.getExistingImagesList()) {
                Long imageId = ((Number) imageData.get("id")).longValue();
                Boolean isMain = (Boolean) imageData.get("isMain");
                String altText = (String) imageData.get("altText");
                
                // Tìm hình ảnh cần cập nhật
                productImageRepository.findById(imageId).ifPresent(image -> {
                    image.setIsMain(isMain);
                    image.setAlt(altText);
                    productImageRepository.save(image);
                });
            }
        }
        
        // Xử lý thêm hình ảnh mới
        if (productDTO.getImageDataList() != null && !productDTO.getImageDataList().isEmpty()) {
            for (Map<String, Object> imageData : productDTO.getImageDataList()) {
                MultipartFile file = (MultipartFile) imageData.get("file");
                String altText = (String) imageData.get("altText");
                Boolean isMain = (Boolean) imageData.get("isMain");
                Integer sortOrder = (Integer) imageData.get("sortOrder");
                
                try {
                    // Sử dụng FileStorageService để lưu hình ảnh
                    String savedFileName = fileStorageService.store(file);
                    
                    // Tạo ProductImage và lưu vào database
                    ProductImage productImage = new ProductImage();
                    productImage.setProduct(savedProduct);
                    productImage.setImageUrl(savedFileName); // Đường dẫn tương đối
                    productImage.setAlt(altText);
                    productImage.setIsMain(isMain);
                    productImage.setSortOrder(sortOrder);
                    
                    productImageRepository.save(productImage);
                } catch (Exception e) {
                    throw new RuntimeException("Lỗi khi lưu hình ảnh: " + e.getMessage(), e);
                }
            }
        }
        
        return savedProduct;
    }
}