-- === ENUM Types ===

-- Trạng thái đơn hàng
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Loại voucher
CREATE TYPE voucher_type AS ENUM ('percentage_discount', 'fixed_amount_discount', 'free_shipping');

-- === Tables ===

-- Bảng Người dùng (Customers / Admins)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,                   -- ID duy nhất
    username VARCHAR(50) UNIQUE NOT NULL,          -- Tên đăng nhập
    email VARCHAR(100) UNIQUE NOT NULL,         -- Email (duy nhất, dùng để đăng nhập/liên lạc)
    password_hash VARCHAR(255) NOT NULL,         -- Mật khẩu đã được hash an toàn
    full_name VARCHAR(100),                      -- Họ và tên
    phone_number VARCHAR(20),                    -- Số điện thoại
    address TEXT,                                -- Địa chỉ mặc định (có thể lưu nhiều địa chỉ ở bảng riêng nếu cần)
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- Vai trò (customer, admin)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- Ngày cập nhật
);
COMMENT ON TABLE users IS 'Lưu trữ thông tin người dùng (khách hàng, quản trị viên)';

-- Bảng Hãng sản xuất (Brands)
CREATE TABLE brands (
    brand_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,             -- Tên hãng (e.g., HP, Dell, Apple)
    slug VARCHAR(120) UNIQUE,                      -- Tên hãng dạng URL-friendly (e.g., hp, dell, apple) - Tùy chọn nhưng hữu ích
    logo_url VARCHAR(255),                       -- URL logo của hãng (tùy chọn)
    description TEXT,                             -- Mô tả về hãng (tùy chọn)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE brands IS 'Lưu trữ thông tin các hãng sản xuất (Thương hiệu)';

-- Bảng Danh mục Sản phẩm
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,             -- Tên danh mục (e.g., 'Laptops', 'Gaming Laptops', 'Phụ kiện')
    slug VARCHAR(120) UNIQUE,                      -- Tên danh mục dạng URL-friendly (tùy chọn)
    description TEXT,                             -- Mô tả danh mục
    parent_category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL, -- ID danh mục cha (cho cấu trúc đa cấp)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE categories IS 'Phân loại sản phẩm (có thể đa cấp)';

-- Bảng Sản phẩm
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT, -- Khóa ngoại tới danh mục
    brand_id INTEGER NOT NULL REFERENCES brands(brand_id) ON DELETE RESTRICT,          -- Khóa ngoại tới hãng sản xuất
    sku VARCHAR(100) UNIQUE NOT NULL,              -- Mã SKU duy nhất
    name VARCHAR(255) NOT NULL,                  -- Tên sản phẩm
    slug VARCHAR(280) UNIQUE,                      -- Tên sản phẩm dạng URL-friendly (tùy chọn)
    description TEXT,                             -- Mô tả chi tiết sản phẩm
    price DECIMAL(12, 2) NOT NULL CHECK (base_price >= 0), -- Giá gốc
    discount DECIMAL(5, 2) DEFAULT 0.00 CHECK (discount >= 0 AND discount <= 100), -- Tỷ lệ % giảm giá (0 nếu không giảm)
    quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0), -- Số lượng tồn kho
    quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),         -- Số lượng đã bán (dùng để hiển thị/thống kê)
    specifications JSONB,                         -- **Thông số kỹ thuật dạng JSONB - Rất linh hoạt**
                                                  -- Ví dụ: {"cpu_series": "Core i7", "ram_gb": 16, "storage_gb": 512, "screen_size": 14, "features": ["Backlit KB", "Fingerprint"]}
    is_active BOOLEAN NOT NULL DEFAULT TRUE,      -- Trạng thái hiển thị bán
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE products IS 'Lưu trữ thông tin chi tiết các sản phẩm';
COMMENT ON COLUMN products.specifications IS 'Lưu thông số kỹ thuật dạng JSONB để hỗ trợ lọc linh hoạt';

