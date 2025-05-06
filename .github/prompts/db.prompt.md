Các Bảng Chính và Mục Đích:
users:
Mục đích: Lưu trữ thông tin tài khoản của khách hàng và quản trị viên.
Thông tin chính: ID, tên đăng nhập, email, mật khẩu (đã hash), họ tên, số điện thoại, địa chỉ mặc định, vai trò (khách hàng/admin).
brands (Mới):
Mục đích: Quản lý danh sách các thương hiệu/hãng sản xuất (HP, Dell, Asus, Apple,...).
Thông tin chính: ID hãng, tên hãng (duy nhất), logo (URL, tùy chọn), mô tả (tùy chọn).
categories:
Mục đích: Phân loại sản phẩm thành các nhóm chính (ví dụ: Laptops, Phụ kiện, Chuột, Bàn phím). Hỗ trợ cấu trúc danh mục đa cấp (cha-con).
Thông tin chính: ID danh mục, tên danh mục, mô tả, ID danh mục cha.
products:
Mục đích: Lưu trữ thông tin chi tiết về từng sản phẩm. Đây là bảng trung tâm.
Thông tin chính:
ID sản phẩm (PK).
category_id (FK): Liên kết đến danh mục chính.
brand_id (FK - Mới): Liên kết đến hãng sản xuất.
SKU (mã định danh sản phẩm), tên sản phẩm, mô tả chi tiết.
Giá gốc (base_price), giá sau giảm giá (discount_price - nếu có giảm giá trực tiếp trên sản phẩm).
Số lượng tồn kho (quantity_in_stock), số lượng đã bán (quantity_sold).
specifications (kiểu JSONB): Cực kỳ quan trọng. Lưu trữ tất cả các thông số kỹ thuật và tính năng dưới dạng JSON. Ví dụ:
{
  "screen_size_inch": 14,
  "screen_resolution": "Full HD",
  "refresh_rate_hz": 120,
  "cpu_brand": "Intel",
  "cpu_series": "Core Ultra 7",
  "ram_gb": 16,
  "storage_type": "SSD",
  "storage_size_gb": 512,
  "graphics_card_model": "Intel Arc Graphics",
  "features": ["Chống chói", "Bảo mật vân tay", "Đèn bàn phím"],
  "purpose_tags": ["Học tập, văn phòng", "Mỏng nhẹ"]
  // ... thêm các thuộc tính khác khi cần
}
Use code with caution.
Json
Cấu trúc JSON này cho phép bạn dễ dàng thêm/bớt thuộc tính và thực hiện các truy vấn lọc phức tạp như hình ảnh yêu cầu.
Trạng thái hoạt động (is_active).
product_images:
Mục đích: Quản lý nhiều hình ảnh cho mỗi sản phẩm.
Thông tin chính: ID ảnh, product_id (FK), URL hình ảnh, đánh dấu ảnh chính (is_main), văn bản thay thế (alt text), thứ tự hiển thị.
vouchers:
Mục đích: Quản lý các mã giảm giá và chương trình khuyến mãi.
Thông tin chính: ID voucher, mã code, mô tả, loại voucher (giảm %, giảm tiền cố định, free ship), giá trị giảm, giá trị giảm tối đa, điều kiện áp dụng (đơn hàng tối thiểu), giới hạn sử dụng (tổng lượt, lượt/user), thời gian hiệu lực, trạng thái.
orders:
Mục đích: Lưu trữ thông tin về mỗi đơn hàng được tạo ra.
Thông tin chính: ID đơn hàng, user_id (FK), ngày đặt hàng, trạng thái đơn hàng (pending, processing, shipped,...), tổng tiền hàng (subtotal_amount), phí vận chuyển (shipping_fee), số tiền được giảm từ voucher (order_discount_amount), tổng tiền cuối cùng (total_amount), ID voucher giảm giá đã áp dụng (FK), ID voucher free ship đã áp dụng (FK), thông tin giao hàng (địa chỉ, tên người nhận, SĐT).
order_items:
Mục đích: Lưu trữ chi tiết các sản phẩm có trong từng đơn hàng.
Thông tin chính: ID chi tiết, order_id (FK), product_id (FK), số lượng, giá tại thời điểm mua (price_at_purchase - rất quan trọng để lưu lại giá lịch sử).
voucher_usage:
Mục đích: Ghi lại lịch sử sử dụng voucher cho mỗi đơn hàng và người dùng, giúp kiểm tra giới hạn sử dụng.
Thông tin chính: ID sử dụng, voucher_id (FK), order_id (FK), user_id (FK), thời gian sử dụng.Add prompt contents...