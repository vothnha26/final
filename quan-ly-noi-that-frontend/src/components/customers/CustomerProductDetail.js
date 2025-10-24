import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { 
    IoArrowBack, IoStar, IoStarOutline, IoHeart, IoHeartOutline, 
    IoCart, IoCheckmarkCircle, IoWarning, IoChevronForward,
    IoShareSocial, IoGiftOutline, IoFlashOutline, IoShieldCheckmark
} from 'react-icons/io5';

const CustomerProductDetail = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { user } = useAuth();
    const { addToCart, isInCart, getItemQuantity } = useCart();
    
    // States
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });

    // Fetch product detail
    useEffect(() => {
        const fetchProductDetail = async () => {
            if (!params.id) return;
            
            setIsLoading(true);
            try {
                const response = await api.get(`/api/products/${params.id}/detail`);
                const data = response.data ?? response;
                setProduct(data);
                
                // Auto-select first variant if available
                if (data.bienThe && data.bienThe.length > 0) {
                    setSelectedVariant(data.bienThe[0]);
                }

                // Fetch related products
                if (data.danhMuc?.maDanhMuc) {
                    try {
                        const relatedRes = await api.get(`/api/products/shop?categoryId=${data.danhMuc.maDanhMuc}`);
                        const relatedData = relatedRes.data ?? relatedRes;
                        const relatedList = Array.isArray(relatedData) ? relatedData : (relatedData.items ?? relatedData.content ?? []);
                        setRelatedProducts(relatedList.filter(p => p.maSanPham !== data.maSanPham).slice(0, 6));
                    } catch (err) {

                    }
                }

                // Fetch reviews
                try {
                    const reviewRes = await api.get(`/api/v1/reviews/product/${params.id}`);
                    const reviewData = reviewRes.data ?? reviewRes;
                    setReviews(Array.isArray(reviewData) ? reviewData : (reviewData.items ?? reviewData.content ?? []));
                } catch (err) {
                    
                }
            } catch (err) {
                
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductDetail();
    }, [params.id]);

    // Helper functions
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const resolveImageUrl = (img) => {
        if (!img) return null;
        if (typeof img === 'string') {
            if (img.startsWith('http')) return img;
            if (img.startsWith('/')) return api.buildUrl(img);
            return api.buildUrl(`/uploads/products/${img}`);
        }
        if (img.duongDanHinhAnh) return api.buildUrl(img.duongDanHinhAnh);
        return null;
    };

    const renderStars = (rating, size = 'w-5 h-5') => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                i <= Math.floor(rating) 
                    ? <IoStar key={i} className={`${size} text-yellow-400`} />
                    : <IoStarOutline key={i} className={`${size} text-gray-300`} />
            );
        }
        return stars;
    };

    const handleAddToCart = () => {
        if (!selectedVariant) {
            alert('Vui lòng chọn phiên bản sản phẩm!');
            return;
        }
        
        const stock = selectedVariant.soLuong || 0;
        if (stock === 0) {
            alert('Sản phẩm đã hết hàng!');
            return;
        }
        
        if (quantity > stock) {
            alert(`Chỉ còn ${stock} sản phẩm trong kho!`);
            return;
        }

        // Prepare product data
        const productData = {
            id: product.maSanPham,
            maSanPham: product.maSanPham,
            tenSanPham: product.tenSanPham,
            name: product.tenSanPham,
            hinhAnh: product.hinhAnh,
            image: product.hinhAnh?.[0] ? resolveImageUrl(product.hinhAnh[0]) : null
        };

        // Prepare variant data
        const variantData = {
            id: selectedVariant.maBienThe,
            maBienThe: selectedVariant.maBienThe,
            name: selectedVariant.thuocTinh?.map(attr => attr.giaTri).join(' - ') || selectedVariant.sku,
            price: selectedVariant.giaSauGiam || selectedVariant.giaBan || 0,
            giaSauGiam: selectedVariant.giaSauGiam,
            giaBan: selectedVariant.giaBan,
            image: product.hinhAnh?.[0] ? resolveImageUrl(product.hinhAnh[0]) : null
        };
        
        // Call addToCart with 3 parameters as expected by CartContext
        addToCart(productData, variantData, quantity);

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 3000);
    };

    const handleSubmitReview = async () => {
        if (!user) {
            alert('Vui lòng đăng nhập để đánh giá!');
            return;
        }

        try {
            await api.post('/api/v1/reviews', {
                sanPham: { maSanPham: product.maSanPham },
                diem: newReview.rating, // Changed from 'danhGia' to 'diem' to match backend entity
                tieuDe: newReview.title,
                noiDung: newReview.content
            });
            
            // Reload reviews
            const reviewRes = await api.get(`/api/v1/reviews/product/${product.maSanPham}`);
            setReviews(reviewRes.data ?? reviewRes);
            
            setShowReviewModal(false);
            setNewReview({ rating: 5, title: '', content: '' });
            alert('Đánh giá của bạn đã được gửi!');
        } catch (err) {
            alert('Không thể gửi đánh giá. Vui lòng thử lại!');
        }
    };

    // Active price and stock
    const activePrice = selectedVariant?.giaSauGiam || selectedVariant?.giaBan || product?.giaMin || 0;
    const activeOriginalPrice = selectedVariant?.giaGoc || selectedVariant?.giaBan || product?.giaGocMin || 0;
    const activeStock = selectedVariant?.soLuong || product?.tongSoLuong || 0;
    const discountPercent = activeOriginalPrice > activePrice 
        ? Math.round((1 - activePrice / activeOriginalPrice) * 100) 
        : 0;

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 animate-pulse">
                        <div className="h-10 w-40 bg-gray-200 rounded-lg mb-6"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="aspect-square bg-gray-200 rounded-xl"></div>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="h-12 bg-gray-200 rounded-lg w-3/4"></div>
                                <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                                <div className="h-32 bg-gray-200 rounded-xl"></div>
                                <div className="h-20 bg-gray-200 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h2>
                    <button
                        onClick={() => navigate('/shop')}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                        Quay lại cửa hàng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Success notification */}
            {addedToCart && (
                <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <IoCheckmarkCircle className="w-6 h-6" />
                    <span className="font-semibold">✨ Đã thêm vào giỏ hàng!</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto p-6">
                {/* Gradient Header with Breadcrumb */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-6 shadow-xl">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/shop')}
                            className="flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-xl hover:bg-white/30"
                        >
                            <IoArrowBack className="w-5 h-5" />
                            Quay lại cửa hàng
                        </button>
                        
                        <div className="text-sm text-white/90 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/')}>
                                🏠 Trang chủ
                            </span>
                            <IoChevronForward className="w-3 h-3" />
                            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/shop')}>
                                {product.danhMuc?.tenDanhMuc || '📂 Sản phẩm'}
                            </span>
                            <IoChevronForward className="w-3 h-3" />
                            <span className="text-white font-semibold max-w-xs truncate">
                                {product.tenSanPham}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left: Images */}
                            <div className="space-y-4">
                                <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 shadow-xl group">
                                    {(() => {
                                        const images = product.hinhAnh || [];
                                        const src = resolveImageUrl(images[selectedImage] || images[0]);
                                        return src ? (
                                            <img 
                                                src={src} 
                                                alt={product.tenSanPham} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                                                📷 Không có hình ảnh
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Thumbnails */}
                                <div className="grid grid-cols-5 gap-3">
                                    {(product.hinhAnh || []).map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square rounded-xl overflow-hidden border-3 transition-all hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 ${
                                                selectedImage === index 
                                                    ? 'border-blue-600 ring-4 ring-blue-200 shadow-xl scale-105' 
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            {(() => {
                                                const src = resolveImageUrl(image);
                                                return src ? (
                                                    <img src={src} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">📷</span>
                                                    </div>
                                                );
                                            })()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Product Info */}
                            <div className="space-y-6">
                                {/* Title & Rating */}
                                <div className="border-b border-gray-200 pb-6">
                                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 leading-tight">
                                        {product.tenSanPham}
                                    </h1>
                                    <p className="text-gray-500 text-sm mb-4 font-mono">
                                        ⚡ Mã SP: <span className="font-bold text-gray-700">#{product.maSanPham}</span>
                                    </p>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-lg border border-yellow-200">
                                            <div className="flex">{renderStars(product.danhGia || 4.5)}</div>
                                            <span className="text-lg font-bold text-gray-800">
                                                {(product.danhGia || 4.5).toFixed(1)}
                                            </span>
                                        </div>
                                        <span 
                                            className="text-base text-blue-600 font-semibold cursor-pointer hover:underline"
                                            onClick={() => setActiveTab('reviews')}
                                        >
                                            📝 {product.soLuotDanhGia || reviews.length} đánh giá
                                        </span>
                                    </div>
                                </div>

                                {/* Price Section */}
                                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-2xl border-2 border-red-200 shadow-lg">
                                    <div className="flex items-center gap-4 mb-3">
                                        <span className="text-5xl font-extrabold text-red-600">
                                            {formatCurrency(activePrice)}
                                        </span>
                                        {activeOriginalPrice > activePrice && (
                                            <>
                                                <span className="text-2xl text-gray-500 line-through">
                                                    {formatCurrency(activeOriginalPrice)}
                                                </span>
                                                <span className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-md">
                                                    🔥 -{discountPercent}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {activeStock > 0 ? (
                                            <span className="text-green-600 font-semibold flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg">
                                                <IoCheckmarkCircle className="w-5 h-5" /> 
                                                Còn {activeStock} sản phẩm
                                            </span>
                                        ) : (
                                            <span className="text-red-600 font-semibold flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg">
                                                <IoWarning className="w-5 h-5" /> 
                                                Hết hàng
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Variants Selection */}
                                {product.bienThe && product.bienThe.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-lg font-bold text-gray-800">Chọn phiên bản:</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {product.bienThe.map((variant) => (
                                                <button
                                                    key={variant.maBienThe}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                                                        selectedVariant?.maBienThe === variant.maBienThe
                                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                                            : 'border-gray-200 hover:border-blue-400'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-gray-800">
                                                        {variant.thuocTinh?.map(attr => attr.giaTri).join(' - ') || variant.sku}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {formatCurrency(variant.giaSauGiam || variant.giaBan)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Còn: {variant.soLuong}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity */}
                                <div className="space-y-3">
                                    <label className="text-lg font-bold text-gray-800">Số lượng:</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="px-5 py-3 text-xl text-gray-600 hover:bg-gray-100 transition-colors font-bold"
                                            >
                                                −
                                            </button>
                                            <span className="px-6 py-3 min-w-[60px] text-center font-bold text-xl border-l border-r">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(Math.min(activeStock, quantity + 1))}
                                                disabled={quantity >= activeStock}
                                                className={`px-5 py-3 text-xl font-bold transition-colors ${
                                                    quantity >= activeStock 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                +
                                            </button>
                                        </div>
                                        {selectedVariant && isInCart(selectedVariant.maBienThe) && (
                                            <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg">
                                                🛒 Đã có {getItemQuantity(selectedVariant.maBienThe)} trong giỏ
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={activeStock === 0 || !selectedVariant}
                                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-1 shadow-xl ${
                                            activeStock === 0 || !selectedVariant
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:shadow-2xl'
                                        }`}
                                    >
                                        <IoCart className="w-6 h-6" />
                                        {!selectedVariant ? 'CHỌN PHIÊN BẢN' : 'THÊM VÀO GIỎ'}
                                    </button>
                                    
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                                            isFavorite
                                                ? 'border-red-600 bg-red-600 text-white'
                                                : 'border-gray-300 text-gray-700 hover:border-red-600'
                                        }`}
                                    >
                                        {isFavorite ? <IoHeart className="w-6 h-6" /> : <IoHeartOutline className="w-6 h-6" />}
                                    </button>

                                    <button className="p-4 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all">
                                        <IoShareSocial className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-3 gap-4 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <IoFlashOutline className="w-8 h-8 text-blue-600" />
                                        <span className="text-sm font-semibold text-gray-700">Giao hàng nhanh</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <IoGiftOutline className="w-8 h-8 text-purple-600" />
                                        <span className="text-sm font-semibold text-gray-700">Quà tặng miễn phí</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <IoShieldCheckmark className="w-8 h-8 text-green-600" />
                                        <span className="text-sm font-semibold text-gray-700">Bảo hành 12 tháng</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Section */}
                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <div className="flex space-x-8 border-b mb-6">
                                {['description', 'specifications', 'reviews'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-3 px-2 border-b-4 font-bold text-lg transition-all ${
                                            activeTab === tab
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab === 'description' && '📝 Mô tả'}
                                        {tab === 'specifications' && '⚙️ Thông số'}
                                        {tab === 'reviews' && `⭐ Đánh giá (${reviews.length})`}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-gray-50 rounded-xl min-h-[300px]">
                                {activeTab === 'description' && (
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 text-lg leading-relaxed">
                                            {product.moTa || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'specifications' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            <div className="flex py-3 border-b border-gray-200">
                                                <span className="w-1/2 text-gray-600 font-medium">Thương hiệu:</span>
                                                <span className="w-1/2 font-semibold">{product.thuongHieu || 'Đang cập nhật'}</span>
                                            </div>
                                            <div className="flex py-3 border-b border-gray-200">
                                                <span className="w-1/2 text-gray-600 font-medium">Danh mục:</span>
                                                <span className="w-1/2 font-semibold">{product.danhMuc?.tenDanhMuc || 'N/A'}</span>
                                            </div>
                                            <div className="flex py-3 border-b border-gray-200">
                                                <span className="w-1/2 text-gray-600 font-medium">Xuất xứ:</span>
                                                <span className="w-1/2 font-semibold">{product.xuatXu || 'Đang cập nhật'}</span>
                                            </div>
                                            <div className="flex py-3 border-b border-gray-200">
                                                <span className="w-1/2 text-gray-600 font-medium">Bảo hành:</span>
                                                <span className="w-1/2 font-semibold">12 tháng</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <button
                                                onClick={() => setShowReviewModal(true)}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                                            >
                                                ✍️ Viết đánh giá
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {reviews.length === 0 ? (
                                                <div className="text-center text-gray-500 py-8">
                                                    Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
                                                </div>
                                            ) : (
                                                reviews.map((review, index) => (
                                                    <div key={index} className="border-b border-gray-200 pb-4">
                                                        <div className="flex items-center gap-4 mb-2">
                                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 font-bold text-xl">
                                                                    {(review.khachHang?.tenKhachHang || 'K')[0]}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900">
                                                                    {review.khachHang?.tenKhachHang || 'Khách hàng'}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex">{renderStars(review.diem || 5, 'w-4 h-4')}</div>
                                                                    <span className="text-sm text-gray-500">
                                                                        {new Date(review.ngayTao).toLocaleDateString('vi-VN')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {review.tieuDe && (
                                                            <h5 className="font-semibold text-gray-800 ml-16 mb-1">
                                                                {review.tieuDe}
                                                            </h5>
                                                        )}
                                                        <p className="text-gray-700 ml-16">{review.noiDung}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Related Products */}
                        {relatedProducts.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-200">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                    🔥 Sản phẩm liên quan
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {relatedProducts.map((relatedProduct) => (
                                        <div
                                            key={relatedProduct.maSanPham}
                                            onClick={() => navigate(`/shop/products/${relatedProduct.maSanPham}`)}
                                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                                        >
                                            <div className="aspect-square overflow-hidden bg-gray-100">
                                                {(() => {
                                                    const img = relatedProduct.images?.[0] || relatedProduct.hinhAnh?.[0];
                                                    const src = img ? (typeof img === 'string' && img.startsWith('/') ? api.buildUrl(img) : img) : null;
                                                    return src ? (
                                                        <img src={src} alt={relatedProduct.tenSanPham} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2">
                                                    {relatedProduct.tenSanPham}
                                                </h3>
                                                <p className="text-red-600 font-bold">
                                                    {formatCurrency(relatedProduct.lowestVariantPrice || relatedProduct.gia || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowReviewModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ✍️ Viết đánh giá của bạn
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Đánh giá:</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className="transition-transform hover:scale-125"
                                        >
                                            {star <= newReview.rating ? (
                                                <IoStar className="w-8 h-8 text-yellow-400" />
                                            ) : (
                                                <IoStarOutline className="w-8 h-8 text-gray-300" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Tiêu đề:</label>
                                <input
                                    type="text"
                                    value={newReview.title}
                                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập tiêu đề đánh giá"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Nội dung:</label>
                                <textarea
                                    value={newReview.content}
                                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Chia sẻ trải nghiệm của bạn..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                Gửi đánh giá
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerProductDetail;
