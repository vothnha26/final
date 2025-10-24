import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch, IoHeart, IoStar, IoChevronDown, IoChevronForward, IoFunnel } from 'react-icons/io5';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

// Add custom checkbox style
const checkboxStyle = `
  .category-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 1rem;
    height: 1rem;
    border: 2px solid #d1d5db;
    border-radius: 0.25rem;
    background-color: white;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }
  
  .category-checkbox:checked {
    background-color: #2563eb;
    border-color: #2563eb;
  }
  
  .category-checkbox:checked::after {
    content: '';
    position: absolute;
    left: 0.25rem;
    top: 0.05rem;
    width: 0.35rem;
    height: 0.6rem;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  
  .supplier-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 1rem;
    height: 1rem;
    border: 2px solid #d1d5db;
    border-radius: 0.25rem;
    background-color: white;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }
  
  .supplier-checkbox:checked {
    background-color: #9333ea;
    border-color: #9333ea;
  }
  
  .supplier-checkbox:checked::after {
    content: '';
    position: absolute;
    left: 0.25rem;
    top: 0.05rem;
    width: 0.35rem;
    height: 0.6rem;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  
  .category-checkbox:focus,
  .supplier-checkbox:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
`;

const CustomerShop = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiSuppliers, setApiSuppliers] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(999999999);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tất cả', count: 0 }]);
  const [products, setProducts] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const navigate = useNavigate();
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(true);
  const [isSupplierFilterOpen, setIsSupplierFilterOpen] = useState(true);
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(true);

  // Map product from API (ShopProductResponseDto)
  const mapProductFromApi = (product) => {
    // Use lowestVariantPrice or fallback to minPrice/price
    const price = product.lowestVariantPrice ?? product.minPrice ?? product.price ?? 0;
    const originalPrice = product.lowestVariantOriginalPrice ?? product.maxPrice ?? product.originalPrice ?? 0;

    // Get main image
    const rawImages = Array.isArray(product.images) ? product.images : [];
    const images = rawImages.map(img => (typeof img === 'string' && img.startsWith('/') ? api.buildUrl(img) : img));
    const image = images.length > 0 ? images[0] : 'https://via.placeholder.com/300';

    // Category and supplier
    const categoryName = product.category?.name ?? '';
    const supplierName = product.supplier?.name ?? '';

    // Discount
    const discountPercent = product.lowestVariantDiscountPercent ?? product.discountPercent ?? 0;

    // Stock
    const stockQuantity = product.totalStock ?? product.stockQuantity ?? 0;

    return {
      id: product.maSanPham ?? product.id,
      name: product.tenSanPham ?? product.name ?? 'Sản phẩm',
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || 0,
      image,
      images,
      category: categoryName,
      supplier: supplierName,
      description: product.moTa ?? product.description ?? '',
      rating: Number(product.averageRating ?? product.rating) || 4.5,
      reviews: Number(product.reviewCount) || 0,
      inStock: stockQuantity > 0,
      stockCount: stockQuantity,
      discountPercent: Number(discountPercent) || 0,
      isOnSale: originalPrice > 0 && price < originalPrice,
      variantCount: product.availableVariantCount ?? product.soLuongBienThe ?? 0
    };
  };

  // Fetch products (use /shop endpoint for variant-aware prices)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/products/shop');
        const data = response.data ?? response;
        const productList = Array.isArray(data) ? data : (data.items ?? data.content ?? []);
        const mapped = productList.map(mapProductFromApi);
        setProducts(mapped);
      } catch (err) {
        
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Load favorites from database
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteIds(new Set());
        return;
      }

      try {
        const response = await api.get('/api/v1/yeu-thich');

        // API có thể trả về mảng trực tiếp hoặc trong response.data
        const favoriteProducts = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);

        // Xử lý nhiều trường hợp để lấy product ID
        const ids = new Set(favoriteProducts.map(p => {
          // Thử nhiều cách lấy ID
          const id = p.maSanPham ?? p.id ?? p.productId ?? p.sanPham?.maSanPham ?? p.sanPham?.id;
          return id;
        }).filter(id => id != null));

        setFavoriteIds(ids);
      } catch (error) {
        setFavoriteIds(new Set());
      }
    };

    fetchFavorites();
  }, [user]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        const data = response.data ?? response;
        const catList = Array.isArray(data) ? data : [];
        setApiCategories(catList);
      } catch (err) {
        
      }
    };
    fetchCategories();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api.get('/api/suppliers');
        const data = response.data ?? response;
        const supList = Array.isArray(data) ? data : [];
        setApiSuppliers(supList);
      } catch (err) {
        
      }
    };
    fetchSuppliers();
  }, []);

  // Update categories with count
  useEffect(() => {
    const categoryCounts = {};
    products.forEach(p => {
      const cat = p.category || 'Khác';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const updatedCategories = [
      { id: 'all', name: 'Tất cả', count: products.length },
      ...apiCategories.map(cat => ({
        id: cat.maDanhMuc ?? cat.id,
        name: cat.tenDanhMuc ?? cat.name,
        count: categoryCounts[cat.tenDanhMuc ?? cat.name] || 0
      }))
    ];
    setCategories(updatedCategories);
  }, [products, apiCategories]);

  // Filter and sort products
  const filteredProducts = (() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => {
        const catLower = (p.category || '').toLowerCase();
        return selectedCategories.some(c => String(c).toLowerCase() === catLower);
      });
    }

    if (selectedSuppliers.length > 0) {
      result = result.filter(p => {
        const supLower = (p.supplier || '').toLowerCase();
        return selectedSuppliers.some(s => String(s).toLowerCase() === supLower);
      });
    }

    result = result.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  })();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handlePriceRangeChange = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setMinPrice(0);
    setMaxPrice(999999999);
    setSearchTerm('');
  };

  const toggleFavorite = async (productId) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    try {
      const isFavorite = favoriteIds.has(productId);

      if (isFavorite) {
        // Remove from favorites
        await api.del(`/api/v1/yeu-thich/${productId}`);

        // Update favoriteIds
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });

        // Dispatch event to update favorites count
        window.dispatchEvent(new CustomEvent('favorites:changed', {
          detail: { count: favoriteIds.size - 1 }
        }));
      } else {
        // Add to favorites
        await api.post('/api/v1/yeu-thich', { productId: productId });

        // Update favoriteIds
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.add(productId);
          return newSet;
        });

        // Dispatch event to update favorites count
        window.dispatchEvent(new CustomEvent('favorites:changed', {
          detail: { count: favoriteIds.size + 1 }
        }));
      }
    } catch (error) {
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const handleViewProduct = (product) => {
    // Navigate to product detail page
    navigate(`/shop/products/${product.id}`);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <IoStar key={i} className={`${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  return (
    <>
      <style>{checkboxStyle}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-600 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>
              🏠 Trang chủ
            </span>
            <IoChevronForward className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
              📂 Danh mục
            </span>
            <IoChevronForward className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tất cả sản phẩm
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0 space-y-6">

              {/* Search Box */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                  <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 focus:outline-none text-gray-700 font-medium"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div
                  className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 flex justify-between items-center cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all"
                  onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                >
                  <h3 className="font-bold text-white flex items-center gap-2">
                    📦 Danh mục
                    {selectedCategories.length > 0 && (
                      <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        {selectedCategories.length}
                      </span>
                    )}
                  </h3>
                  <IoChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ${isCategoryFilterOpen ? 'rotate-180' : ''}`} />
                </div>
                {isCategoryFilterOpen && (
                  <ul className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {categories.map(cat => {
                      const cid = String(cat.id ?? cat.name).toLowerCase();
                      const isChecked = selectedCategories.map(x => String(x).toLowerCase()).includes(cid);
                      const isAllSelected = cat.id === 'all' && selectedCategories.length === 0;
                      return (
                        <li key={cid}>
                          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isAllSelected || isChecked}
                              onChange={() => {
                                if (cat.id === 'all') {
                                  setSelectedCategories([]);
                                } else {
                                  setSelectedCategories(prev => {
                                    const lowered = prev.map(x => String(x).toLowerCase());
                                    if (lowered.includes(cid)) return prev.filter(x => String(x).toLowerCase() !== cid);
                                    return [...prev, cat.name];
                                  });
                                }
                              }}
                              className="category-checkbox"
                            />
                            <span className="text-sm font-medium text-gray-700 flex-1">
                              {cat.name}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {cat.count}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Suppliers */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div
                  className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 flex justify-between items-center cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all"
                  onClick={() => setIsSupplierFilterOpen(!isSupplierFilterOpen)}
                >
                  <h3 className="font-bold text-white flex items-center gap-2">
                    🏢 Nhà cung cấp
                  </h3>
                  <IoChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ${isSupplierFilterOpen ? 'rotate-180' : ''}`} />
                </div>
                {isSupplierFilterOpen && (
                  <ul className="p-4 space-y-2 max-h-60 overflow-y-auto">
                    <li>
                      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.length === 0}
                          onChange={() => setSelectedSuppliers([])}
                          className="supplier-checkbox"
                        />
                        <span className="text-sm font-medium text-gray-700">Tất cả</span>
                      </label>
                    </li>
                    {apiSuppliers.map(s => {
                      const sid = String(s.tenNhaCungCap ?? s.name).toLowerCase();
                      const isChecked = selectedSuppliers.map(x => String(x).toLowerCase()).includes(sid);
                      return (
                        <li key={s.maNhaCungCap ?? s.id}>
                          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedSuppliers(prev => {
                                  const lowered = prev.map(x => String(x).toLowerCase());
                                  if (lowered.includes(sid)) return prev.filter(x => String(x).toLowerCase() !== sid);
                                  return [...prev, s.tenNhaCungCap ?? s.name];
                                });
                              }}
                              className="supplier-checkbox"
                            />
                            <span className="text-sm font-medium text-gray-700">{s.tenNhaCungCap ?? s.name}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div
                  className="p-4 bg-gradient-to-r from-green-500 to-green-600 flex justify-between items-center cursor-pointer hover:from-green-600 hover:to-green-700 transition-all"
                  onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                >
                  <h3 className="font-bold text-white flex items-center gap-2">
                    💰 Khoảng giá
                  </h3>
                  <IoChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ${isPriceFilterOpen ? 'rotate-180' : ''}`} />
                </div>
                {isPriceFilterOpen && (
                  <div className="p-4 space-y-3">
                    {[
                      { min: 0, max: 999999999, label: 'Tất cả', id: 'all' },
                      { min: 0, max: 1000000, label: 'Dưới 1 triệu', id: 'range1' },
                      { min: 1000000, max: 2000000, label: '1-2 triệu', id: 'range2' },
                      { min: 2000000, max: 3000000, label: '2-3 triệu', id: 'range3' },
                      { min: 3000000, max: 4000000, label: '3-4 triệu', id: 'range4' },
                      { min: 4000001, max: 999999999, label: 'Trên 4 triệu', id: 'range5' },
                    ].map(range => (
                      <label key={range.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="price-range"
                          checked={minPrice === range.min && maxPrice === range.max}
                          onChange={() => handlePriceRangeChange(range.min, range.max)}
                          className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <IoFunnel className="w-5 h-5" />
                🔄 Đặt lại bộ lọc
              </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 space-y-8">

              {/* Hero Banner */}
              <div className="relative h-80 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-bold mb-4 animate-bounce">
                    🔥 HOT SALE
                  </span>
                  <h2 className="text-6xl font-black text-white mb-4 drop-shadow-2xl transform group-hover:scale-110 transition-transform">
                    SALE UP TO 80%
                  </h2>
                  <p className="text-2xl text-white/90 font-semibold drop-shadow-lg mb-6">
                    ✨ TOÀN BỘ SẢN PHẨM NỘI THẤT VÀ TRANG TRÍ ✨
                  </p>
                  <button className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all">
                    🛍️ MUA NGAY
                  </button>
                </div>
              </div>

              {/* Products Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🏪 Tất cả sản phẩm
                  </h2>
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold shadow-lg">
                    {filteredProducts.length} sản phẩm
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">🔽 Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-blue-400 shadow-sm transition-all"
                  >
                    <option value="newest">🆕 Mới nhất</option>
                    <option value="price-low">💸 Giá thấp nhất</option>
                    <option value="price-high">💎 Giá cao nhất</option>
                    <option value="rating">⭐ Đánh giá cao</option>
                    <option value="name">🔤 Tên A-Z</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="text-center py-32">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 text-lg font-semibold">⏳ Đang tải sản phẩm...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-2xl shadow-lg">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 text-xl font-semibold mb-2">Không tìm thấy sản phẩm</p>
                  <p className="text-gray-500">Hãy thử điều chỉnh bộ lọc của bạn</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2"
                    >
                      {/* Product Image */}
                      <div
                        onClick={() => handleViewProduct(product)}
                        className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
                      >
                        <img
                          src={product.image || 'https://via.placeholder.com/300'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />

                        {/* Discount Badge */}
                        {product.discountPercent > 0 && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg animate-pulse">
                            🔥 -{product.discountPercent}%
                          </span>
                        )}

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-all"
                        >
                          <IoHeart className={`w-5 h-5 ${favoriteIds.has(product.id) ? 'text-red-500' : 'text-gray-400'}`} />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-5">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-2 tracking-wide">
                          📁 {product.category || 'Sản phẩm'}
                        </p>
                        <h3
                          onClick={() => handleViewProduct(product)}
                          className="font-bold text-gray-900 mb-3 text-base h-12 overflow-hidden hover:text-blue-600 transition-colors cursor-pointer line-clamp-2"
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        {/* Rating & Stock */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            {renderStars(product.rating)}
                            <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                          </div>
                          <span className={`text-xs font-semibold ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
                            {product.inStock ? `✓ Còn ${product.stockCount}` : '✗ Hết hàng'}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex flex-col gap-1 mb-4 min-h-[4rem]">
                          {product.originalPrice > 0 && product.isOnSale && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                          <span className="text-xl font-bold text-blue-600">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-center mt-12">
                <div className="flex gap-2 bg-white rounded-2xl shadow-lg p-2">
                  <button className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all font-semibold">
                    ← Trước
                  </button>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl shadow-lg">
                    1
                  </button>
                  <button className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all font-semibold">
                    2
                  </button>
                  <button className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all font-semibold">
                    3
                  </button>
                  <button className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all font-semibold">
                    Sau →
                  </button>
                </div>
              </div>

            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerShop;
