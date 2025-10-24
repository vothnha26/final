import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { IoChevronForward, IoCart, IoHeart, IoStar, IoImages, IoSparkles, IoPricetag } from 'react-icons/io5';
import CollectionsSidebar from './CollectionsSidebar';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

// Resolve relative image paths (starting with '/') to full URL using api.buildUrl
function resolveImage(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return api.buildUrl(path);
  return api.buildUrl('/' + path);
}

const CustomerCollectionDetail = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Load favorites from database
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteIds(new Set());
        return;
      }
      
      try {
        console.log('🔄 [CustomerCollectionDetail] Load danh sách yêu thích từ database...');
        const response = await api.get('/api/v1/yeu-thich');
        const favoriteProducts = response.data || [];
        const ids = new Set(favoriteProducts.map(p => p.maSanPham || p.id));
        setFavoriteIds(ids);
        console.log('✅ [CustomerCollectionDetail] Đã load', ids.size, 'sản phẩm yêu thích');
      } catch (error) {
        console.error('❌ [CustomerCollectionDetail] Lỗi khi load yêu thích:', error);
        setFavoriteIds(new Set());
      }
    };
    
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchList = async () => {
      try {
        const data = await api.get('/api/collections');
        if (mounted) setCollections(Array.isArray(data) ? data : (data.content || []));
      } catch (err) {
        if (mounted) setCollections([]);
      }
    };
    fetchList();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchOne = async () => {
      try {
        const data = await api.get(`/api/collections/${id}`);
        let products = [];
        try { products = await api.get(`/api/collections/${id}/products`); } catch (e) { products = []; }
        if (mounted) setCollection({ ...data, products });
      } catch (err) {
        if (mounted) setCollection(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOne();
    return () => { mounted = false; };
  }, [id]);

  const toggleFavorite = async (productId) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }
    
    try {
      const isFavorite = favoriteIds.has(productId);
      console.log(`${isFavorite ? '🗑️' : '💝'} [CustomerCollectionDetail] ${isFavorite ? 'Xóa' : 'Thêm'} yêu thích:`, productId);

      if (isFavorite) {
        // Remove from favorites
        await api.delete(`/api/v1/yeu-thich/${productId}`);
        console.log('✅ [CustomerCollectionDetail] Đã xóa khỏi yêu thích:', productId);
        
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
        console.log('✅ [CustomerCollectionDetail] Đã thêm vào yêu thích:', productId);
        
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
      console.error('❌ [CustomerCollectionDetail] Lỗi khi thao tác yêu thích:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const handleAddToCart = (product, prodImage) => {
    const productData = {
      id: product.maSanPham ?? product.id,
      name: product.tenSanPham ?? product.name,
      price: product.giaBan ?? product.price ?? (product.bienTheList && product.bienTheList[0] && (product.bienTheList[0].gia || product.bienTheList[0].giaBan)) ?? 0,
      image: prodImage || product.hinhAnh || (product.hinhAnhList && product.hinhAnhList[0]?.duongDanHinhAnh) || product.image || '',
      quantity: 1
    };
    
    console.log('Adding to cart:', productData); // Debug log
    addToCart(productData);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <IoStar key={i} className={`${i < Math.floor(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>
            🏠 Trang chủ
          </span>
          <IoChevronForward className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" onClick={() => navigate('/shop')}>
            🛍️ Cửa hàng
          </span>
          <IoChevronForward className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" onClick={() => navigate('/shop/collections')}>
            📦 Bộ sưu tập
          </span>
          <IoChevronForward className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {collection?.tenBoSuuTap || collection?.name || 'Chi tiết'}
          </span>
        </div>

        <div className="lg:flex lg:gap-8">
          <CollectionsSidebar collections={collections} activeId={id} />

          <main className="flex-1 space-y-8">
            {loading ? (
              <div className="text-center py-32">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-600 text-lg font-semibold">⏳ Đang tải bộ sưu tập...</p>
              </div>
            ) : !collection ? (
              <div className="text-center py-32 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-gray-600 text-xl font-semibold mb-2">Không tìm thấy bộ sưu tập</p>
                <p className="text-gray-500 mb-6">Bộ sưu tập này có thể đã bị xóa hoặc không tồn tại.</p>
                <button
                  onClick={() => navigate('/shop/collections')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                >
                  Quay lại danh sách
                </button>
              </div>
            ) : (
              <>
                {/* Collection Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="relative">
                    {/* Collection Image */}
                    {(collection.hinhAnh || collection.hinhAnhList || collection.image) ? (
                      <div className="relative h-80 overflow-hidden">
                        <img
                          src={resolveImage(collection.hinhAnh || (collection.hinhAnhList && collection.hinhAnhList[0]?.duongDanHinhAnh) || collection.image)}
                          alt={collection.tenBoSuuTap || collection.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        
                        {/* Content overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <span className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold mb-4 flex items-center gap-2 w-fit">
                            <IoSparkles />
                            BỘ SƯU TẬP ĐẶC BIỆT
                          </span>
                          <h1 className="text-5xl font-black mb-4 drop-shadow-2xl">
                            {collection.tenBoSuuTap || collection.name}
                          </h1>
                          <p className="text-xl text-white/90 font-medium drop-shadow-lg max-w-3xl">
                            {collection.moTa || collection.description || 'Khám phá những sản phẩm độc đáo được tuyển chọn kỹ lưỡng'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-white">
                        <IoImages className="w-24 h-24 mx-auto mb-4 opacity-50" />
                        <h1 className="text-4xl font-black mb-4">{collection.tenBoSuuTap || collection.name}</h1>
                        <p className="text-xl opacity-90">{collection.moTa || collection.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Section */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                      <IoPricetag className="text-purple-600" />
                      Sản phẩm trong bộ sưu tập
                    </h2>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold shadow-lg">
                      {collection.products?.length || 0} sản phẩm
                    </span>
                  </div>

                  {(!collection.products || collection.products.length === 0) ? (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-600 text-lg font-semibold">Chưa có sản phẩm nào</p>
                      <p className="text-gray-500">Bộ sưu tập này đang được cập nhật.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {collection.products.map(p => {
                        const prodId = p.maSanPham ?? p.id;
                        const prodName = p.tenSanPham ?? p.name;
                        let rawImg = null;
                        if (p.hinhAnhList && p.hinhAnhList.length > 0) {
                          rawImg = p.hinhAnhList[0].duongDanHinhAnh || p.hinhAnhList[0].duongDan || null;
                        }
                        if (!rawImg) rawImg = p.hinhAnh || p.image || null;
                        const prodImage = rawImg ? resolveImage(rawImg) : null;
                        const price = p.giaBan ?? p.price ?? (p.bienTheList && p.bienTheList[0] && (p.bienTheList[0].gia || p.bienTheList[0].giaBan));
                        const rating = p.danhGia ?? p.rating ?? 4.5;
                        const reviews = p.soLuotDanhGia ?? p.reviews ?? 0;
                        const inStock = p.trangThai === 'active' || p.status === 'active' || true;

                        return (
                          <article 
                            key={prodId} 
                            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2"
                          >
                            {/* Product Image */}
                            <div
                              onClick={() => navigate(`/shop/products/${prodId}`)}
                              className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
                            >
                              {prodImage ? (
                                <img src={prodImage} alt={prodName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <IoImages className="w-16 h-16 text-gray-300 mb-2" />
                                  <span className="text-gray-400 text-sm">Chưa có hình ảnh</span>
                                </div>
                              )}
                              
                              {/* Favorite Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(prodId);
                                }}
                                className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-all"
                              >
                                <IoHeart className={`w-5 h-5 ${favoriteIds.has(prodId) ? 'text-red-500' : 'text-gray-400'}`} />
                              </button>
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                              <h3
                                onClick={() => navigate(`/shop/products/${prodId}`)}
                                className="font-bold text-gray-900 mb-2 text-base h-12 overflow-hidden hover:text-purple-600 transition-colors cursor-pointer line-clamp-2"
                                title={prodName}
                              >
                                {prodName}
                              </h3>

                              {/* Rating */}
                              <div className="flex items-center gap-1 mb-3">
                                {renderStars(rating)}
                                <span className="text-xs text-gray-500 ml-1">({reviews})</span>
                              </div>

                              {/* Price */}
                              <div className="mb-4">
                                <span className="text-xl font-bold text-purple-600">
                                  {price ? formatPrice(price) : 'Liên hệ'}
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(p, prodImage);
                                  }}
                                  disabled={!inStock}
                                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                                    inStock
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-2xl transform hover:scale-105'
                                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <IoCart className="w-4 h-4" />
                                  {inStock ? 'Thêm' : 'Hết'}
                                </button>
                                <Link
                                  to={`/shop/products/${prodId}`}
                                  className="px-4 py-2.5 border-2 border-purple-500 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-50 transition-all"
                                >
                                  Chi tiết
                                </Link>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerCollectionDetail;
