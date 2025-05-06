import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: 'active' | 'inactive';
  image: string;
}

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data cho sản phẩm
  const products: Product[] = [
    { 
      id: 'PRD001', 
      name: 'Áo thun nam cổ tròn', 
      category: 'Áo', 
      price: '250,000đ',
      stock: 35,
      status: 'active',
      image: 'https://via.placeholder.com/50'
    },
    { 
      id: 'PRD002', 
      name: 'Quần jean nữ ống đứng', 
      category: 'Quần', 
      price: '450,000đ',
      stock: 20,
      status: 'active',
      image: 'https://via.placeholder.com/50'
    },
    { 
      id: 'PRD003', 
      name: 'Giày thể thao unisex', 
      category: 'Giày', 
      price: '650,000đ',
      stock: 15,
      status: 'active',
      image: 'https://via.placeholder.com/50'
    },
    { 
      id: 'PRD004', 
      name: 'Túi xách nữ thời trang', 
      category: 'Phụ kiện', 
      price: '350,000đ',
      stock: 8,
      status: 'inactive',
      image: 'https://via.placeholder.com/50'
    },
    { 
      id: 'PRD005', 
      name: 'Nón bucket unisex', 
      category: 'Phụ kiện', 
      price: '150,000đ',
      stock: 25,
      status: 'active',
      image: 'https://via.placeholder.com/50'
    },
  ];

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-gray-600">Quản lý tất cả sản phẩm trong hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
          <Plus size={18} className="mr-2" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50">
              <Filter size={18} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-md object-cover" src={product.image} alt={product.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> của <span className="font-medium">5</span> kết quả
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 border border-blue-500 rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage; 