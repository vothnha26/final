import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoSearch, IoFilter, IoHeart, IoCart, IoStar, IoGrid, IoList, IoArrowForward } from 'react-icons/io5';
// note: FontAwesome icons removed (unused)
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

// Mapping functions for Vietnamese API field names
const mapProductFromApi = (product) => {
  // Support multiple possible API field names and ensure numeric values
  const rawPrice = product.gia ?? product.giaBan ?? product.price ?? product.gia_ban ?? 0;
  const rawOriginal = product.gia_goc ?? product.giaGoc ?? product.originalPrice ?? product.gia_goc ?? 0;

  const price = Number(rawPrice) || 0;
  const originalPrice = Number(rawOriginal) || 0;

  // Compute image and images without mixing nullish coalescing and logical operators in one expression
  let image = '';
  if (product.hinh_anh) image = product.hinh_anh;
  else if (product.image) image = product.image;
  else if (product.danh_sach_hinh_anh && Array.isArray(product.danh_sach_hinh_anh) && product.danh_sach_hinh_anh.length > 0) image = product.danh_sach_hinh_anh[0];

  const rawImages = Array.isArray(product.danh_sach_hinh_anh) ? product.danh_sach_hinh_anh : (Array.isArray(product.images) ? product.images : []);
  // Normalize relative image paths to absolute using api.buildUrl when needed
  const images = rawImages.map(img => (typeof img === 'string' && img.startsWith('/') ? api.buildUrl(img) : img));

  return {
    id: product.id ?? product.ma_san_pham ?? product.maSanPham,
    name: product.ten ?? product.tenSanPham ?? product.name ?? 'Sản phẩm',
    price,
    originalPrice,
    image,
    images,
    category: product.danh_muc ?? product.category ?? '',
    categoryId: product.danh_muc_id ?? product.categoryId,
    collection: product.bo_suu_tap ?? product.collection ?? '',
    collectionId: product.bo_suu_tap_id ?? product.collectionId,
    description: product.mo_ta ?? product.description ?? '',
    rating: Number(product.danh_gia ?? product.rating) || 0,
    reviewCount: Number(product.so_luot_danh_gia ?? product.reviewCount) || 0,
    isInStock: Number(product.ton_kho ?? product.so_luong_ton_kho ?? product.stockQuantity) > 0,
    stockQuantity: Number(product.ton_kho ?? product.so_luong_ton_kho ?? product.stockQuantity) || 0,
    discount: Number(product.giam_gia ?? product.discount) || 0,
    isNew: Boolean(product.san_pham_moi ?? product.isNew),
    isFeatured: Boolean(product.noi_bat ?? product.isFeatured),
    variants: Number(product.so_luong_bien_the ?? product.soLuongBienThe ?? product.availableVariantCount ?? product.available_variant_count ?? product.so_luong_bien_the ?? product.variants ?? 0) || 0,
    attributes: (product.thuoc_tinh || product.attributes || []).map(attr => ({
      name: attr.ten_thuoc_tinh ?? attr.name,
      value: attr.gia_tri ?? attr.value
    })),
    // Computed flags
    isOnSale: originalPrice > 0 && price < originalPrice
  };
};

const mapCategoryFromApi = (category) => ({
  id: category.id,
  name: category.ten,
  description: category.mo_ta,
  icon: category.icon,
  productCount: category.so_san_pham || 0,
  isActive: category.kich_hoat
});

const CustomerShopPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState('');
  // local loading/error handled inside fetch functions

  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  // Pagination
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [totalPages, setTotalPages] = useState(null);
  const [lastFilters, setLastFilters] = useState({});

  // API Functions
  const fetchFavorites = useCallback(async () => {
    if (!auth?.isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }

    try {
      const response = await api.get('/api/v1/yeu-thich');
      const favoriteProducts = response.data || [];
      const ids = new Set(favoriteProducts.map(p => p.maSanPham || p.id));
      setFavoriteIds(ids);

      // Update products with favorite status
      setProducts(prev => prev.map(p => ({
        ...p,
        isFavorite: ids.has(p.id)
      })));
    } catch (error) {
      setFavoriteIds(new Set());
    }
  }, [auth?.isAuthenticated]);

  const fetchProducts = useCallback(async (filters = {}, requestedPage = 0, requestedSize = size, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('tim_kiem', filters.search);
      if (filters.categoryId) params.append('danh_muc_id', filters.categoryId);
      if (filters.collectionId) params.append('bo_suu_tap_id', filters.collectionId);
      if (filters.minPrice) params.append('gia_tu', filters.minPrice);
      if (filters.maxPrice) params.append('gia_den', filters.maxPrice);
      if (filters.sortBy) params.append('sap_xep', filters.sortBy);
      // Pagination params
      if (requestedPage !== undefined && requestedPage !== null) params.append('page', String(requestedPage));
      if (requestedSize !== undefined && requestedSize !== null) params.append('size', String(requestedSize));

      // Prefer a shop-optimized endpoint that returns variant-aware min/max prices and stock
      let response;
      try {
        response = await api.get(`/api/products/shop?${params.toString()}`);
      } catch (e) {
        // Fallback to the legacy products endpoint if shop endpoint not available
        // Legacy doesn't support page/size; request without pagination
        response = await api.get(`/api/products?${params.toString()}`);
      }

      // Debug: log the first few items so we can inspect the API shape in the browser console
      try {
      } catch (e) {
        // ignore
      }

      // Map either shop DTOs or legacy product objects into the UI product shape
      // If backend returned paged response (items + page metadata)
      const payload = response.data && response.data.items ? response.data : response.data;

      const sourceArray = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload) ? payload : []);

      const mapped = sourceArray.map((p) => {
        // If the backend returned the shop DTO fields (minPrice/maxPrice/stockQuantity)
        if (p && (p.minPrice !== undefined || p.min_price !== undefined || p.price !== undefined || p.maSanPham !== undefined)) {
          const min = Number(p.minPrice ?? p.min_price ?? p.price ?? 0) || 0;
          const max = Number(p.maxPrice ?? p.max_price ?? p.originalPrice ?? 0) || 0;
          const price = min;
          const originalPrice = (max > min) ? max : 0; // only treat as original price when it's greater than min
          const stock = Number(p.stockQuantity ?? p.totalStock ?? p.so_luong_ton ?? 0) || 0;

          const rawImages = Array.isArray(p.images) ? p.images : (Array.isArray(p.hinhAnhs) ? p.hinhAnhs.map(h => h.duongDanHinhAnh) : []);
          const images = rawImages.map(img => (typeof img === 'string' && img.startsWith('/') ? api.buildUrl(img) : img));
          const image = images.length > 0 ? images[0] : '';

          // determine dto-level discount info without relying on min/max price range
          let dtoOriginalPrice = Number(p.originalPrice ?? p.giaGoc ?? 0) || 0;
          let dtoDiscountPercent = p.discountPercent ?? p.phanTramGiamGia ?? null;
          dtoDiscountPercent = dtoDiscountPercent != null ? Number(dtoDiscountPercent) || 0 : null;
          let dtoDiscountAmount = 0;

          // find variant-level discounted variant (if any)
          let dtoLowestVariantOverall = null;
          let dtoLowestVariantDiscounted = null;
          try {
            const rawVariants = p.bienTheList ?? p.bienThe ?? p.variants ?? p.variantDtos ?? [];
            if (Array.isArray(rawVariants) && rawVariants.length > 0) {
              rawVariants.forEach(v => {
                const vPrice = Number(v.giaBan ?? v.gia ?? v.price ?? v.priceAfterDiscount ?? price) || 0;
                const vOriginal = Number(v.giaGoc ?? v.gia_goc ?? v.originalPrice ?? dtoOriginalPrice) || 0;
                let vDiscountPercent = v.phanTramGiamGia ?? v.discountPercent ?? null;
                vDiscountPercent = vDiscountPercent != null ? Number(vDiscountPercent) || 0 : 0;
                if ((!v.phanTramGiamGia && !v.discountPercent) && vOriginal > 0 && vPrice < vOriginal) {
                  vDiscountPercent = Math.round(((vOriginal - vPrice) / vOriginal) * 100);
                }
                const vDiscountAmount = vOriginal > 0 && vPrice < vOriginal ? (vOriginal - vPrice) : 0;
                const finalPrice = vPrice;

                if (!dtoLowestVariantOverall || finalPrice < dtoLowestVariantOverall.finalPrice) {
                  dtoLowestVariantOverall = { id: v.maBienThe ?? v.id ?? v.variantId, price: vPrice, originalPrice: vOriginal, discountPercent: vDiscountPercent > 0 ? vDiscountPercent : null, discountAmount: vDiscountAmount, finalPrice };
                }
                const hasDiscount = vDiscountAmount > 0 || (vDiscountPercent && vDiscountPercent > 0) || Boolean(v.priceAfterDiscount) || (vPrice < vOriginal && vOriginal > 0);
                if (hasDiscount) {
                  if (!dtoLowestVariantDiscounted || finalPrice < dtoLowestVariantDiscounted.finalPrice) {
                    dtoLowestVariantDiscounted = { id: v.maBienThe ?? v.id ?? v.variantId, price: vPrice, originalPrice: vOriginal, discountPercent: vDiscountPercent > 0 ? vDiscountPercent : null, discountAmount: vDiscountAmount, finalPrice };
                  }
                }
              });
            }
          } catch (e) {
            dtoLowestVariantOverall = null;
            dtoLowestVariantDiscounted = null;
          }

          // final dto discount priority: explicit dto discountPercent > variant-level discounted variant
          const finalDtoDiscountPercent = dtoDiscountPercent ?? dtoLowestVariantDiscounted?.discountPercent ?? null;
          if (dtoLowestVariantDiscounted) {
            dtoDiscountAmount = dtoLowestVariantDiscounted.discountAmount ?? 0;
          } else if (finalDtoDiscountPercent != null && finalDtoDiscountPercent > 0 && dtoOriginalPrice > 0) {
            dtoDiscountAmount = Math.round((finalDtoDiscountPercent / 100) * dtoOriginalPrice);
          }
          dtoDiscountPercent = finalDtoDiscountPercent;

          return {
            id: p.maSanPham ?? p.id ?? p.ma_san_pham,
            name: p.tenSanPham ?? p.name ?? p.ten ?? 'Sản phẩm',
            price,
            originalPrice,
            image,
            images,
            category: p.danhMuc?.name ?? p.danh_muc ?? p.category ?? '',
            categoryId: p.danhMuc?.id ?? p.danh_muc_id ?? p.categoryId,
            collection: p.boSuuTap?.name ?? p.bo_suu_tap ?? p.collection ?? '',
            collectionId: p.boSuuTap?.id ?? p.bo_suu_tap_id ?? p.collectionId,
            description: p.moTa ?? p.description ?? '',
            rating: Number(p.rating ?? p.danh_gia) || 0,
            reviewCount: Number(p.reviewCount ?? p.so_luot_danh_gia) || 0,
            isInStock: stock > 0,
            stockQuantity: stock,
            // discount amount (prefer explicit/variant-derived values) — do not derive from min/max price
            discount: dtoDiscountAmount,
            isNew: Boolean(p.isNew ?? p.san_pham_moi),
            isFeatured: Boolean(p.isFeatured ?? p.noi_bat),
            variants: Number(p.availableVariantCount ?? p.soLuongBienThe ?? p.available_variant_count ?? p.so_luong_bien_the ?? p.soLuongBienThe ?? p.so_luong_bien_the ?? p.variants ?? 0) || 0,
            tags: p.tags || p.nhan || [],
            attributes: p.attributes || p.thuoc_tinh || [],
            // mark on sale only when there is an explicit dto-level discount or a variant with a discount
            isOnSale: Boolean(dtoLowestVariantDiscounted) || (dtoDiscountPercent != null && dtoDiscountPercent > 0)
          };
        }

        return mapProductFromApi(p);
      });

      // If paged response, update pagination info and either append or replace
      if (response.data && response.data.items) {
        const respPage = Number(response.data.page ?? requestedPage) || 0;
        const respSize = Number(response.data.size ?? requestedSize) || requestedSize;
        const respTotalPages = Number(response.data.totalPages ?? Math.ceil((response.data.totalItems || 0) / respSize));

        setPage(respPage);
        setSize(respSize);
        setTotalPages(respTotalPages);

        // Mark products as favorite based on favoriteIds
        const mappedWithFavorites = mapped.map(p => ({
          ...p,
          isFavorite: favoriteIds.has(p.id)
        }));

        setProducts(prev => append ? [...prev, ...mappedWithFavorites] : mappedWithFavorites);
      } else {
        // legacy array response — treat as single full page (replace)
        setPage(0);
        setSize(mapped.length);
        setTotalPages(1);

        // Mark products as favorite based on favoriteIds
        const mappedWithFavorites = mapped.map(p => ({
          ...p,
          isFavorite: favoriteIds.has(p.id)
        }));

        setProducts(mappedWithFavorites);
      }
    } catch (error) {
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [size, favoriteIds]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.map(mapCategoryFromApi));
    } catch (error) {

    }
  };

  const fetchCollections = async () => {
    try {
      const response = await api.get('/api/collections');
      setCollections(response.data.map(collection => ({
        id: collection.id,
        name: collection.ten,
        description: collection.mo_ta,
        productCount: collection.so_san_pham || 0
      })));
    } catch (error) {

    }
  };

  const addToFavorites = async (productId) => {
    try {
      const isAuthenticated = auth?.isAuthenticated;
      // Accept either product object or id
      const id = typeof productId === 'object' ? (productId.id ?? productId.maSanPham) : productId;

      if (!isAuthenticated) {
        // redirect to login
        window.location.href = '/login';
        return;
      }

      // Check if product is already in favorites
      const isFavorite = favoriteIds.has(id);

      if (isFavorite) {
        // Remove from favorites
        await api.delete(`/api/v1/yeu-thich/${id}`);

        // Update favoriteIds
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        // Update UI
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: false } : p));

        // Dispatch event to update favorites count
        window.dispatchEvent(new CustomEvent('favorites:changed', {
          detail: { count: favoriteIds.size - 1 }
        }));
      } else {
        // Add to favorites
        await api.post('/api/v1/yeu-thich', { productId: id });

        // Update favoriteIds
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.add(id);
          return newSet;
        });

        // Update UI
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: true } : p));

        // Dispatch event to update favorites count
        window.dispatchEvent(new CustomEvent('favorites:changed', {
          detail: { count: favoriteIds.size + 1 }
        }));
      }
    } catch (error) {
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const { addToCart: cartAddToCart } = useCart();

  const addToCart = async (productId, quantity = 1) => {
    try {
      if (!auth?.isAuthenticated) {
        window.location.href = '/login';
        return;
      }
      // Find product object to provide to cart (so CartContext can derive image/price/variant)
      const product = products.find(p => String(p.id) === String(productId)) || { id: productId };
      const ok = cartAddToCart(product, null, quantity);
      // Only update UI when addToCart did not redirect or return false
      if (ok !== false) {
        // optimistic UI mark
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, inCart: true } : p));
      }
    } catch (error) {

    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCollections();
    fetchFavorites();
    fetchProducts({}, 0, size, false);
  }, [fetchProducts, fetchFavorites, size]);

  // Load favorites when auth state changes
  useEffect(() => {
    fetchFavorites();
  }, [auth?.isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the URL contains ?tab=collections (header links use this), redirect to the dedicated collections route
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      if (params.get('tab') === 'collections') {
        navigate('/shop/collections');
      }
    } catch (e) {
      // ignore
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const filters = {
      search: searchTerm,
      categoryId: selectedCategory,
      collectionId: selectedCollection,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy: sortBy
    };
    // reset to first page when filters change
    setLastFilters(filters);
    fetchProducts(filters, 0, size, false);
  }, [searchTerm, selectedCategory, selectedCollection, priceRange, sortBy, fetchProducts, size]);

  // start with empty lists; UI updates when API responses arrive

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    const matchesCollection = selectedCollection === '' || product.collection === selectedCollection;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesCollection && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative">
        <img
          loading="lazy"
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {(product.discountPercent != null && product.discountPercent > 0) || (product.discount && product.discount > 0) ? (
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              -{product.discountPercent != null && product.discountPercent > 0 ? product.discountPercent : Math.round(((product.discount || 0) / (product.originalPrice || 1)) * 100)}%
            </span>
          ) : null}
        </div>

        {/* Favorite Button */}
        <button onClick={() => addToFavorites(product.id)} className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <IoHeart className={product.isFavorite ? 'text-red-500' : 'text-gray-400'} />
        </button>

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button onClick={() => {/* open detail handled by parent if needed */ }} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Xem chi tiết
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.collection}</div>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <IoStar
                key={i}
                className={`text-sm ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">
              {product.price > 0 ? formatPrice(product.price) : 'Liên hệ'}
            </span>
            {/* show discount percent badge (prefer explicit discountPercent or computed from discount amount) */}
            {(product.discountPercent != null && product.discountPercent > 0) || (product.discount && product.discount > 0) ? (
              <span className="text-sm text-red-600 font-medium">-
                {product.discountPercent != null && product.discountPercent > 0 ? product.discountPercent : Math.round(((product.discount || 0) / (product.originalPrice || 1)) * 100)}%</span>
            ) : null}
          </div>
          {(product.discount && product.discount > 0) && (
            <div className="text-xs text-gray-500">Tiết kiệm: {formatPrice(product.discount)}</div>
          )}
        </div>

        {/* Variants */}
        <div className="text-xs text-gray-500 mb-3">
          {product.variants} biến thể có sẵn
        </div>

        {/* Add to Cart Button */}
        <button onClick={() => addToCart(product.id, 1)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
          <IoCart />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );

  const ProductListItem = ({ product }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex">
      <div className="relative w-48 h-48 flex-shrink-0">
        <img
          loading="lazy"
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Badges */}
        {(product.discountPercent != null && product.discountPercent > 0) || (product.discount && product.discount > 0) ? (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            -{product.discountPercent != null && product.discountPercent > 0 ? product.discountPercent : Math.round(((product.discount || 0) / (product.originalPrice || 1)) * 100)}%
          </span>
        ) : null}
      </div>

      <div className="flex-1 p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-1">{product.collection}</div>
            <h3 className="font-semibold text-xl text-gray-900 mb-2">{product.name}</h3>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <IoStar
                    key={i}
                    className={`text-lg ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviewCount} đánh giá)
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              {product.variants} biến thể có sẵn
            </div>
          </div>

          <div className="text-right">
            <button onClick={() => addToFavorites(product.id)} className="mb-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              <IoHeart className={product.isFavorite ? 'text-red-500' : 'text-gray-400'} />
            </button>

            <div className="mb-4">
              <div className="font-bold text-xl text-gray-900">
                {product.price > 0 ? formatPrice(product.price) : 'Liên hệ'}
              </div>
              {(product.discount && product.discount > 0) && (
                <div className="text-sm text-gray-500">Tiết kiệm: {formatPrice(product.discount)}</div>
              )}
            </div>

            <button onClick={() => addToCart(product.id, 1)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <IoCart />
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Khám phá bộ sưu tập nội thất cao cấp</h1>
            <p className="text-xl text-blue-100 mb-8">
              Tìm kiếm món đồ nội thất hoàn hảo cho không gian sống của bạn
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? '' : category.name)}
                  className={`p-6 rounded-lg border-2 transition-colors text-center ${selectedCategory === category.name
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  <IconComponent className="text-3xl mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm opacity-75">{category.count} sản phẩm</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Bộ lọc</h3>

              {/* Collections */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Bộ sưu tập</h4>
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => setSelectedCollection(selectedCollection === collection.name ? '' : collection.name)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedCollection === collection.name
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{collection.name}</span>
                        <span className="text-sm">({collection.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Khoảng giá</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Đến"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000000])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <IoFilter />
                    Bộ lọc
                  </button>

                  <span className="text-gray-600">
                    Hiển thị {sortedProducts.length} sản phẩm
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="featured">Nổi bật</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-low">Giá thấp đến cao</option>
                    <option value="price-high">Giá cao đến thấp</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>

                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <IoGrid />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <IoList />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <IoSearch className="text-4xl text-gray-400 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-600">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-6'
              }>
                {sortedProducts.map((product) =>
                  viewMode === 'grid' ? (
                    <ProductCard key={product.id} product={product} />
                  ) : (
                    <ProductListItem key={product.id} product={product} />
                  )
                )}
              </div>
            )}

            {/* Load More */}
            {(sortedProducts.length > 0 && (totalPages === null || page < (totalPages - 1))) && (
              <div className="text-center mt-12">
                <button onClick={async () => {
                  const nextPage = (page || 0) + 1;
                  await fetchProducts(lastFilters || {}, nextPage, size, true);
                }} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors">
                  Xem thêm sản phẩm
                  <IoArrowForward />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerShopPage;
