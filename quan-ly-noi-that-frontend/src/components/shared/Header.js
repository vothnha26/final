import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { IoMenuOutline, IoCloseOutline, IoCartOutline, IoSearchOutline, IoHeartOutline as IoHeart, IoPersonOutline } from 'react-icons/io5'; // Import thêm icons
import { useNavigate } from 'react-router-dom';
import { navigation } from '../../data';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import NavMobile from './NavMobile';
import NotificationPopup from './NotificationPopup';

// Simple currency formatter used in several components
const formatPrice = (price) => {
	const n = Number(price) || 0;
	return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // GIẢ LẬP: Lấy số lượng giỏ hàng thực tế
		// Use cart context for live cart count
		const { getTotalItems } = useCart();
		const getCartCount = () => {
			try { return getTotalItems(); } catch (e) { return 0; }
		};

			// Auth state
			const { isAuthenticated, user, logout } = useAuth();
			const isLoggedIn = !!isAuthenticated;
	const [favoritesCount, setFavoritesCount] = useState(() => {
		try { 
			const key = user ? `favorites:user:${user.maKhachHang || user.ma_khach_hang || user.id || user.maTaiKhoan || user.tenDangNhap}` : 'favorites:anon';
			const raw = localStorage.getItem(key) || localStorage.getItem('favorites') || '[]';
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed.length : 0; 
		} catch (e) { return 0; }
	});

	// Search dropdown state
	const [searchQuery, setSearchQuery] = useState('');
	const [suggestions, setSuggestions] = useState([]);
	// const [isSearching, setIsSearching] = useState(false);
	const [showSearchDropdown, setShowSearchDropdown] = useState(false);
	const searchRef = useRef(null);
	const debounceRef = useRef(null);

	useEffect(() => {
		const onDocClick = (ev) => {
			if (!searchRef.current) return;
			if (!searchRef.current.contains(ev.target)) {
				setShowSearchDropdown(false);
			}
		};
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	}, []);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!searchQuery || String(searchQuery).trim().length < 2) {
			setSuggestions([]);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			try {
				const q = String(searchQuery).trim();
				// Prefer shop endpoint which supports tim_kiem
				let resp = null;
				try {
					resp = await api.get(`/api/products/shop?tim_kiem=${encodeURIComponent(q)}&size=6`);
				} catch (e) {
					// fallback to legacy products endpoint
					resp = await api.get(`/api/products?tim_kiem=${encodeURIComponent(q)}&size=6`);
				}
				const payload = resp?.data ?? resp;
				let items = Array.isArray(payload) ? payload : (Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.content) ? payload.content : []));
				const mapped = (items || []).slice(0,6).map(p => ({
					id: p.maSanPham ?? p.id ?? p.productId ?? p.ma_san_pham,
					name: p.tenSanPham ?? p.name ?? p.ten ?? p.ten_san_pham ?? '',
					image: (Array.isArray(p.hinhAnhs) && p.hinhAnhs.length>0) ? (p.hinhAnhs[0].duongDanHinhAnh ?? p.hinhAnhs[0]) : (p.hinhAnh ?? p.image ?? p.thumbnail ?? null),
					price: Number(p.gia ?? p.giaBan ?? p.price ?? p.minPrice ?? p.min_price ?? p.priceMin ?? p.priceAfterDiscount ?? 0) || 0
				}));
				setSuggestions(mapped);
				setShowSearchDropdown(true);

				// Ensure each suggestion has an image: fetch detail for items missing images
				const missing = mapped.filter(m => !m.image && m.id);
				if (missing.length > 0) {
					Promise.all(missing.map(it => api.get(`/api/products/${it.id}/detail`).then(r => r?.data ?? r).catch(() => null)))
						.then(results => {
							const withImages = mapped.map(item => {
								if (item.image) return item;
								const found = results.find(res => res && (String(res.maSanPham) === String(item.id) || String(res.id) === String(item.id) || String(res.productId) === String(item.id)));
								const img = found ? (Array.isArray(found.hinhAnhs) && found.hinhAnhs.length>0 ? (found.hinhAnhs[0].duongDanHinhAnh ?? found.hinhAnhs[0]) : (found.hinhAnh ?? found.image ?? null)) : null;
								return { ...item, image: img };
							});
							setSuggestions(withImages);
						})
						.catch(() => {});
				}
			} catch (err) {
				setSuggestions([]);
				setShowSearchDropdown(false);
			}
		}, 300);
		return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
	}, [searchQuery]);

	useEffect(() => {
		const onFav = (e) => {
			try {
				if (e && e.detail && typeof e.detail.count === 'number') {
					setFavoritesCount(e.detail.count);
					return;
				}
				// compute per-user key and fallback to legacy
				try {
					const key = user ? `favorites:user:${user.maKhachHang || user.ma_khach_hang || user.id || user.maTaiKhoan || user.tenDangNhap}` : 'favorites:anon';
					const raw = localStorage.getItem(key) || localStorage.getItem('favorites') || '[]';
					const parsed = JSON.parse(raw);
					setFavoritesCount(Array.isArray(parsed) ? parsed.length : 0);
				} catch (inner) {
					setFavoritesCount(0);
				}
			} catch (err) { /* ignore */ }
		};
		const storageHandler = (ev) => {
			// react to either per-user key changes or legacy global favorites
			const key = user ? `favorites:user:${user.maKhachHang || user.ma_khach_hang || user.id || user.maTaiKhoan || user.tenDangNhap}` : 'favorites:anon';
			if (!ev.key) {
				// some browsers may provide null key for clear; re-evaluate
				onFav({});
				return;
			}
			if (ev.key === key || ev.key === 'favorites') onFav(ev);
		};
		window.addEventListener('favorites:changed', onFav);
		window.addEventListener('storage', storageHandler);
		return () => {
			window.removeEventListener('favorites:changed', onFav);
			window.removeEventListener('storage', storageHandler);
		};
	}, []);

			return (
				<header className='bg-white shadow-md fixed top-0 left-0 right-0 z-50 w-full h-20'>
					<div className='max-w-7xl mx-auto px-4'>
						<div className='flex items-center h-20'> {/* fixed height container */}
          
          {/* Logo */}
					<div className='flex items-center h-20'>
						<button onClick={() => navigate('/')} className='text-3xl font-extrabold text-red-600 hover:text-red-700 transition-colors h-20 flex items-center'>
							FURNI<span className='font-normal'>SHOP</span>
						</button>
					</div>

		  {/* Desktop Main Navigation (Menu) */}
					<nav className='hidden lg:flex items-center space-x-6 ml-6'> {/* Chỉ hiện thị trên màn hình lớn */}
						{navigation.map((item, index) => (
							<button
								key={index}
								onClick={() => {
								try {
									const name = String(item?.name || '').toLowerCase();
									if (name === 'features' || name === 'feature') {
										navigate('/shop');
										return;
									}
									if (name === 'collections' || String(item?.href || '').toLowerCase() === 'collections') {
										navigate('/shop/collections');
										return;
									}
									const href = String(item?.href || '');
									if (href.startsWith('#')) navigate(href.slice(1));
									else navigate(href);
								} catch (e) {
									navigate('/');
								}
								}}
								className='text-gray-700 text-sm font-medium uppercase hover:text-red-600 transition-colors duration-300 h-20 flex items-center'
							>
								{item.name}
							</button>
						))}
					</nav>

					{/* Center search on large screens */}
								<div className='flex-1 flex justify-center'>
									<div ref={searchRef} className='relative hidden lg:block w-96 h-20 flex items-center'>
								<input 
									type="text"
									value={searchQuery}
									onChange={(e) => { setSearchQuery(e.target.value); }}
									onFocus={() => { if (suggestions.length>0) setShowSearchDropdown(true); }}
									placeholder="Tìm kiếm sản phẩm..."
												className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-full w-full focus:border-red-500 focus:ring-1 focus:ring-red-500"
								/>
								<IoSearchOutline size={18} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'/>
								{/* Dropdown */}
								{showSearchDropdown && suggestions && suggestions.length > 0 && (
									<div className='absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded shadow-lg z-50 max-h-72 overflow-auto'>
										{suggestions.map(s => (
											<button key={s.id || s.name} onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); navigate(`/shop/products/${s.id}`); }} className='w-full text-left px-3 py-3 hover:bg-gray-50 flex items-center justify-between gap-3'>
												<div className='flex-1 pr-3'>
													<div className='text-sm text-gray-700 truncate'>{s.name}</div>
													<div className='text-xs text-gray-500 mt-1'>{formatPrice(s.price)}</div>
												</div>
												<div className='w-14 h-14 flex-shrink-0'>
													{s.image ? <img src={api.buildUrl(s.image)} alt={s.name} className='w-14 h-14 object-cover rounded'/> : <div className='w-14 h-14 bg-gray-100 rounded'/>}
												</div>
											</button>
										))}
									</div>
								)}
							</div>
					</div>

					{/* Right Icons (Account, Favorites, Cart) */}
								<div className='hidden md:flex items-center space-x-6'>
									<div className='flex space-x-4 items-center'>
										{/* Account */}
										<div className='flex items-center space-x-2'>
											<button 
												onClick={() => navigate(isLoggedIn ? '/profile' : '/login')}
												className='text-gray-700 hover:text-red-600 transition-colors relative group h-20 flex items-center px-3'
											>
												<IoPersonOutline size={22} />
												<span className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>{isLoggedIn ? 'Tài khoản' : 'Đăng nhập'}</span>
											</button>
											{/* Show Login/Register when not logged in */}
											{!isLoggedIn && (
												<>
													<button onClick={() => navigate('/login')} className='text-sm text-gray-700 hover:text-red-600 px-2'>Đăng nhập</button>
													<button onClick={() => navigate('/register')} className='text-sm text-gray-700 hover:text-red-600 px-2'>Đăng ký</button>
												</>
											)}
											{/* Show Logout when logged in */}
											{isLoggedIn && (
												<button onClick={() => { try { logout && logout(); } catch (e) {} navigate('/'); }} className='text-sm text-gray-700 hover:text-red-600 px-2'>Đăng xuất</button>
											)}
										</div>
              
										{/* Favorites */}
										<button 
											onClick={() => navigate(user ? '/favorites' : '/login')}
											className='text-gray-700 hover:text-red-600 transition-colors h-20 flex items-center px-3 relative'
										>
											<IoHeart size={22} />
											{favoritesCount > 0 && (
												<span className='absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold border-2 border-white'>
													{favoritesCount}
												</span>
											)}
										</button>

										{/* Notifications */}
										{isLoggedIn && (
											<div className='h-20 flex items-center'>
												<NotificationPopup />
											</div>
										)}
              
										{/* Cart Icon */}
										<button
											onClick={() => navigate('/cart')}
											className='relative text-gray-700 hover:text-red-600 transition-colors h-20 flex items-center px-3'
										>
											<IoCartOutline size={22} />
											{getCartCount() > 0 && (
												<span className='absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold border-2 border-white'>
													{getCartCount()}
												</span>
											)}
										</button>
									</div>
								</div>

          {/* Mobile menu button (Hamburger/Close) */}
		  <div className='md:hidden flex items-center gap-4'>
            {/* Cart Icon for mobile (giữ nguyên) */}
						<button
							onClick={() => navigate('/cart')}
							className='relative text-gray-700 hover:text-red-600 transition-colors duration-300 h-20 flex items-center px-3'
						>
							<IoCartOutline size={22} />
							{getCartCount() > 0 && (
								<span className='absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold border-2 border-white'>
									{getCartCount()}
								</span>
							)}
						</button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className='text-gray-700 hover:text-red-600 transition-colors duration-300'
            >
              {isOpen ? <IoCloseOutline size={24} /> : <IoMenuOutline size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <NavMobile isOpen={isOpen} setIsOpen={setIsOpen} />
    </header>
  );
};

export default Header;