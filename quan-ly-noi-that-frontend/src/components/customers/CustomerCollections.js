import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoChevronForward, IoImages, IoSparkles } from 'react-icons/io5';
import CollectionsSidebar from './CollectionsSidebar';
import api from '../../api';

// Resolve relative image paths (starting with '/') to full URL using api.buildUrl
function resolveImage(path) {
  if (!path) return null;
  // If already absolute URL (http/https), return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // If path starts with '/', treat as server-hosted static and prefix with API base
  if (path.startsWith('/')) return api.buildUrl(path);
  // Otherwise also try to prefix (covers uploads without leading slash)
  return api.buildUrl('/' + path);
}

const CustomerCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchCollections = async () => {
      try {
        const data = await api.get('/api/collections');
        if (mounted) setCollections(Array.isArray(data) ? data : (data.content || []));
      } catch (err) {
        // fallback to a small mock if backend not available
        if (mounted) setCollections([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCollections();
    return () => { mounted = false; };
  }, []);

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
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Bộ sưu tập
          </span>
        </div>

        <div className="lg:flex lg:gap-8">
          <CollectionsSidebar collections={collections} />

          <main className="flex-1 space-y-8">
            
            {/* Hero Banner */}
            <div className="relative h-64 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
              <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-10">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-bold mb-4 animate-bounce">
                  ✨ EXCLUSIVE
                </span>
                <h2 className="text-5xl font-black text-white mb-4 drop-shadow-2xl transform group-hover:scale-110 transition-transform">
                  BỘ SƯU TẬP ĐẶC BIỆT
                </h2>
                <p className="text-xl text-white/90 font-semibold drop-shadow-lg">
                  🎨 KHÁM PHÁ CÁC SẢN PHẨM ĐƯỢC TUYỂN CHỌN KỸ LƯỠNG 🎨
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                  <IoImages className="text-purple-600" />
                  Tất cả bộ sưu tập
                </h1>
                <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold shadow-lg">
                  {collections.length} bộ sưu tập
                </span>
              </div>
              <p className="text-gray-600 mt-2 text-lg">Khám phá những bộ sưu tập nội thất được tuyển chọn đặc biệt cho không gian của bạn.</p>
            </div>

            {/* Collections Grid */}
            {loading ? (
              <div className="text-center py-32">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-600 text-lg font-semibold">⏳ Đang tải bộ sưu tập...</p>
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 text-xl font-semibold mb-2">Chưa có bộ sưu tập nào</p>
                <p className="text-gray-500">Hãy quay lại sau để khám phá các bộ sưu tập mới!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map(col => (
                  <article 
                    key={col.maBoSuuTap ?? col.id} 
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                      {col.hinhAnh || (col.hinhAnhList && col.hinhAnhList[0]) || col.image ? (
                        <img 
                          src={resolveImage(col.hinhAnh || (col.hinhAnhList && col.hinhAnhList[0]?.duongDanHinhAnh) || col.image)} 
                          alt={col.tenBoSuuTap || col.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <IoImages className="w-16 h-16 text-purple-300 mb-2" />
                          <span className="text-purple-400 font-medium">Chưa có hình ảnh</span>
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Sparkle badge */}
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                        <IoSparkles />
                        COLLECTION
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                        {col.tenBoSuuTap || col.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                        {col.moTa || col.description || 'Khám phá những sản phẩm độc đáo trong bộ sưu tập này'}
                      </p>
                      
                      {/* View button */}
                      <Link 
                        to={`/shop/collections/${col.maBoSuuTap ?? col.id}`} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95"
                      >
                        <IoImages className="w-5 h-5" />
                        Xem bộ sưu tập
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerCollections;
