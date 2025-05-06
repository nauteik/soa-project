package com.example.backend.config;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * DataLoader for populating the database with sample data.
 * This component runs on application startup to seed the database.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {
    
    // Repositories
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;
    // Currency conversion rate (1 USD = 24,000 VND)
    
    // Base URL for static images
    private final PasswordEncoder passwordEncoder;


    // Random generator
    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        // Create user
        log.info("Creating user...");
        createUser();
        if (isDataAlreadyLoaded()) {
            log.info("Database already contains data, skipping data load");
            return;
        }
        
        log.info("Starting to load sample data...");
        
        try {
            // Create brands
            log.info("Creating brands...");
            List<Brand> brands = createBrands();
            
            // Create categories
            log.info("Creating categories...");
            Map<String, Category> categories = createCategories();
            
            // Create products
            log.info("Creating products...");
            List<Product> products = createProducts(brands, categories);
            


            // Create product images
            log.info("Creating product images...");
            createProductImages(products);
            
            log.info("Sample data loaded successfully!");
        } catch (Exception e) {
            log.error("Error loading sample data", e);
        }
    }
    
    /**
     * Check if data is already loaded in the database
     */
    private boolean isDataAlreadyLoaded() {
        return brandRepository.count() > 0 && categoryRepository.count() > 0 && productRepository.count() > 0;
    }
    private User createUser() {
        // Check if a manager user already exists
        if (userRepository.findByRole(UserRole.MANAGER).isEmpty()) {
            User user = new User();
            user.setEmail("admin@gmail.com");
            user.setPassword(passwordEncoder.encode("123456"));
            user.setName("Admin");
            user.setRole(UserRole.MANAGER);
            return userRepository.save(user);
        }
        return null;
    }
    /**
     * Create sample brands
     */
    private List<Brand> createBrands() {
        List<Brand> brands = Arrays.asList(
            new Brand()
                .setName("Dell")
                .setSlug("dell")
                .setLogoUrl("dell-logo.png")
                .setDescription("Dell Technologies Inc. is an American technology company that designs, develops, and manufactures personal computers, servers, and other computer-related products."),
            
            new Brand()
                .setName("HP")
                .setSlug("hp")
                .setLogoUrl("hp-logo.png")
                .setDescription("HP Inc. is an American multinational information technology company that develops personal computers, printers and related supplies."),
            
            new Brand()
                .setName("Apple")
                .setSlug("apple")
                .setLogoUrl("apple-logo.png")
                .setDescription("Apple Inc. is an American multinational technology company that designs, manufactures, and markets smartphones, personal computers, tablets, and other consumer electronics."),
            
            new Brand()
                .setName("Lenovo")
                .setSlug("lenovo")
                .setLogoUrl("lenovo-logo.png")
                .setDescription("Lenovo Group Limited is a Chinese multinational technology company specializing in designing, manufacturing, and marketing consumer electronics, personal computers, software, business solutions."),
            
            new Brand()
                .setName("Asus")
                .setSlug("asus")
                .setLogoUrl("asus-logo.png")
                .setDescription("ASUSTek Computer Inc. is a Taiwanese multinational computer hardware and consumer electronics company that produces desktops, laptops, mobile phones, and hardware.")
        );
        
        return brandRepository.saveAll(brands);
    }
    
    /**
     * Create sample categories with parent-child relationships
     */
    private Map<String, Category> createCategories() {
        // Main categories
        Category laptops = new Category()
                .setName("Laptops")
                .setSlug("laptops")
                .setDescription("All types of laptops");
        
        Category mouse = new Category()
                .setName("Mouse")
                .setSlug("mouses")
                .setDescription("Computer mice for laptops");
        
        Category keyboard = new Category()
                .setName("Keyboard")
                .setSlug("keyboards")
                .setDescription("External keyboards for laptops");
        
        Category monitor = new Category()
                .setName("Monitor")
                .setSlug("monitors")
                .setDescription("External monitors for laptops");
        
        Category usbHub = new Category()
                .setName("USB Hub")
                .setSlug("hubs")
                .setDescription("USB hubs and docking stations");
        
        Category charger = new Category()
                .setName("Charger")
                .setSlug("chargers")
                .setDescription("Laptop chargers and power adapters");
        
        // Save main categories first to get IDs
        List<Category> mainCategories = Arrays.asList(laptops, mouse, keyboard, monitor, usbHub, charger);
        categoryRepository.saveAll(mainCategories);
        
        // Create laptop subcategories
        Category gamingLaptops = new Category()
                .setName("Gaming Laptops")
                .setSlug("gaming-laptops")
                .setDescription("Laptops designed for gaming")
                .setParent(laptops);
        
        Category businessLaptops = new Category()
                .setName("Business Laptops")
                .setSlug("business-laptops")
                .setDescription("Laptops for business and professional use")
                .setParent(laptops);
        
        Category ultrabooks = new Category()
                .setName("Ultrabooks")
                .setSlug("ultrabooks")
                .setDescription("Thin and lightweight laptops")
                .setParent(laptops);
        
        // Save subcategories
        List<Category> subCategories = Arrays.asList(gamingLaptops, businessLaptops, ultrabooks);
        categoryRepository.saveAll(subCategories);
        
        // Create map for easy access by slug
        List<Category> allCategories = new ArrayList<>();
        allCategories.addAll(mainCategories);
        allCategories.addAll(subCategories);
        
        // Thêm specificationFields cho từng category cha
        laptops.setSpecificationFields(List.of(
            new Category.SpecificationField("ram_gb", "RAM", "RAM", "number", 1),
            new Category.SpecificationField("cpu_brand", "Hãng CPU", "CPU Brand", "string", 2),
            new Category.SpecificationField("cpu_series", "Dòng CPU", "CPU Series", "string", 3),
            new Category.SpecificationField("cpu_model", "Model CPU", "CPU Model", "string", 4),
            new Category.SpecificationField("screen_size_inch", "Kích thước màn hình", "Screen Size", "number", 5),
            new Category.SpecificationField("screen_resolution", "Độ phân giải", "Screen Resolution", "string", 6),
            new Category.SpecificationField("refresh_rate_hz", "Tần số quét", "Refresh Rate", "number", 7),
            new Category.SpecificationField("storage_gb", "Dung lượng lưu trữ", "Storage Capacity", "number", 8),
            new Category.SpecificationField("storage_type", "Loại ổ cứng", "Storage Type", "string", 9),
            new Category.SpecificationField("graphics_card", "Card đồ họa", "Graphics Card", "string", 10),
            new Category.SpecificationField("weight_kg", "Trọng lượng", "Weight", "number", 11),
            new Category.SpecificationField("battery_life_hours", "Thời lượng pin", "Battery Life", "number", 12),
            new Category.SpecificationField("ports", "Cổng kết nối", "Ports", "list", 13),
            new Category.SpecificationField("features", "Tính năng đặc biệt", "Features", "list", 14),
            new Category.SpecificationField("usage_type", "Nhu cầu sử dụng", "Usage Type", "string", 15),
            new Category.SpecificationField("os", "Hệ điều hành", "Operating System", "string", 16),
            new Category.SpecificationField("color", "Màu sắc", "Color", "string", 17)
        ));
        mouse.setSpecificationFields(List.of(
            new Category.SpecificationField("connection_type", "Kiểu kết nối", "Connection Type", "string", 1),
            new Category.SpecificationField("dpi", "Độ nhạy (DPI)", "DPI", "number", 2),
            new Category.SpecificationField("buttons", "Số nút bấm", "Buttons", "number", 3),
            new Category.SpecificationField("rgb_lighting", "Đèn RGB", "RGB Lighting", "boolean", 4),
            new Category.SpecificationField("weight_g", "Trọng lượng", "Weight (g)", "number", 5),
            new Category.SpecificationField("battery_life_hours", "Thời lượng pin", "Battery Life", "number", 6),
            new Category.SpecificationField("features", "Tính năng đặc biệt", "Features", "list", 7),
            new Category.SpecificationField("purpose_tags", "Nhu cầu sử dụng", "Purpose Tags", "list", 8)
        ));
        keyboard.setSpecificationFields(List.of(
            new Category.SpecificationField("connection_type", "Kiểu kết nối", "Connection Type", "string", 1),
            new Category.SpecificationField("switch_type", "Loại switch", "Switch Type", "string", 2),
            new Category.SpecificationField("layout", "Layout", "Layout", "string", 3),
            new Category.SpecificationField("numpad", "Có numpad", "Numpad", "boolean", 4),
            new Category.SpecificationField("rgb_lighting", "Đèn RGB", "RGB Lighting", "boolean", 5),
            new Category.SpecificationField("weight_g", "Trọng lượng", "Weight (g)", "number", 6),
            new Category.SpecificationField("battery_life_hours", "Thời lượng pin", "Battery Life", "number", 7),
            new Category.SpecificationField("features", "Tính năng đặc biệt", "Features", "list", 8),
            new Category.SpecificationField("purpose_tags", "Nhu cầu sử dụng", "Purpose Tags", "list", 9)
        ));
        monitor.setSpecificationFields(List.of(
            new Category.SpecificationField("screen_size_inch", "Kích thước màn hình", "Screen Size", "number", 1),
            new Category.SpecificationField("resolution", "Độ phân giải", "Resolution", "string", 2),
            new Category.SpecificationField("panel_type", "Loại tấm nền", "Panel Type", "string", 3),
            new Category.SpecificationField("refresh_rate_hz", "Tần số quét", "Refresh Rate", "number", 4),
            new Category.SpecificationField("response_time_ms", "Thời gian phản hồi", "Response Time (ms)", "number", 5),
            new Category.SpecificationField("hdr_support", "Hỗ trợ HDR", "HDR Support", "string", 6),
            new Category.SpecificationField("ports", "Cổng kết nối", "Ports", "list", 7),
            new Category.SpecificationField("features", "Tính năng đặc biệt", "Features", "list", 8),
            new Category.SpecificationField("purpose_tags", "Nhu cầu sử dụng", "Purpose Tags", "list", 9)
        ));
        usbHub.setSpecificationFields(List.of(
            new Category.SpecificationField("connection_type", "Kiểu kết nối", "Connection Type", "string", 1),
            new Category.SpecificationField("ports", "Cổng kết nối", "Ports", "list", 2),
            new Category.SpecificationField("power_delivery_w", "Công suất Power Delivery", "Power Delivery (W)", "number", 3),
            new Category.SpecificationField("max_display_resolution", "Độ phân giải tối đa", "Max Display Resolution", "string", 4),
            new Category.SpecificationField("features", "Tính năng đặc biệt", "Features", "list", 5),
            new Category.SpecificationField("purpose_tags", "Nhu cầu sử dụng", "Purpose Tags", "list", 6)
        ));
        charger.setSpecificationFields(List.of(
            new Category.SpecificationField("type", "Loại sạc", "Type", "string", 1),
            new Category.SpecificationField("power_w", "Công suất (W)", "Power (W)", "number", 2),
            new Category.SpecificationField("ports", "Cổng sạc", "Ports", "list", 3),
            new Category.SpecificationField("fast_charging", "Hỗ trợ sạc nhanh", "Fast Charging", "boolean", 4),
            new Category.SpecificationField("connector_type", "Loại đầu nối", "Connector Type", "string", 5),
            new Category.SpecificationField("cable_length_m", "Chiều dài cáp (m)", "Cable Length (m)", "number", 6),
            new Category.SpecificationField("data_transfer_speed", "Tốc độ truyền dữ liệu", "Data Transfer Speed", "string", 7),
            new Category.SpecificationField("wireless_standard", "Chuẩn sạc không dây", "Wireless Standard", "string", 8),
            new Category.SpecificationField("max_charging_speed", "Tốc độ sạc tối đa", "Max Charging Speed", "string", 9),
            new Category.SpecificationField("features", "Tính năng đặc biệt", "Features", "list", 10),
            new Category.SpecificationField("purpose_tags", "Nhu cầu sử dụng", "Purpose Tags", "list", 11)
        ));
        categoryRepository.saveAll(mainCategories);
        
        return allCategories.stream()
                .collect(Collectors.toMap(Category::getSlug, Function.identity()));
    }
    
    /**
     * Create sample products and associate with brands and categories
     */
    private List<Product> createProducts(List<Brand> brands, Map<String, Category> categories) {
        List<Product> products = new ArrayList<>();
        
        // Get categories by slug
        Category gamingCategory = categories.get("gaming-laptops");
        Category businessCategory = categories.get("business-laptops");
        Category ultrabookCategory = categories.get("ultrabooks");
        Category mouseCategory = categories.get("mouses");
        Category keyboardCategory = categories.get("keyboards");
        Category monitorCategory = categories.get("monitors");
        Category hubCategory = categories.get("hubs");
        Category chargerCategory = categories.get("chargers");
        
        // Create gaming laptops
        products.addAll(createGamingLaptops(brands, gamingCategory));
        
        // Create business laptops
        products.addAll(createBusinessLaptops(brands, businessCategory));
        
        // Create ultrabooks
        products.addAll(createUltrabooks(brands, ultrabookCategory));
        
        // Create accessories
        products.addAll(createMice(brands, mouseCategory));
        products.addAll(createKeyboards(brands, keyboardCategory));
        products.addAll(createMonitors(brands, monitorCategory));
        products.addAll(createHubs(brands, hubCategory));
        products.addAll(createChargers(brands, chargerCategory));
        
        return products;
    }
    
    /**
     * Create gaming laptops
     */
    private List<Product> createGamingLaptops(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] cpuBrands = {"Intel", "AMD"};
        String[] cpuSeries = {"Core i7", "Core i9", "Ryzen 7", "Ryzen 9"};
        String[] cpuModels = {"13700H", "13900HX", "7800X", "7950X"};
        int[] ramSizes = {16, 32, 64};
        int[] storageSizes = {512, 1000, 2000};
        String[] gpus = {"NVIDIA GeForce RTX 4060", "NVIDIA GeForce RTX 4070", "NVIDIA GeForce RTX 4080", "NVIDIA GeForce RTX 4090"};
        String[] colors = {"Black", "Dark Grey", "Blue", "Red"};
        
        for (int i = 0; i < 6; i++) {
            Brand brand = brands.get(i % brands.size());
            String cpuBrand = cpuBrands[i % cpuBrands.length];
            String cpuSerie = cpuSeries[i % cpuSeries.length];
            String cpuModel = cpuModels[i % cpuModels.length];
            int ram = ramSizes[i % ramSizes.length];
            int storage = storageSizes[i % storageSizes.length];
            String gpu = gpus[i % gpus.length];
            String color = colors[i % colors.length];
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("cpu_brand", cpuBrand);
            specs.put("cpu_series", cpuSerie);
            specs.put("cpu_model", cpuModel);
            specs.put("ram_gb", ram);
            specs.put("storage_type", "SSD");
            specs.put("storage_gb", storage);
            specs.put("screen_size_inch", 15.6 + (i % 2) * 1.7);
            specs.put("screen_resolution", i % 2 == 0 ? "1920x1080" : "2560x1440");
            specs.put("refresh_rate_hz", 144 + (i % 3) * 21);
            specs.put("graphics_card", gpu);
            specs.put("weight_kg", 2.3 + (i % 5) * 0.1);
            specs.put("battery_life_hours", 5 + (i % 3));
            specs.put("ports", Arrays.asList("USB-C", "USB-A", "HDMI", "Ethernet", "Audio Jack"));
            specs.put("features", Arrays.asList("Bàn phím RGB", "Tần số quét cao", "Tản nhiệt cao cấp"));
            specs.put("usage_type", "Gaming - Đồ họa");
            specs.put("os", "Windows 11");
            specs.put("color", color);
            
            // Generate price (20-45 million VND for gaming)
            BigDecimal price = BigDecimal.valueOf((random.nextInt(26) + 20) * 1000000);
            
            // Create model number
            String modelNumber = String.format("%04d", random.nextInt(9000) + 1000);
            
            // Create product name
            String name = String.format("%s %s %s", brand.getName(), cpuSerie, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("GM", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(10 + random.nextInt(91))
                    .setQuantitySold(random.nextInt(50))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create business laptops
     */
    private List<Product> createBusinessLaptops(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] cpuBrands = {"Intel", "AMD"};
        String[] cpuSeries = {"Core i5", "Core i7", "Ryzen 5", "Ryzen 7"};
        String[] cpuModels = {"1240P", "1280P", "7640U", "7840U"};
        int[] ramSizes = {8, 16, 32};
        int[] storageSizes = {256, 512, 1000};
        String[] colors = {"Silver", "Black", "Grey", "Blue"};
        
        for (int i = 0; i < 6; i++) {
            Brand brand = brands.get((i + 1) % brands.size());
            String cpuBrand = cpuBrands[i % cpuBrands.length];
            String cpuSerie = cpuSeries[i % cpuSeries.length];
            String cpuModel = cpuModels[i % cpuModels.length];
            int ram = ramSizes[i % ramSizes.length];
            int storage = storageSizes[i % storageSizes.length];
            String color = colors[i % colors.length];
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("cpu_brand", cpuBrand);
            specs.put("cpu_series", cpuSerie);
            specs.put("cpu_model", cpuModel);
            specs.put("ram_gb", ram);
            specs.put("storage_type", "SSD");
            specs.put("storage_gb", storage);
            specs.put("screen_size_inch", 14.0 + (i % 2) * 1.6);
            specs.put("screen_resolution", "1920x1080");
            specs.put("refresh_rate_hz", 60);
            specs.put("graphics_card", cpuBrand.equals("Intel") ? "Intel Iris Xe" : "AMD Radeon Graphics");
            specs.put("weight_kg", 1.4 + (i % 5) * 0.1);
            specs.put("battery_life_hours", 10 + (i % 5) * 2);
            specs.put("ports", Arrays.asList("USB-C", "USB-A", "HDMI", "Audio Jack"));
            specs.put("features", Arrays.asList("Bảo mật vân tay", "Bàn phím chống tràn", "Màn hình chống nhìn trộm"));
            specs.put("usage_type", "Sinh viên - Văn phòng");
            specs.put("os", "Windows 11");
            specs.put("color", color);
            
            // Generate price (15-30 million VND for business)
            BigDecimal price = BigDecimal.valueOf((random.nextInt(16) + 15) * 1000000);
            
            // Create model number
            String modelNumber = String.format("%04d", random.nextInt(9000) + 1000);
            
            // Create product name
            String name = String.format("%s %s %s", brand.getName(), cpuSerie, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("BZ", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(10 + random.nextInt(91))
                    .setQuantitySold(random.nextInt(50))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create ultrabooks
     */
    private List<Product> createUltrabooks(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] cpuBrands = {"Intel", "Apple", "AMD"};
        String[] cpuSeries = {"Core i7", "Apple M2 series", "Core i5", "Core Ultra"};
        String[] cpuModels = {"1260P", "Pro", "1240U", "7 155H"};
        int[] ramSizes = {8, 16, 32};
        int[] storageSizes = {256, 512, 1000};
        String[] colors = {"Silver", "Space Grey", "Rose Gold", "Black"};
        String[] resolutions = {"2560x1600", "3024x1964", "2256x1504", "2880x1800"};
        
        for (int i = 0; i < 6; i++) {
            Brand brand = brands.get((i + 2) % brands.size());
            String cpuBrand = cpuBrands[i % cpuBrands.length];
            String cpuSerie = cpuSeries[i % cpuSeries.length];
            String cpuModel = cpuModels[i % cpuModels.length];
            int ram = ramSizes[i % ramSizes.length];
            int storage = storageSizes[i % storageSizes.length];
            String color = colors[i % colors.length];
            String resolution = resolutions[i % resolutions.length];
            
            // Apple products should use Apple brand
            if (cpuBrand.equals("Apple")) {
                brand = brands.stream()
                        .filter(b -> b.getName().equals("Apple"))
                        .findFirst()
                        .orElse(brands.get(0));
            }
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("cpu_brand", cpuBrand);
            specs.put("cpu_series", cpuSerie);
            specs.put("cpu_model", cpuModel);
            specs.put("ram_gb", ram);
            specs.put("storage_type", "SSD");
            specs.put("storage_gb", storage);
            specs.put("screen_size_inch", 13.0 + (i % 3) * 0.6);
            specs.put("screen_resolution", resolution);
            specs.put("refresh_rate_hz", cpuBrand.equals("Apple") ? 120 : 60 + (i % 2) * 30);
            specs.put("graphics_card", cpuBrand.equals("Apple") ? "Apple " + cpuSerie : 
                       cpuBrand.equals("Intel") ? (cpuSerie.contains("Ultra") ? "Intel Arc Graphics" : "Intel Iris Xe") : 
                       "AMD Radeon Graphics");
            specs.put("weight_kg", 1.0 + (i % 6) * 0.1);
            specs.put("battery_life_hours", 15 + (i % 4));
            specs.put("ports", cpuBrand.equals("Apple") ? 
                      Arrays.asList("USB-C", "Thunderbolt", "MagSafe") : 
                      Arrays.asList("USB-C", "Thunderbolt", "USB-A", "HDMI"));
            specs.put("features", Arrays.asList("Thiết kế siêu mỏng", "Bàn phím có đèn nền", "Cảm biến vân tay"));
            specs.put("usage_type", "Mỏng nhẹ");
            specs.put("os", cpuBrand.equals("Apple") ? "macOS" : "Windows 11");
            specs.put("color", color);
            
            // Generate price (18-35 million VND for ultrabooks)
            BigDecimal price = BigDecimal.valueOf((random.nextInt(18) + 18) * 1000000);
            
            // Create model number
            String modelNumber = String.format("%04d", random.nextInt(9000) + 1000);
            
            // Create product name
            String name = cpuBrand.equals("Apple") ? 
                          String.format("Apple MacBook %s", cpuModel) : 
                          String.format("%s %s %s", brand.getName(), cpuSerie, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("UB", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(10 + random.nextInt(91))
                    .setQuantitySold(random.nextInt(50))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create mice
     */
    private List<Product> createMice(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] connectionTypes = {"Wireless", "Bluetooth", "Wired"};
        Integer[] dpiValues = {800, 1600, 4000, 12000, 16000, 20000};
        Integer[] buttons = {2, 3, 5, 7, 11};
        
        for (int i = 0; i < 5; i++) {
            Brand brand = brands.get((i + 3) % brands.size());
            String connectionType = connectionTypes[i % connectionTypes.length];
            Integer dpi = dpiValues[i % dpiValues.length];
            Integer buttonCount = buttons[i % buttons.length];
            boolean rgbLighting = random.nextBoolean();
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("connection_type", connectionType);
            specs.put("dpi", dpi);
            specs.put("buttons", buttonCount);
            specs.put("rgb_lighting", rgbLighting);
            specs.put("weight_g", 75 + (i % 5) * 5);
            
            if (!connectionType.equals("Wired")) {
                specs.put("battery_life_hours", 70 + (i % 5) * 40);
            }
            
            List<String> features = new ArrayList<>();
            features.add(dpi > 10000 ? "Độ chính xác cao" : "Độ chính xác vừa phải");
            features.add(buttonCount > 5 ? "Nhiều nút tùy chỉnh" : "Thiết kế tối giản");
            features.add("Ergonomic Design");
            specs.put("features", features);
            
            List<String> purposeTags = new ArrayList<>();
            purposeTags.add(dpi > 10000 && buttonCount > 5 ? "Gaming" : "Office");
            purposeTags.add(connectionType.equals("Bluetooth") ? "Travel" : "Desktop");
            specs.put("purpose_tags", purposeTags);
            
            // Generate price (0.2-2.5 million VND for mice)
            BigDecimal price = BigDecimal.valueOf((random.nextInt(24) + 2) * 100000);
            
            // Create model number and name
            String series = dpi > 10000 ? "Pro Mouse" : "Mouse";
            String modelNumber = String.format("M%04d", random.nextInt(9000) + 1000);
            String name = String.format("%s %s %s", brand.getName(), series, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("MOU", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(20 + random.nextInt(81))
                    .setQuantitySold(random.nextInt(50))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create keyboards
     */
    private List<Product> createKeyboards(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] connectionTypes = {"Wired", "Wireless", "Bluetooth"};
        String[] switchTypes = {"Mechanical (Blue)", "Mechanical (Red)", "Mechanical (Brown)", "Membrane", "Scissors"};
        String[] layouts = {"Full size", "TKL (Tenkeyless)", "60%", "75%", "Compact"};
        String[] colors = {"Black", "White", "Grey", "RGB"};
        
        for (int i = 0; i < 5; i++) {
            Brand brand = brands.get((i + 1) % brands.size());
            String connectionType = connectionTypes[i % connectionTypes.length];
            String switchType = switchTypes[i % switchTypes.length];
            String layout = layouts[i % layouts.length];
            boolean rgbLighting = switchType.contains("Mechanical") && random.nextBoolean();
            boolean numpad = layout.equals("Full size");
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("connection_type", connectionType);
            specs.put("switch_type", switchType);
            specs.put("layout", layout);
            specs.put("numpad", numpad);
            specs.put("rgb_lighting", rgbLighting);
            specs.put("weight_g", 600 + (i % 8) * 50);
            
            if (!connectionType.equals("Wired")) {
                specs.put("battery_life_hours", switchType.contains("Mechanical") ? 100 + (i % 5) * 20 : 200 + (i % 5) * 40);
            }
            
            List<String> features = new ArrayList<>();
            if (switchType.contains("Mechanical")) {
                features.add("Programmable Macros");
                features.add("N-Key Rollover");
            } else {
                features.add("Quiet Typing");
                features.add("Slim Design");
            }
            features.add("Bàn phím có đèn nền");
            specs.put("features", features);
            
            List<String> purposeTags = new ArrayList<>();
            purposeTags.add(switchType.contains("Mechanical") && layout.equals("Full size") ? "Gaming" : "Office");
            purposeTags.add(layout.equals("Compact") || layout.equals("60%") ? "Travel" : "Desktop");
            specs.put("purpose_tags", purposeTags);
            
            // Generate price (0.4-3.5 million VND for keyboards)
            BigDecimal price = BigDecimal.valueOf((random.nextInt(32) + 4) * 100000);
            
            // Create model number and name
            String series = switchType.contains("Mechanical") ? "Mechanical Keyboard" : "Keyboard";
            String modelNumber = String.format("K%04d", random.nextInt(9000) + 1000);
            String name = String.format("%s %s %s", brand.getName(), series, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("KEY", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(20 + random.nextInt(81))
                    .setQuantitySold(random.nextInt(50))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create monitors
     */
    private List<Product> createMonitors(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        Integer[] screenSizes = {24, 27, 32};
        String[] resolutions = {"1920x1080", "2560x1440", "3840x2160"};
        String[] panelTypes = {"IPS", "VA", "TN"};
        Integer[] refreshRates = {60, 75, 144, 165, 240};
        
        for (int i = 0; i < 5; i++) {
            Brand brand = brands.get((i + 4) % brands.size());
            Integer screenSize = screenSizes[i % screenSizes.length];
            String resolution = resolutions[i % resolutions.length];
            String panelType = panelTypes[i % panelTypes.length];
            Integer refreshRate = refreshRates[i % refreshRates.length];
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("screen_size_inch", screenSize);
            specs.put("resolution", resolution);
            specs.put("panel_type", panelType);
            specs.put("refresh_rate_hz", refreshRate);
            specs.put("response_time_ms", refreshRate > 100 ? 1 : 5);
            
            if (resolution.equals("3840x2160") || refreshRate > 100) {
                specs.put("hdr_support", "HDR400");
            }
            
            List<String> ports = new ArrayList<>();
            ports.add("HDMI");
            if (refreshRate > 100) ports.add("DisplayPort");
            if (screenSize > 27) ports.add("USB Hub");
            specs.put("ports", ports);
            
            List<String> features = new ArrayList<>();
            features.add(panelType.equals("VA") ? "1000R Curved" : "Flat");
            features.add("Eye Care Technology");
            if (refreshRate > 100) features.add("Adaptive Sync");
            specs.put("features", features);
            
            List<String> purposeTags = new ArrayList<>();
            purposeTags.add(refreshRate > 100 ? "Gaming" : "Office");
            if (resolution.equals("3840x2160")) purposeTags.add("Content Creation");
            else purposeTags.add("Casual Use");
            specs.put("purpose_tags", purposeTags);
            
            // Generate price (3-30 million VND for monitors)
            int basePrice = 3;
            if (screenSize > 27) basePrice += 3;
            if (resolution.equals("3840x2160")) basePrice += 5;
            if (refreshRate > 100) basePrice += 3;
            
            BigDecimal price = BigDecimal.valueOf((basePrice + random.nextInt(10)) * 1000000);
            
            // Create model number and name
            String series = refreshRate > 100 ? "Gaming Monitor" : "Monitor";
            String modelNumber = String.format("M%04d-%d", screenSize, random.nextInt(900) + 100);
            String name = String.format("%s %s %s", brand.getName(), series, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("MON", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(10 + random.nextInt(41))
                    .setQuantitySold(random.nextInt(20))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create USB hubs
     */
    private List<Product> createHubs(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] connectionTypes = {"USB-C", "USB-A"};
        Integer[] portCounts = {3, 4, 6, 8, 10};
        
        for (int i = 0; i < 5; i++) {
            Brand brand = brands.get((i + 2) % brands.size());
            String connectionType = connectionTypes[i % connectionTypes.length];
            Integer portCount = portCounts[i % portCounts.length];
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("connection_type", connectionType);
            
            List<String> ports = new ArrayList<>();
            int usbACount = Math.max(2, portCount - 2);
            ports.add(String.format("USB-A 3.0 (x%d)", usbACount));
            
            if (connectionType.equals("USB-C")) {
                ports.add("USB-C");
                if (portCount > 4) {
                    ports.add("HDMI");
                    if (portCount > 6) {
                        ports.add("Ethernet");
                        ports.add("SD Card Reader");
                    }
                }
                specs.put("power_delivery_w", 60 + (i % 5) * 10);
                specs.put("max_display_resolution", portCount > 6 ? "4K@60Hz" : "1080p@60Hz");
            }
            
            specs.put("ports", ports);
            
            List<String> features = new ArrayList<>();
            features.add("Aluminum Design");
            features.add("Compact");
            if (connectionType.equals("USB-C") && portCount > 6) {
                features.add("Multi-Display Support");
            }
            specs.put("features", features);
            
            List<String> purposeTags = new ArrayList<>();
            purposeTags.add(portCount > 6 ? "Workstation" : "Travel");
            purposeTags.add("Productivity");
            specs.put("purpose_tags", purposeTags);
            
            // Generate price (0.3-2.5 million VND for hubs)
            int basePrice = 3;
            if (connectionType.equals("USB-C")) basePrice += 3;
            if (portCount > 6) basePrice += 4;
            
            BigDecimal price = BigDecimal.valueOf((basePrice + random.nextInt(10)) * 100000);
            
            // Create model number and name
            String series = connectionType.equals("USB-C") ? 
                           (portCount > 6 ? "Docking Station" : "Multiport Hub") : 
                           "USB Hub";
            String modelNumber = String.format("H%04d-%d", portCount, random.nextInt(900) + 100);
            String name = String.format("%s %s %s", brand.getName(), series, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("HUB", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(15 + random.nextInt(86))
                    .setQuantitySold(random.nextInt(30))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create chargers
     */
    private List<Product> createChargers(List<Brand> brands, Category category) {
        List<Product> products = new ArrayList<>();
        String[] chargerTypes = {"USB-C Power Adapter", "Laptop Power Adapter", "USB-C Cable", "Wireless Charger"};
        Integer[] powerValues = {30, 45, 65, 90, 100, 140};
        
        for (int i = 0; i < 5; i++) {
            Brand brand = brands.get(i % brands.size());
            String chargerType = chargerTypes[i % chargerTypes.length];
            Integer power = powerValues[i % powerValues.length];
            
            // Create specs
            Map<String, Object> specs = new HashMap<>();
            specs.put("type", chargerType);
            specs.put("power_w", power);
            
            if (chargerType.contains("USB-C")) {
                List<String> ports = new ArrayList<>();
                if (power > 65) {
                    ports.add("USB-C (x2)");
                    ports.add("USB-A");
                } else {
                    ports.add("USB-C");
                }
                specs.put("ports", ports);
                specs.put("fast_charging", power >= 45);
            } 
            else if (chargerType.equals("Laptop Power Adapter")) {
                specs.put("connector_type", "Universal Tips");
                specs.put("cable_length_m", 1.8);
            }
            else if (chargerType.equals("USB-C Cable")) {
                specs.put("cable_length_m", 1.0 + (i % 3) * 0.5);
                specs.put("data_transfer_speed", power > 60 ? "10Gbps" : "5Gbps");
            }
            else if (chargerType.equals("Wireless Charger")) {
                specs.put("wireless_standard", "Qi");
                specs.put("max_charging_speed", "15W");
            }
            
            List<String> features = new ArrayList<>();
            if (chargerType.contains("USB-C") && power > 65) {
                features.add("GaN Technology");
            }
            features.add("Compact Design");
            
            if (chargerType.equals("USB-C Cable")) {
                features.add("Braided Nylon");
                features.add("Fast Charging Support");
            } else if (chargerType.equals("Wireless Charger")) {
                features.add("LED Indicator");
                features.add("Anti-Slip Surface");
            }
            
            specs.put("features", features);
            
            List<String> purposeTags = new ArrayList<>();
            if (power > 65) {
                purposeTags.add("Multiple Devices");
            }
            purposeTags.add(chargerType.contains("USB-C") || chargerType.equals("Wireless Charger") ? "Travel" : "Home");
            purposeTags.add("Charging");
            specs.put("purpose_tags", purposeTags);
            
            // Generate price (0.2-3.5 million VND for chargers)
            int basePrice = 2;
            if (chargerType.contains("USB-C") && power > 65) basePrice += 5;
            if (chargerType.equals("Laptop Power Adapter")) basePrice += 3;
            if (chargerType.equals("Wireless Charger")) basePrice += 2;
            
            BigDecimal price = BigDecimal.valueOf((basePrice + random.nextInt(8)) * 100000);
            
            // Create model number and name
            String series = chargerType;
            String modelNumber = String.format("C%04d-%d", power, random.nextInt(900) + 100);
            String name = String.format("%s %s %s", brand.getName(), series, modelNumber);
            
            // Create product
            Product product = new Product()
                    .setName(name)
                    .setSku(generateSku("CHG", brand.getName(), i))
                    .setSlug(name.toLowerCase().replaceAll("\\s+", "-"))
                    .setDescription(createDescription(name, category, specs))
                    .setPrice(price)
                    .setDiscount(random.nextInt(3) == 0 ? (float) (5 + random.nextInt(3) * 5) : 0.0f)
                    .setQuantityInStock(20 + random.nextInt(81))
                    .setQuantitySold(random.nextInt(50))
                    .setSpecifications(specs)
                    .setIsActive(true)
                    .setCategory(category)
                    .setBrand(brand);
            
            products.add(productRepository.save(product));
        }
        
        return products;
    }
    
    /**
     * Create product images for all products
     */
    private void createProductImages(List<Product> products) {
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            
            // Set some products as featured (about 20% of products)
            if (random.nextInt(5) == 0) {
                product.setIsFeatured(true);
                productRepository.save(product);
            }
            
            // Primary image - lap1.jpg to lap10.jpg
            int lapImageIndex = (i % 10) + 1;
            ProductImage mainImage = new ProductImage()
                    .setProduct(product)
                    .setImageUrl(String.format("lap%d.jpg", lapImageIndex))
                    .setAlt(product.getName() + " - Main Image")
                    .setSortOrder(0)
                    .setIsMain(true);
            
            productImageRepository.save(mainImage);
            
            // Add 2-5 sub-images for each product
            int numSubImages = 2 + random.nextInt(4);
            for (int j = 1; j <= numSubImages; j++) {
                ProductImage subImage = new ProductImage()
                        .setProduct(product)
                        .setImageUrl(String.format("sub%d.jpg", j))
                        .setAlt(product.getName() + " - Additional View " + j)
                        .setSortOrder(j)
                        .setIsMain(false);
                
                productImageRepository.save(subImage);
            }
        }
    }
    
    // -------------------- Helper methods --------------------
    
    /**
     * Generate a unique SKU
     */
    private String generateSku(String prefix, String brandName, int index) {
        return String.format("%s-%s-%02d-%04d", 
                prefix, 
                brandName.substring(0, Math.min(2, brandName.length())).toUpperCase(), 
                index, 
                random.nextInt(9000) + 1000);
    }
    
    
    /**
     * Create product description based on specifications
     */
    private String createDescription(String name, Category category, Map<String, Object> specs) {
        String categorySlug = category.getSlug();
        
        if (categorySlug.contains("laptop") || categorySlug.equals("laptops")) {
            Object cpu = specs.getOrDefault("cpu_series", "bộ xử lý mạnh mẽ");
            Object ram = specs.getOrDefault("ram_gb", "dung lượng cao");
            Object screen = specs.getOrDefault("screen_size_inch", "");
            Object usage = specs.getOrDefault("usage_type", "công việc hàng ngày");
            
            return String.format("%s là laptop %s inch mạnh mẽ với bộ xử lý %s %s và RAM %sGB. Lý tưởng cho %s.",
                    name,
                    screen.toString(),
                    specs.getOrDefault("cpu_brand", ""),
                    cpu.toString(),
                    ram.toString(),
                    usage.toString());
        } 
        else if (categorySlug.equals("mouses")) {
            Object dpi = specs.getOrDefault("dpi", "high-precision");
            Object connection = specs.getOrDefault("connection_type", "advanced");
            
            List<String> purposes = new ArrayList<>();
            if (specs.containsKey("purpose_tags")) {
                purposes = (List<String>) specs.get("purpose_tags");
            } else {
                purposes.add("sử dụng hàng ngày");
            }
            
            return String.format("%s là chuột %s với độ chính xác %s DPI. Lý tưởng cho %s.",
                    name,
                    connection.toString().toLowerCase(),
                    dpi.toString(),
                    String.join(", ", purposes));
        } 
        else if (categorySlug.equals("keyboards")) {
            Object switchType = specs.getOrDefault("switch_type", "premium");
            Object layout = specs.getOrDefault("layout", "ergonomic");
            
            List<String> purposes = new ArrayList<>();
            if (specs.containsKey("purpose_tags")) {
                purposes = (List<String>) specs.get("purpose_tags");
            } else {
                purposes.add("gõ phím");
            }
            
            return String.format("%s là bàn phím %s với switch %s. Thích hợp cho %s.",
                    name,
                    layout.toString().toLowerCase(),
                    switchType.toString(),
                    String.join(", ", purposes));
        } 
        else if (categorySlug.equals("monitors")) {
            Object size = specs.getOrDefault("screen_size_inch", "");
            Object resolution = specs.getOrDefault("resolution", "độ phân giải cao");
            Object refresh = specs.getOrDefault("refresh_rate_hz", "mượt mà");
            
            List<String> purposes = new ArrayList<>();
            if (specs.containsKey("purpose_tags")) {
                purposes = (List<String>) specs.get("purpose_tags");
            } else {
                purposes.add("sử dụng hàng ngày");
            }
            
            return String.format("%s là màn hình %s inch với độ phân giải %s và tần số quét %sHz. Hoàn hảo cho %s.",
                    name,
                    size.toString(),
                    resolution.toString(),
                    refresh.toString(),
                    String.join(", ", purposes));
        } 
        else if (categorySlug.equals("hubs")) {
            List<String> portList = new ArrayList<>();
            if (specs.containsKey("ports")) {
                portList = (List<String>) specs.get("ports");
            }
            
            int portCount = portList.size();
            Object connection = specs.getOrDefault("connection_type", "đa năng");
            
            List<String> purposes = new ArrayList<>();
            if (specs.containsKey("purpose_tags")) {
                purposes = (List<String>) specs.get("purpose_tags");
            } else {
                purposes.add("kết nối");
            }
            
            return String.format("%s là hub %s với %d cổng kết nối. Tuyệt vời cho %s.",
                    name,
                    connection.toString().toLowerCase(),
                    portCount,
                    String.join(", ", purposes));
        } 
        else if (categorySlug.equals("chargers")) {
            Object power = specs.getOrDefault("power_w", "công suất cao");
            Object chargerType = specs.getOrDefault("type", "tiên tiến");
            
            List<String> purposes = new ArrayList<>();
            if (specs.containsKey("purpose_tags")) {
                purposes = (List<String>) specs.get("purpose_tags");
            } else {
                purposes.add("sạc pin");
            }
            
            return String.format("%s là sạc %s %sW. Tuyệt vời cho %s.",
                    name,
                    chargerType.toString().toLowerCase(),
                    power.toString(),
                    String.join(", ", purposes));
        }
        
        return name + " - " + category.getName();
    }
}