-- Bảng Hình ảnh Sản phẩm
CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE, -- Liên kết tới sản phẩm
    image_url VARCHAR(255) NOT NULL,            -- URL hình ảnh
    alt_text VARCHAR(255),                       -- Văn bản thay thế (SEO & accessibility)
    is_main BOOLEAN NOT NULL DEFAULT FALSE,      -- Đánh dấu ảnh chính (chỉ 1 ảnh chính/sản phẩm)
    display_order INTEGER DEFAULT 0,             -- Thứ tự hiển thị ảnh phụ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE product_images IS 'Lưu trữ các hình ảnh (chính, phụ) của sản phẩm';
-- Ràng buộc đảm bảo chỉ có 1 ảnh chính cho mỗi sản phẩm
CREATE UNIQUE INDEX idx_unique_main_image ON product_images (product_id) WHERE is_main = TRUE;

-- Bảng Vouchers (Khuyến mãi)
CREATE TABLE vouchers (
    voucher_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,          -- Mã voucher người dùng nhập
    description TEXT,                          -- Mô tả voucher
    type voucher_type NOT NULL,                -- Loại voucher (giảm %, giảm tiền cố định, free ship)

    -- Giá trị giảm giá (chỉ áp dụng nếu type là percentage hoặc fixed_amount)
    discount_value DECIMAL(12, 2) CHECK (discount_value >= 0), -- Phần trăm (vd: 10) hoặc số tiền cố định
    max_discount_amount DECIMAL(12, 2) CHECK (max_discount_amount >= 0), -- Số tiền giảm tối đa (cho voucher %)

    -- Điều kiện áp dụng
    min_order_value DECIMAL(12, 2) DEFAULT 0.00 CHECK (min_order_value >= 0), -- Giá trị đơn hàng tối thiểu (chưa tính ship)

    -- Giới hạn sử dụng
    usage_limit INTEGER CHECK (usage_limit > 0),        -- Tổng số lượt có thể sử dụng (NULL = không giới hạn)
    usage_limit_per_user INTEGER CHECK (usage_limit_per_user > 0), -- Số lượt tối đa mỗi user (NULL = không giới hạn)

    -- Thời gian hiệu lực
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,      -- Trạng thái voucher
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc kiểm tra logic
    CONSTRAINT check_discount_value_based_on_type CHECK (
        (type = 'free_shipping' AND discount_value IS NULL AND max_discount_amount IS NULL) OR
        (type = 'fixed_amount_discount' AND discount_value IS NOT NULL AND max_discount_amount IS NULL) OR
        (type = 'percentage_discount' AND discount_value IS NOT NULL)
    ),
    CONSTRAINT check_valid_dates CHECK (valid_to > valid_from)
);
COMMENT ON TABLE vouchers IS 'Quản lý các mã giảm giá, khuyến mãi';

-- Bảng Đơn hàng
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, -- Người đặt hàng (NULL nếu user bị xóa hoặc khách vãng lai)
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Ngày đặt hàng
    status order_status NOT NULL DEFAULT 'pending',           -- Trạng thái đơn hàng

    -- Thông tin giá trị đơn hàng
    subtotal_amount DECIMAL(12, 2) NOT NULL CHECK (subtotal_amount >= 0), -- Tổng tiền hàng (trước voucher, trước ship)
    shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0), -- Phí ship (có thể = 0 nếu free ship)
    order_discount_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (order_discount_amount >= 0), -- Số tiền *thực tế* được giảm từ voucher
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0), -- Tổng cuối cùng khách trả (subtotal - discount + shipping)

    -- Thông tin voucher đã áp dụng
    applied_discount_voucher_id INTEGER REFERENCES vouchers(voucher_id) ON DELETE SET NULL, -- FK tới voucher giảm giá tiền
    applied_shipping_voucher_id INTEGER REFERENCES vouchers(voucher_id) ON DELETE SET NULL, -- FK tới voucher free ship

    -- Thông tin giao hàng
    shipping_address TEXT NOT NULL, -- Địa chỉ giao hàng lưu tại thời điểm đặt
    recipient_name VARCHAR(100),    -- Tên người nhận
    recipient_phone VARCHAR(20),    -- SĐT người nhận

    notes TEXT,                                                -- Ghi chú của khách hàng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE orders IS 'Lưu trữ thông tin các đơn đặt hàng';

