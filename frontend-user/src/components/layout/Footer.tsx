import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-auto">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h2 className="font-bold text-xl mb-4">Laptop Shop</h2>
            <p className="text-sm mb-4 opacity-90">
              Nguồn cung cấp laptop và phụ kiện cao cấp đáng tin cậy của bạn.
              Chúng tôi cung cấp sản phẩm chất lượng tốt nhất từ các thương hiệu hàng đầu.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white/80 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white/80 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white/80 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white/80 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white/80 transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4">Sản phẩm</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm hover:underline">Laptop Gaming</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Laptop Văn Phòng</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Ultrabook</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Laptop 2-trong-1</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Laptop Giá Rẻ</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4">Thương Hiệu</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm hover:underline">Apple</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Dell</Link></li>
              <li><Link to="#" className="text-sm hover:underline">HP</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Lenovo</Link></li>
              <li><Link to="#" className="text-sm hover:underline">Asus</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4">Liên Hệ</h3>
            <address className="text-sm not-italic">
              19 Nguyễn Hữu Thọ, Phường Tân Phong<br />
              Quận 7, TP. Hồ Chí Minh, Việt Nam<br />
              <br />
              Email: info@laptopshop.com<br />
              Điện thoại: +84 123 456 789
            </address>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <p className="text-sm text-center">
            &copy; {new Date().getFullYear()} Laptop Shop. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;