import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingCart, User, LogOut, Heart, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { IMAGES_BASE_URL } from "../../config/api";
import { formatCurrency } from "../../utils/format";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, itemCount, removeCartItem } = useCart();
  const navigate = useNavigate();
  
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const cartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Xử lý đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setIsCartDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
      if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    };
  }, []);

  const handleCartMouseEnter = () => {
    if (cartTimeoutRef.current) {
      clearTimeout(cartTimeoutRef.current);
      cartTimeoutRef.current = null;
    }
    setIsCartDropdownOpen(true);
  };

  const handleCartMouseLeave = () => {
    cartTimeoutRef.current = setTimeout(() => {
      setIsCartDropdownOpen(false);
    }, 300);
  };

  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
    }
    setIsUserMenuOpen(true);
  };

  const handleUserMouseLeave = () => {
    userTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 300);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  // Lấy URL avatar hoặc null nếu không có
  const getAvatarUrl = () => {
    if (!user?.profileImage) return null;
    
    // Kiểm tra nếu profileImage đã là URL đầy đủ
    if (user.profileImage.startsWith('http')) {
      return user.profileImage;
    }
    
    // Nếu không, ghép với IMAGES_BASE_URL
    return `${IMAGES_BASE_URL}${user.profileImage}`;
  };

  const avatarUrl = getAvatarUrl();

  // Xử lý xóa sản phẩm khỏi giỏ hàng
  const handleRemoveCartItem = async (cartItemId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện mở trang giỏ hàng
    await removeCartItem(cartItemId);
  };

  return (
    <header className="w-full border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto h-16 flex items-center justify-between px-4">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-bold text-xl md:text-2xl tracking-tight"
        >
          LAPSTORE
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
        

          {/* Cart */}
          <div 
            className="relative" 
            ref={cartDropdownRef}
            onMouseEnter={handleCartMouseEnter}
            onMouseLeave={handleCartMouseLeave}
          >
            <button
              className="relative flex items-center"
              aria-label="Giỏ hàng"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
            
            {/* Cart Dropdown */}
            {isCartDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 overflow-hidden"
                onMouseEnter={handleCartMouseEnter}
                onMouseLeave={handleCartMouseLeave}
              >
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Giỏ hàng ({itemCount})</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setIsCartDropdownOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {!isAuthenticated ? (
                    <div className="p-4 text-center">
                      <p className="text-gray-500 text-sm mb-3">Vui lòng đăng nhập để xem giỏ hàng</p>
                      <Link
                        to="/login"
                        className="inline-block bg-primary text-white text-sm py-2 px-4 rounded-md"
                        onClick={() => setIsCartDropdownOpen(false)}
                      >
                        Đăng nhập
                      </Link>
                    </div>
                  ) : !cart || cart.items.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
                    </div>
                  ) : (
                    <div>
                      {cart.items.slice(0, 3).map(item => (
                        <div 
                          key={item.id} 
                          className="p-3 border-b hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={item.productImage && item.productImage.startsWith('http') 
                                ? item.productImage 
                                : `${IMAGES_BASE_URL}${item.productImage}`} 
                              alt={item.productName} 
                              className="w-full h-full object-contain" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/product/${item.productSlug}`}
                              className="text-xs font-medium line-clamp-1 hover:text-primary"
                              onClick={() => setIsCartDropdownOpen(false)}
                            >
                              {item.productName}
                            </Link>
                            <div className="flex justify-between items-center mt-1">
                              <div className="text-xs text-gray-500">
                                {item.quantity} x {formatCurrency(item.productPrice * (1 - item.productDiscount / 100))}
                              </div>
                              <button 
                                className="text-red-500 hover:text-red-700"
                                onClick={(e) => handleRemoveCartItem(item.id, e)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {cart.items.length > 3 && (
                        <div className="p-3 text-center text-xs text-gray-500">
                          và {cart.items.length - 3} sản phẩm khác...
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t">
                  {isAuthenticated && cart && cart.items.length > 0 && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Tạm tính:</span>
                      <span className="text-sm font-semibold text-primary">{formatCurrency(cart.totalPrice)}</span>
                    </div>
                  )}
                  
                  <Link
                    to="/cart"
                    className="block w-full bg-primary text-white text-center text-sm py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                    onClick={() => setIsCartDropdownOpen(false)}
                  >
                    Xem giỏ hàng
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <div 
              className="relative" 
              ref={userDropdownRef}
              onMouseEnter={handleUserMouseEnter}
              onMouseLeave={handleUserMouseLeave}
            >
              <button
                className="flex items-center gap-2"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name} className="h-8 w-8 object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-gray-700" />
                  )}
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/user/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Thông tin tài khoản
                  </Link>
                  <Link
                    to="/user/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Đơn hàng của tôi
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-primary mr-3"
              >
                Login
              </Link>
              <span className="text-gray-300 mr-3">|</span>
              <Link
                to="/register"
                className="text-sm font-medium text-gray-700 hover:text-primary"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="ml-4 md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="container md:hidden border-t py-4 px-4 bg-white z-50">
          <div className="mb-4">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/wishlist" 
              className="flex items-center text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart className="h-5 w-5 mr-2" />
              Sản phẩm yêu thích
            </Link>
            
            <Link 
              to="/cart" 
              className="flex items-center text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Giỏ hàng {itemCount > 0 && `(${itemCount})`}
            </Link>
            
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="flex items-center text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="flex items-center text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  Đăng ký
                </Link>
              </>
            )}
            
            {isAuthenticated && (
              <>
                <Link
                  to="/user/profile"
                  className="flex items-center text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name} className="h-5 w-5 rounded-full mr-2 object-cover" />
                  ) : (
                    <User className="h-5 w-5 mr-2" />
                  )}
                  Thông tin tài khoản
                </Link>
                <Link
                  to="/user/orders"
                  className="flex items-center text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Đơn hàng của tôi
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center text-sm font-medium text-red-600 text-left"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Đăng xuất
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;