-- Bảng Chi tiết Đơn hàng (Các sản phẩm trong một đơn hàng)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE, -- Liên kết tới đơn hàng
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT, -- Liên kết tới sản phẩm (Không cho xóa SP nếu còn trong đơn hàng)
    quantity INTEGER NOT NULL CHECK (quantity > 0),                          -- Số lượng sản phẩm
    price_at_purchase DECIMAL(12, 2) NOT NULL CHECK (price_at_purchase >= 0),-- Giá của 1 sản phẩm TẠI THỜI ĐIỂM MUA HÀNG
    UNIQUE(order_id, product_id) -- Mỗi sản phẩm chỉ xuất hiện 1 lần trong 1 đơn hàng
);
COMMENT ON TABLE order_items IS 'Chi tiết các sản phẩm trong từng đơn hàng';
COMMENT ON COLUMN order_items.price_at_purchase IS 'Giá sản phẩm tại thời điểm đặt hàng (quan trọng!)';

-- Bảng Lịch sử sử dụng Voucher
CREATE TABLE voucher_usage (
    usage_id SERIAL PRIMARY KEY,
    voucher_id INTEGER NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Thời điểm áp dụng
    UNIQUE(order_id, voucher_id) -- Đảm bảo 1 voucher chỉ dùng 1 lần cho 1 đơn hàng
);
COMMENT ON TABLE voucher_usage IS 'Ghi lại lịch sử sử dụng voucher để kiểm tra giới hạn';

-- === Indexes ===

-- users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- brands
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_slug ON brands(slug); -- Nếu dùng slug

-- categories
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_slug ON categories(slug); -- Nếu dùng slug
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- products
CREATE INDEX idx_products_name ON products(name); -- Hỗ trợ tìm kiếm theo tên
CREATE INDEX idx_products_slug ON products(slug); -- Nếu dùng slug
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id); -- **Quan trọng cho lọc theo hãng**
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_base_price ON products(base_price); -- Hỗ trợ lọc theo giá
-- **Index GIN cho JSONB - Cực kỳ quan trọng để lọc hiệu quả theo thông số**
CREATE INDEX idx_products_specifications_gin ON products USING GIN (specifications);

-- product_images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- vouchers
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_type ON vouchers(type);
CREATE INDEX idx_vouchers_is_active ON vouchers(is_active);
CREATE INDEX idx_vouchers_valid_dates ON vouchers(valid_from, valid_to);

-- orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_applied_discount_voucher ON orders(applied_discount_voucher_id);
CREATE INDEX idx_orders_applied_shipping_voucher ON orders(applied_shipping_voucher_id);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

-- order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- voucher_usage
CREATE INDEX idx_voucher_usage_voucher_id ON voucher_usage(voucher_id);
CREATE INDEX idx_voucher_usage_user_id ON voucher_usage(user_id);
CREATE INDEX idx_voucher_usage_order_id ON voucher_usage(order_id);
-- Index kết hợp để kiểm tra nhanh lượt dùng của user cho 1 voucher
CREATE INDEX idx_voucher_usage_user_voucher ON voucher_usage(user_id, voucher_id);

-- === Trigger Function for updated_at ===

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === Apply Triggers ===

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_brands
BEFORE UPDATE ON brands
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_vouchers
BEFORE UPDATE ON vouchers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- (Không cần trigger updated_at cho product_images, order_items, voucher_usage trừ khi có nhu cầu cụ thể)

-- === End of Script ===Add prompt contents...