import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoHeart, IoHeartOutline, IoStar, IoSearch, IoClose, IoTrash, IoStorefront } from 'react-icons/io5';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product, onAddToCart, onToggleFavorite }) => {
  const { id, name, image, collection, rating, reviewCount, price, originalPrice } = product;

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  // Tính discount percent từ originalPrice và price
  const discountPercent = originalPrice > 0 && price > 0 && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100">
      <div className="relative overflow-hidden">
        <Link to={`/shop/products/${id}`} className="block">
          {image && image !== 'https://via.placeholder.com/300' ? (
            <img
              loading="lazy"
              src={image}
              alt={name}
              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 bg-gray-100"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-100 flex flex-col items-center justify-center">
              <IoStorefront className="w-20 h-20 text-gray-300 mb-2" />
              <span className="text-xs text-gray-400">Không có ảnh</span>
            </div>
          )}
        </Link>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 left-4">
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group/btn"
        >
          <IoHeart className="text-xl text-red-500 group-hover/btn:scale-125 transition-transform" />
        </button>
      </div>

      <div className="p-5">
        {/* Collection */}
        {collection && (
          <div className="text-xs text-orange-600 font-medium mb-2 uppercase tracking-wide">
            {collection}
          </div>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
          <Link
            to={`/shop/products/${id}`}
            className="hover:text-orange-600 transition-colors"
          >
            {name}
          </Link>
        </h3>

        {/* Rating */}
        {rating > 0 && reviewCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <IoStar
                  key={i}
                  className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex flex-col gap-1 mb-4 min-h-[5rem]">
          {price > 0 ? (
            <>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="font-bold text-2xl text-orange-600">
                {formatPrice(price)}
              </span>
            </>
          ) : (
            <span className="font-bold text-2xl text-orange-600">
              Liên hệ
            </span>
          )}
          {originalPrice && originalPrice > price && price > 0 && (
            <div className="text-xs text-green-600 font-medium">
              Tiết kiệm: {formatPrice(originalPrice - price)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <button
            onClick={onToggleFavorite}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
            title="Xóa khỏi yêu thích"
          >
            <IoTrash className="text-lg" />
            <span className="text-sm">Xóa khỏi yêu thích</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerFavorites = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const auth = useAuth();
  const currentUser = auth?.user ?? null;
  const { addToCart: ctxAddToCart } = useCart();

  useEffect(() => {
    const loadFavorites = async () => {

      try {
        const res = await api.get('/api/v1/yeu-thich');

        const data = res?.data || res || [];

        // Lấy tất cả sản phẩm từ shop API để có giá đầy đủ
        const shopResponse = await api.get('/api/products/shop');
        const shopData = shopResponse.data ?? shopResponse;
        const shopProducts = Array.isArray(shopData) ? shopData : (shopData.items ?? shopData.content ?? []);

        // Map product IDs từ favorites
        const favoriteIds = new Set((Array.isArray(data) ? data : []).map(p => p.maSanPham ?? p.id));

        // Filter shop products để chỉ lấy những sản phẩm yêu thích
        const mapped = shopProducts
          .filter(p => favoriteIds.has(p.maSanPham ?? p.id))
          .map(p => {
            // Main image logic
            const rawImages = Array.isArray(p.images) ? p.images : [];
            const images = rawImages.map(img => (typeof img === 'string' && img.startsWith('/') ? api.buildUrl(img) : img));
            const image = images.length > 0 ? images[0] : 'https://via.placeholder.com/300';

            // Category and collection
            const category = p.category?.name ?? '';
            const collection = p.boSuuTap?.name ?? '';

            // Rating and reviews
            const rating = Number(p.averageRating) || 0;
            const reviews = Number(p.reviewCount) || 0;

            // Lấy giá từ API response (giống CustomerShop)
            const price = p.lowestVariantPrice ?? p.minPrice ?? p.price ?? 0;
            const originalPrice = p.lowestVariantOriginalPrice ?? p.maxPrice ?? p.originalPrice ?? 0;
            const stockCount = p.totalStock ?? p.stockQuantity ?? 0;
            const inStock = stockCount > 0;
            const discountPercent = p.lowestVariantDiscountPercent ?? p.discountPercent ?? 0;
            const isOnSale = originalPrice > 0 && price < originalPrice;

            return {
              id: p.maSanPham ?? p.id,
              name: p.tenSanPham ?? p.name ?? 'Sản phẩm',
              price: Number(price) || 0,
              originalPrice: Number(originalPrice) || 0,
              image,
              category,
              collection,
              rating,
              reviews,
              inStock,
              discountPercent: Number(discountPercent) || 0,
              isOnSale,
              stockCount,
              diemThuong: p.diemThuong || 0
            };
          });

        setFavorites(mapped);
        try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { count: mapped.length } })); } catch (e) { }
      } catch (e) {
        setFavorites([]);
      }
    };
    loadFavorites();
  }, [currentUser]);

  const removeFromFavorites = async (id) => {
    try {
      if (auth?.isAuthenticated) {
        // Gọi API xóa khỏi database
        await api.del(`/api/v1/yeu-thich/${id}`);
      }

      // Cập nhật state
      setFavorites(prev => {
        const next = prev.filter(item => String(item.id) !== String(id));

        try {
          window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { count: next.length } }));
        } catch (e) { }

        return next;
      });
    } catch (e) {
      try {
        const msg = e?.data?.message || e?.message || 'Có lỗi xảy ra khi xóa sản phẩm yêu thích';
        alert(msg);
      } catch (_) {
        alert('Có lỗi xảy ra khi xóa sản phẩm yêu thích');
      }
    }
  };

  const addToCart = (product) => {
    if (!auth?.isAuthenticated) { window.location.href = '/login'; return false; }
    try {
      const ok = ctxAddToCart(product, null, 1);
      if (ok !== false) { try { window.alert(`Đã thêm "${product.name || 'sản phẩm'}" vào giỏ hàng`); } catch (e) { } }
      return ok;
    } catch (e) {
      return false;
    }
  };

  const filteredFavorites = favorites.filter(item => String(item?.name || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IoHeart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Sản phẩm yêu thích</h1>
                <p className="text-white/90 text-sm">
                  {favorites.length > 0
                    ? `Bạn có ${favorites.length} sản phẩm trong danh sách yêu thích`
                    : 'Chưa có sản phẩm nào trong danh sách'}
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <div className="text-right">
                <div className="text-white/90 text-sm mb-1">Tổng giá trị ước tính</div>
                <div className="text-3xl font-bold text-white">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    favorites.reduce((sum, p) => sum + (p.price || 0), 0)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Search Bar */}
        {favorites.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IoSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-10 py-3.5 border-2 border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                >
                  <IoClose className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map(item => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  name: item.name,
                  image: item.image,
                  collection: item.category,
                  rating: item.rating,
                  reviewCount: item.reviews,
                  price: item.price || 0,
                  originalPrice: item.originalPrice || 0,
                  discount: (item.originalPrice && item.price) ? (item.originalPrice - item.price) : 0,
                  isFavorite: true,
                  inStock: item.inStock !== false
                }}
                onAddToCart={() => addToCart(item)}
                onToggleFavorite={() => removeFromFavorites(item.id)}
              />
            ))}
          </div>
        ) : favorites.length > 0 && filteredFavorites.length === 0 ? (
          <div className="text-center py-20">
            <IoSearch className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 mb-6">Không có sản phẩm nào phù hợp với từ khóa "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Xóa tìm kiếm
            </button>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mb-6">
              <IoStorefront className="w-16 h-16 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Chưa có sản phẩm yêu thích</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Hãy khám phá và thêm những sản phẩm bạn yêu thích vào danh sách để dễ dàng theo dõi và mua sắm sau này
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <IoStorefront className="w-5 h-5" />
              Khám phá sản phẩm
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerFavorites;

