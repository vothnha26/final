import React, { useState, useEffect } from 'react';
import {
  IoLocationOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoGiftOutline,
  IoCheckmarkCircleOutline,
  IoArrowBackOutline,
  IoShieldCheckmarkOutline,
  IoCarOutline,
  IoTimeOutline,
  IoStarOutline,
  IoCashOutline,
  IoWalletOutline,
  IoTrashOutline,
  IoAddOutline,
  IoCloseCircleOutline
} from 'react-icons/io5';
import { FaCreditCard, FaUniversity } from 'react-icons/fa';
import Toast from '../shared/Toast';
import ConfirmDialog from '../shared/ConfirmDialog';
import api from '../../api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const CustomerCheckout = ({ onBack, onOrderComplete }) => {
  const { items: cartItems, updateQuantity: ctxUpdateQuantity, removeItem: ctxRemoveItem, clearCart } = useCart();
  const [step, setStep] = useState(1); // 1: Cart Review, 2: Shipping Info, 3: Payment, 4: Confirmation

  // Customer info from localStorage or auth context
  const [customerInfo, setCustomerInfo] = useState({ ma_khach_hang: null, name: '', phone: '', email: '' });
  const [cartDetails, setCartDetails] = useState([]); // Cart items from server

  // Prefer AuthContext.user, fallback to localStorage and/or server-by-phone
  const auth = useAuth();

  useEffect(() => {
    const loadCustomerInfo = async () => {
      try {
        // 1) Prefer the auth context user when available
        if (auth && auth.user) {
          const u = auth.user;
          const customerData = {
            ma_khach_hang: u?.ma_khach_hang ?? u?.id ?? null,
            name: u?.hoTen || u?.name || u?.tenDangNhap || '',
            phone: u?.soDienThoai || u?.phone || '',
            email: u?.email || ''
          };
          setCustomerInfo(customerData);
          // Persist ma_khach_hang back into localStorage.user if missing
          try {
            const raw = localStorage.getItem('user');
            const parsed = raw ? JSON.parse(raw) : {};
            if (!parsed.ma_khach_hang && customerData.ma_khach_hang) {
              parsed.ma_khach_hang = customerData.ma_khach_hang;
              localStorage.setItem('user', JSON.stringify(parsed));
            }
          } catch (e) { /* ignore */ }
          return;
        }

        // 2) Then try localStorage.user as before
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const customerData = {
              ma_khach_hang: user?.ma_khach_hang ?? user?.id ?? null,
              name: user.hoTen || user.name || '',
              phone: user.soDienThoai || user.phone || '',
              email: user.email || ''
            };
            setCustomerInfo(customerData);
            return;
          } catch (e) {
            // ignore parse errors and continue
          }
        }

        // 3) If we have no local info, fall back to server profile (safe) or leave null
        try {
          const resp = await api.get('/api/v1/auth/me');
          const prof = resp?.data ?? resp;
          if (prof) {
            const customerData = {
              ma_khach_hang: prof.ma_khach_hang ?? prof.id ?? null,
              name: prof.hoTen || prof.name || '',
              phone: prof.soDienThoai || prof.phone || '',
              email: prof.email || ''
            };
            setCustomerInfo(customerData);
            try {
              localStorage.setItem('user', JSON.stringify(prof));
            } catch (e) { /* ignore */ }
            return;
          }
        } catch (e) {
          // ignore - we may be unauthenticated
        }

      } catch (err) {

      }
    };
    loadCustomerInfo();
  }, [auth]);

  // Fetch cart details from server
  useEffect(() => {
    const fetchCartDetails = async () => {
      if (cartItems.length === 0) {
        setCartDetails([]);
        return;
      }

      try {
        const payload = {
          chiTietDonHang: cartItems.map(item => ({
            maBienThe: item.variantId ?? item.id,
            soLuong: item.quantity
          }))
        };

        const data = await api.post('/api/thanhtoan/cart-details', payload);

        if (Array.isArray(data)) {
          setCartDetails(data);
        }
      } catch (err) {
        setCartDetails([]);
      }
    };

    fetchCartDetails();
  }, [cartItems]);

  // Fetch available vouchers for user
  useEffect(() => {
    const fetchAvailableVouchers = async () => {
      try {
        let ma_khach_hang = customerInfo.maKhachHang || customerInfo.ma_khach_hang;

        // If we don't have a ma_khach_hang persisted yet, try to fetch profile from server
        if (!ma_khach_hang) {
          try {
            const profileResp = await api.get('/api/v1/khach-hang/me');
            const prof = profileResp?.data ?? profileResp;
            if (prof) {
              // Backend returns camelCase (maKhachHang), normalize to snake_case for internal use
              ma_khach_hang = prof.maKhachHang ?? prof.ma_khach_hang ?? prof.id ?? null;
              try {
                const raw = localStorage.getItem('user');
                const parsed = raw ? JSON.parse(raw) : {};
                parsed.ma_khach_hang = parsed.ma_khach_hang ?? ma_khach_hang;
                parsed.maKhachHang = parsed.maKhachHang ?? ma_khach_hang;
                localStorage.setItem('user', JSON.stringify(parsed));
              } catch (e) { /* ignore */ }
              setCustomerInfo(prev => ({ ...prev, ma_khach_hang, name: prof.hoTen || prof.name || prev.name }));
            }
          } catch (e) {
            console.warn('⚠️ [Vouchers] Could not fetch /api/v1/khach-hang/me to populate ma_khach_hang:', e);
          }

        // If still no ma_khach_hang, try lookup by phone (if we have a phone in any source)
        if (!ma_khach_hang) {
          try {
            const possiblePhone = customerInfo.phone || (auth && auth.user && (auth.user.soDienThoai || auth.user.phone)) || (() => {
              try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u?.soDienThoai || u?.phone || null; } catch (er) { return null; }
            })();
            if (possiblePhone) {
              const byPhone = await api.get(`/api/v1/khach-hang/by-phone/${encodeURIComponent(possiblePhone)}`);
              const byPhoneData = byPhone?.data ?? byPhone;
              if (byPhoneData) {
                // Backend returns camelCase (maKhachHang), normalize to snake_case
                ma_khach_hang = byPhoneData.maKhachHang ?? byPhoneData.ma_khach_hang ?? byPhoneData.id ?? null;
                setCustomerInfo(prev => ({ ...prev, ma_khach_hang, name: byPhoneData.hoTen || byPhoneData.name || prev.name, phone: possiblePhone }));
                try { const raw = localStorage.getItem('user'); const parsed = raw ? JSON.parse(raw) : {}; parsed.ma_khach_hang = parsed.ma_khach_hang ?? ma_khach_hang; parsed.maKhachHang = parsed.maKhachHang ?? ma_khach_hang; localStorage.setItem('user', JSON.stringify(parsed)); } catch (e) { }
              }
            }
          } catch (ex) {
            console.warn('⚠️ [Vouchers] by-phone lookup failed:', ex);
          }
        }
        }

        // Only fetch vouchers when we have a ma_khach_hang and at least one cart item
        if (!ma_khach_hang || cartItems.length === 0) {
          return;
        }

        // Prefer server-provided cartDetails subtotal if available (more accurate)
        const subtotal = (cartDetails && cartDetails.length > 0)
          ? cartDetails.reduce((s, it) => s + Number(it.thanhTien || it.thanhTien || 0), 0)
          : cartItems.reduce((sum, item) => sum + (Number(item.price || item.giaHienThi || 0) * Number(item.quantity || 0)), 0);

        // Backend uses camelCase: maKhachHang (not ma_khach_hang)
        const url = `/api/thanhtoan/applicable-vouchers?maKhachHang=${ma_khach_hang}&tongTienDonHang=${subtotal}`;

        const data = await api.get(url);

        // Normalize different response shapes: direct array OR { data: [...] } OR { success:true, data: [...] }
        let vouchers = [];
        if (!data) vouchers = [];
        else if (Array.isArray(data)) vouchers = data;
        else if (Array.isArray(data.data)) vouchers = data.data;
        else if (Array.isArray(data.vouchers)) vouchers = data.vouchers;
        else if (data.success && Array.isArray(data.data)) vouchers = data.data;

        setAvailableVouchers(vouchers);
      } catch (err) {

      }
    };

    fetchAvailableVouchers();
  }, [customerInfo.maKhachHang, customerInfo.ma_khach_hang, customerInfo.phone, cartItems, cartDetails, auth]);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    note: ''
  });
  const [serverPreview, setServerPreview] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [systemConfigs, setSystemConfigs] = useState({}); // Lưu cấu hình hệ thống
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankCode: ''
  });
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [appliedLoyaltyPoints, setAppliedLoyaltyPoints] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [lastOrderResponse, setLastOrderResponse] = useState(null);

  // Load saved shipping info (if available)
  useEffect(() => {
    const savedShippingInfo = localStorage.getItem('customerShippingInfo');
    if (savedShippingInfo) {
      setShippingInfo(JSON.parse(savedShippingInfo));
    } else if (customerInfo.name) {
      // Pre-fill with customer info if available
      setShippingInfo(prev => ({
        ...prev,
        fullName: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email
      }));
    }
  }, [customerInfo]);

  // Fetch shipping methods from backend
  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const data = await api.get('/api/dichvu?type=shipping');
        if (Array.isArray(data) && data.length > 0) {
          setShippingOptions(data);
          // default to first option's id
          setShippingMethod(String(data[0].maDichVu));
        }
      } catch (err) {

      }
    };

    fetchShipping();
  }, []);

  // Detect and load customer's available loyalty points (from auth, localStorage, or API fallback)
  useEffect(() => {
    const pickPoints = (obj) => {
      if (!obj) return null;
      const cand = obj.diemThuong ?? obj.diemTichLuy ?? obj.loyaltyPoints ?? obj.diem ?? obj.diemHienCo ?? obj.soDiem;
      return cand != null ? Number(cand) : null;
    };

    let points = null;
    // 1) Try from auth context (merged account + customer fields)
    if (auth && auth.user) {
      points = pickPoints(auth.user);
    }
    // 2) Try from localStorage user cache
    if (points == null) {
      try {
        const raw = localStorage.getItem('user');
        const u = raw ? JSON.parse(raw) : null;
        points = pickPoints(u);
      } catch (e) { /* ignore */ }
    }

    if (points != null) setAvailablePoints(Math.max(0, Number(points)));

    // 3) Fallback: call customer profile endpoint once
    if (points == null) {
      (async () => {
        try {
          const resp = await api.get('/api/v1/khach-hang/me');
          const data = resp?.data ?? resp;
          const p = pickPoints(data);
          if (p != null) setAvailablePoints(Math.max(0, Number(p)));
        } catch (e) { /* ignore */ }
      })();
    }
  }, [auth]);

  // Fetch system configurations for shipping fees
  useEffect(() => {
    const fetchSystemConfigs = async () => {
      try {
        const data = await api.get('/api/v1/cau-hinh-he-thong');
        if (Array.isArray(data)) {
          // Chuyển array thành object với key là configKey
          const configMap = {};
          data.forEach(config => {
            configMap[config.configKey] = config.configValue;
          });
          setSystemConfigs(configMap);
        }
      } catch (err) {
        console.warn('⚠️ Không thể tải cấu hình hệ thống:', err);
      }
    };

    fetchSystemConfigs();
  }, []);

  const showToast = (message, type = 'success') => {
    // Use Toast API exported from shared/Toast
    if (type === 'success') {
      Toast.showSuccess?.(message) || Toast.show?.(message);
    } else if (type === 'error') {
      Toast.showError?.(message) || Toast.show?.(message);
    } else if (type === 'warning') {
      Toast.showWarning?.(message) || Toast.show?.(message);
    } else {
      Toast.showInfo?.(message) || Toast.show?.(message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    ctxUpdateQuantity(itemId, newQuantity);
  };

  const removeItem = (itemId) => {
    ctxRemoveItem(itemId);
    showToast('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const calculateSubtotal = () => {
    return (cartItems || []).reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  };

  const getShippingFee = () => {
    // Prefer server-side preview if available
    if (serverPreview && typeof serverPreview.chiPhiDichVu === 'number') {
      return serverPreview.chiPhiDichVu;
    }

    // If shipping options (from backend) are available and user selected one, use its chiPhi
    if (shippingOptions && shippingOptions.length > 0) {
      const selected = shippingOptions.find(opt => String(opt.maDichVu) === String(shippingMethod));
      if (selected && selected.chiPhi != null) {
        return Number(selected.chiPhi);
      }
    }

    const subtotal = calculateSubtotal();
    if (subtotal >= 10000000) return 0; // Free shipping over 10M

    switch (shippingMethod) {
      case 'express': return 150000;
      case 'same-day': return 300000;
      default: return 50000; // standard
    }
  };

  const getVoucherDiscount = () => {
    // Prefer server values when possible; otherwise compute client-side

    if (!selectedVoucher) return 0;

    const subtotal = calculateSubtotal();
    if (subtotal < selectedVoucher.minOrder) return 0;

    if (selectedVoucher.type === 'fixed') {
      return selectedVoucher.discount;
    } else {
      const percentDiscount = subtotal * (selectedVoucher.discount / 100);
      return Math.min(percentDiscount, selectedVoucher.maxDiscount);
    }
  };

  const calculateTotal = () => {
    // Prefer server preview when available
    if (serverPreview && typeof serverPreview.thanhTien === 'number') {
      return serverPreview.thanhTien;
    }

    const subtotal = calculateSubtotal();
    const shippingFee = getShippingFee();
    const voucherDiscount = getVoucherDiscount();
    const loyaltyDiscount = appliedLoyaltyPoints;

    return Math.max(0, subtotal + shippingFee - voucherDiscount - loyaltyDiscount);
  };

  // Compute points earned for this order.
  // Prefer server-provided value `serverPreview.diemThuongNhanDuoc` when available.
  const getPointsEarned = () => {
    const serverVal = serverPreview && (serverPreview.DiemThuongNhanDuoc ?? serverPreview.diemThuongNhanDuoc);
    if (serverVal != null && !isNaN(Number(serverVal))) {
      return Math.max(0, Number(serverVal));
    }
    return 0;
  };

  // Lấy giá trị quy đổi điểm thưởng từ backend (nếu có)
  const getRewardMoneyPerPoint = () => {
    if (serverPreview && (serverPreview.rewardMoneyPerPoint || serverPreview.rewardMoneyPerPoint === 0)) {
      return Number(serverPreview.rewardMoneyPerPoint);
    }
    return 1000;
  };
  const getRewardPointPerMoney = () => {
    if (serverPreview && (serverPreview.rewardPointPerMoney || serverPreview.rewardPointPerMoney === 0)) {
      return Number(serverPreview.rewardPointPerMoney);
    }
    return 1;
  };

  // Fetch detailed server preview whenever relevant inputs change
  useEffect(() => {
    let cancelled = false;
    const parseMoney = (val) => {
      if (val == null) return 0;
      if (typeof val === 'number') return val;
      // Remove all non-digit and non-dot and non-minus characters
      try {
        const s = String(val).trim();
        // If it contains dots as thousand separators like 13.830.000, remove dots
        // Also remove commas and currency symbols
        const digits = s.replace(/[\D]/g, '');
        return digits ? Number(digits) : 0;
      } catch (e) {
        return 0;
      }
    };
    
    // Helper function to get configKeyShip based on shipping method
    const getConfigKeyShip = () => {
      // Nếu là giao hàng nhanh/same-day => SHIPPING_FEE_EXPRESS
      if (shippingMethod === 'express' || shippingMethod === 'same-day') {
        return 'SHIPPING_FEE_EXPRESS';
      }
      // Mặc định là giao hàng tiêu chuẩn => SHIPPING_FEE_STANDARD
      return 'SHIPPING_FEE_STANDARD';
    };
    
    const fetchPreview = async () => {
      // allow preview even when customer is not logged in; preview only requires cart items
      if (cartItems.length === 0) {
        setServerPreview(null);
        return;
      }

      const payload = {
        chiTietDonHang: cartItems.map(item => ({ maBienThe: item.variantId ?? item.id, soLuong: item.quantity })),
        maKhachHang: customerInfo.maKhachHang || customerInfo.ma_khach_hang, // Support both formats
        diemSuDung: appliedLoyaltyPoints || 0,
        maVoucherCode: selectedVoucher?.code || null,
        configKeyShip: getConfigKeyShip() // Thêm config key cho phí ship
      };

      try {
        // Call server checkout-summary to get authoritative preview
        const data = await api.post('/api/thanhtoan/checkout-summary', payload);

        if (!cancelled && data) {
          // Map backend response to local state
          const preview = {
            // Accept either PascalCase or camelCase from backend
            tamTinh: Number(data.TamTinh ?? data.tamTinh ?? 0),
            giamGiaVip: Number(data.GiamGiaVip ?? data.giamGiaVip ?? 0),
            giamGiaVoucher: Number(data.GiamGiaVoucher ?? data.giamGiaVoucher ?? 0),
            giamGiaDiem: Number(data.GiamGiaDiem ?? data.giamGiaDiem ?? 0),
            // Preserve server-provided points field (PascalCase or camelCase)
            DiemThuongNhanDuoc: data.DiemThuongNhanDuoc ?? data.diemThuongNhanDuoc ?? 0,
            // Keep the original string for display, but also provide a numeric version
            phiGiaoHang: data.PhiGiaoHang ?? data.phiGiaoHang ?? 'Miễn phí',
            chiPhiDichVu: parseMoney(data.PhiGiaoHang ?? data.phiGiaoHang ?? 0),
            // Server total (useful for using authoritative total in UI)
            tongCong: Number(data.TongCong ?? data.tongCong ?? 0),
            thanhTien: Number(data.TongCong ?? data.tongCong ?? 0),
            // Prefer server-provided total discount; fall back to sum of parts
            tongGiamGia: Number(data.TongGiamGia ?? data.tongGiamGia ?? ((Number(data.GiamGiaVip ?? data.giamGiaVip ?? 0) + Number(data.GiamGiaVoucher ?? data.giamGiaVoucher ?? 0) + Number(data.GiamGiaDiem ?? data.giamGiaDiem ?? 0)) || 0))
            // Add reward points config values from backend
            ,rewardMoneyPerPoint: data.rewardMoneyPerPoint ?? data.reward_money_per_point ?? null,
            rewardPointPerMoney: data.rewardPointPerMoney ?? data.reward_point_per_money ?? null,
          };
          setServerPreview(preview);
        }
      } catch (err) {
        if (!cancelled) setServerPreview(null);
      }
    };

    const t = setTimeout(fetchPreview, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [customerInfo.maKhachHang, customerInfo.ma_khach_hang, cartItems, selectedVoucher, appliedLoyaltyPoints, shippingMethod]);

  const applyVoucher = async (voucher) => {
    try {
      const subtotal = calculateSubtotal();
      const customerId = customerInfo.maKhachHang || customerInfo.ma_khach_hang;
      if (!customerId) {
        showToast('Vui lòng đăng nhập để áp dụng voucher', 'warning');
        return;
      }

      const res = await api.post('/api/thanhtoan/apply-voucher', {
        maKhachHang: customerInfo.maKhachHang || customerInfo.ma_khach_hang, // Support both formats
        maVoucherCode: voucher.maCode || voucher.code,
        orderAmountForCheck: subtotal
      });

      if (res && res.success) {
        setSelectedVoucher({
          code: voucher.maCode || voucher.code,
          discount: res.giamGiaVoucher || 0,
          type: 'fixed'
        });
        showToast('Áp dụng voucher thành công!');
      } else {
        showToast(res?.message || 'Không thể áp dụng voucher', 'error');
      }
    } catch (err) {
      console.warn('apply-voucher failed', err);
      showToast('Lỗi khi áp dụng voucher', 'error');
    }
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
    showToast('Đã hủy voucher');
  };

  const validateShippingInfo = () => {
    const required = ['fullName', 'phone', 'email', 'address', 'ward', 'district', 'city'];
    const missing = required.filter(field => !shippingInfo[field].trim());

    if (missing.length > 0) {
      showToast('Vui lòng điền đầy đủ thông tin giao hàng', 'error');
      return false;
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(shippingInfo.phone)) {
      showToast('Số điện thoại không hợp lệ', 'error');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      showToast('Email không hợp lệ', 'error');
      return false;
    }

    return true;
  };

  const validatePayment = () => {
    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.cardName ||
        !paymentDetails.expiryDate || !paymentDetails.cvv) {
        showToast('Vui lòng điền đầy đủ thông tin thẻ', 'error');
        return false;
      }
    } else if (paymentMethod === 'bank') {
      if (!paymentDetails.bankCode) {
        showToast('Vui lòng chọn ngân hàng', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && cartItems.length === 0) {
      showToast('Giỏ hàng trống', 'error');
      return;
    }

    if (step === 2 && !validateShippingInfo()) {
      return;
    }

    if (step === 3 && !validatePayment()) {
      return;
    }

    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  // Xử lý thanh toán VNPay/SEPay cho Ví điện tử
  const handleVNPayPayment = async () => {
    setIsProcessing(true);
    try {
      const getConfigKeyShip = () => {
        if (shippingMethod === 'express' || shippingMethod === 'same-day') {
          return 'SHIPPING_FEE_EXPRESS';
        }
        return 'SHIPPING_FEE_STANDARD';
      };
      const payload = {
        maKhachHang: customerInfo.maKhachHang || customerInfo.ma_khach_hang,
        phuongThucThanhToan: paymentMethod,
        chiTietDonHangList: cartItems.map(i => ({ maBienThe: i.variantId ?? i.id, soLuong: i.quantity })),
        tenNguoiNhan: shippingInfo.fullName,
        soDienThoaiNhan: shippingInfo.phone,
        diaChiGiaoHang: `${shippingInfo.address}${shippingInfo.ward ? ', ' + shippingInfo.ward : ''}${shippingInfo.district ? ', ' + shippingInfo.district : ''}${shippingInfo.city ? ', ' + shippingInfo.city : ''}`,
        ghiChu: shippingInfo.note || '',
        phuongThucGiaoHang: (() => {
          if (shippingOptions && shippingOptions.length > 0) {
            const sel = shippingOptions.find(opt => String(opt.maDichVu) === String(shippingMethod) || String(opt.maDichVu) === String(Number(shippingMethod)));
            if (sel) return sel.tenDichVu || sel.tenDichVu;
          }
          if (shippingMethod === 'express' || shippingMethod === 'same-day') return 'Giao hàng nhanh';
          if (shippingMethod === 'standard') return 'Giao hàng tiêu chuẩn';
          return String(shippingMethod || 'Giao hàng tiêu chuẩn');
        })(),
        maVoucherCode: selectedVoucher?.code || selectedVoucher?.maCode || null,
        diemThuongSuDung: appliedLoyaltyPoints || 0,
        configKeyShip: getConfigKeyShip()
      };
      // Gọi API backend để lấy URL thanh toán VNPay/SEPay
      const resp = await api.post('/api/thanhtoan/vnpay-url', payload);
      if (resp && resp.url) {
        // Lưu shipping info trước khi chuyển hướng
        localStorage.setItem('customerShippingInfo', JSON.stringify(shippingInfo));
        // Chuyển hướng sang trang thanh toán VNPay/SEPay
        window.location.href = resp.url;
      } else {
        showToast(resp?.message || 'Không lấy được URL thanh toán ví điện tử', 'error');
      }
    } catch (err) {
      let serverMsg = null;
      if (err) {
        if (err?.data && typeof err.data === 'object') {
          serverMsg = err.data.message || err.data.detail || err.data.error || JSON.stringify(err.data);
        } else if (typeof err === 'object') {
          serverMsg = err.message || String(err);
        } else {
          serverMsg = String(err);
        }
      }
      const msg = serverMsg || 'Có lỗi xảy ra khi tạo đơn hàng ví điện tử, vui lòng thử lại';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Đặt hàng bình thường (COD, card, bank)
  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const getConfigKeyShip = () => {
        if (shippingMethod === 'express' || shippingMethod === 'same-day') {
          return 'SHIPPING_FEE_EXPRESS';
        }
        return 'SHIPPING_FEE_STANDARD';
      };
      const payload = {
        maKhachHang: customerInfo.maKhachHang || customerInfo.ma_khach_hang,
        phuongThucThanhToan: paymentMethod,
        chiTietDonHangList: cartItems.map(i => ({ maBienThe: i.variantId ?? i.id, soLuong: i.quantity })),
        tenNguoiNhan: shippingInfo.fullName,
        soDienThoaiNhan: shippingInfo.phone,
        diaChiGiaoHang: `${shippingInfo.address}${shippingInfo.ward ? ', ' + shippingInfo.ward : ''}${shippingInfo.district ? ', ' + shippingInfo.district : ''}${shippingInfo.city ? ', ' + shippingInfo.city : ''}`,
        ghiChu: shippingInfo.note || '',
        phuongThucGiaoHang: (() => {
          if (shippingOptions && shippingOptions.length > 0) {
            const sel = shippingOptions.find(opt => (String(opt.maDichVu) === String(shippingMethod) || String(opt.maDichVu) === String(Number(shippingMethod))));
            if (sel) return sel.tenDichVu || sel.tenDichVu;
          }
          if (shippingMethod === 'express' || shippingMethod === 'same-day') return 'Giao hàng nhanh';
          if (shippingMethod === 'standard') return 'Giao hàng tiêu chuẩn';
          return String(shippingMethod || 'Giao hàng tiêu chuẩn');
        })(),
        maVoucherCode: selectedVoucher?.code || selectedVoucher?.maCode || null,
        diemThuongSuDung: appliedLoyaltyPoints || 0,
        configKeyShip: getConfigKeyShip()
      };
      let resp = null;
      const endpointsToTry = ['/api/thanhtoan/tao-don-hang', '/api/thanhtoan/tao-don-hang'];
      let lastErr = null;
      for (const ep of endpointsToTry) {
        try {
          resp = await api.post(ep, payload);
          lastErr = null;
          break;
        } catch (e) {
          console.warn(`⚠️ [PlaceOrder] Attempt failed for ${ep}:`, e?.status, e?.data || e?.message || e);
          lastErr = e;
        }
      }
      if (!resp && lastErr) throw lastErr;
      const orderSummary = {
        tamTinh: Number(resp?.TamTinh ?? resp?.tamTinh ?? 0),
        giamGiaVip: Number(resp?.GiamGiaVip ?? resp?.giamGiaVip ?? 0),
        giamGiaVoucher: Number(resp?.GiamGiaVoucher ?? resp?.giamGiaVoucher ?? 0),
        giamGiaDiem: Number(resp?.GiamGiaDiem ?? resp?.giamGiaDiem ?? 0),
        phiGiaoHang: resp?.PhiGiaoHang ?? resp?.phiGiaoHang ?? 'Miễn phí',
        tongCong: Number(resp?.TongCong ?? resp?.tongCong ?? 0),
        diemThuongNhanDuoc: Number(resp?.DiemThuongNhanDuoc ?? resp?.diemThuongNhanDuoc ?? 0),
        maDonHang: resp?.maDonHang ?? resp?.MaDonHang ?? null,
        maDonHangStr: resp?.maDonHangStr ?? resp?.MaDonHangStr ?? null
      };
      setLastOrderResponse(orderSummary);
      localStorage.setItem('customerShippingInfo', JSON.stringify(shippingInfo));
      const returnedOrderCode = orderSummary.maDonHangStr ?? orderSummary.maDonHang ?? ('DH' + Date.now().toString().slice(-6));
      setOrderCode(returnedOrderCode);
      setOrderSuccess(true);
      setStep(4);
      showToast('Đặt hàng thành công!');
      if (onOrderComplete) {
        setTimeout(() => onOrderComplete(), 1000);
      }
      try { clearCart(); } catch (e) { /* ignore */ }
    } catch (err) {
      let serverMsg = null;
      if (err) {
        if (err?.data && typeof err.data === 'object') {
          serverMsg = err.data.message || err.data.detail || err.data.error || JSON.stringify(err.data);
        } else if (typeof err === 'object') {
          serverMsg = err.message || String(err);
        } else {
          serverMsg = String(err);
        }
      }
      const msg = serverMsg || 'Có lỗi xảy ra khi tạo đơn hàng, vui lòng thử lại';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Xem lại giỏ hàng';
      case 2: return 'Thông tin giao hàng';
      case 3: return 'Phương thức thanh toán';
      case 4: return 'Hoàn thành đặt hàng';
      default: return '';
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <IoCheckmarkCircleOutline className="text-4xl text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
            <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua sắm tại cửa hàng chúng tôi</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                <span className="font-bold text-lg text-blue-600">{orderCode || lastOrderResponse?.maDonHang}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Tạm tính:</span>
                <span className="text-gray-900">{formatCurrency(lastOrderResponse?.tamTinh ?? 0)}</span>
              </div>
              
              {/* Hiển thị các giảm giá nếu có */}
              {lastOrderResponse?.giamGiaVip > 0 && (
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-purple-600">Giảm giá VIP:</span>
                  <span className="text-purple-600">-{formatCurrency(lastOrderResponse.giamGiaVip)}</span>
                </div>
              )}
              {lastOrderResponse?.giamGiaVoucher > 0 && (
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-green-600">Giảm voucher:</span>
                  <span className="text-green-600">-{formatCurrency(lastOrderResponse.giamGiaVoucher)}</span>
                </div>
              )}
              {lastOrderResponse?.giamGiaDiem > 0 && (
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-orange-600">Giảm điểm:</span>
                  <span className="text-orange-600">-{formatCurrency(lastOrderResponse.giamGiaDiem)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-gray-600">Phí giao hàng:</span>
                <span className="text-gray-900">{lastOrderResponse?.phiGiaoHang ?? 'Miễn phí'}</span>
              </div>
              
              <hr className="my-3" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Tổng cộng:</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(lastOrderResponse?.tongCong ?? 0)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phương thức thanh toán:</span>
                <span className="text-sm">
                  {paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                    paymentMethod === 'card' ? 'Thẻ tín dụng' :
                      paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví điện tử'}
                </span>
              </div>
            </div>

            {/* Points earned display */}
            <div className="bg-white rounded-lg p-4 border border-gray-100 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Điểm thưởng nhận được</span>
                <div className="text-right">
                  <div className="font-medium text-green-700">{lastOrderResponse?.diemThuongNhanDuoc ?? 0} điểm</div>
                  <div className="text-xs text-gray-500">~ {formatCurrency((lastOrderResponse?.diemThuongNhanDuoc ?? 0) * 1000)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const id = lastOrderResponse?.maDonHang ?? lastOrderResponse?.MaDonHang ?? null;
                  if (id) {
                    window.location.href = `/orders/${id}`;
                  } else {
                    window.location.href = '/orders';
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Theo dõi đơn hàng
              </button>
              <button
                onClick={() => window.location.href = '/shop'}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
              {customerInfo.name && (
                <p className="text-sm text-gray-600 mt-1">
                  <IoPersonOutline className="inline mr-1" />
                  Khách hàng: <span className="font-medium">{customerInfo.name}</span>
                  {customerInfo.phone && <span className="ml-3">📞 {customerInfo.phone}</span>}
                </p>
              )}
            </div>
            <button
              onClick={onBack || (() => window.history.back())}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <IoArrowBackOutline />
              Quay lại
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= stepNum
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-500'
                  }`}>
                  {step > stepNum ? <IoCheckmarkCircleOutline /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-medium text-gray-900">{getStepTitle()}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Step 1: Cart Review */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sản phẩm trong giỏ hàng</h3>

                <div className="space-y-4">
                  {cartDetails.length > 0 ? (
                    cartDetails.map((item) => {
                      const cartItem = cartItems.find(ci => ci.id === item.maBienThe);
                      return (
                        <div key={item.maBienThe} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                          <img
                            src={item.hinhAnhDaiDien || cartItem?.image || '/placeholder.png'}
                            alt={item.tenSanPham}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => { e.target.src = '/placeholder.png'; }}
                          />

                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.tenSanPham}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <div>
                                <div className="font-bold text-blue-600">{formatCurrency(item.giaHienThi)}</div>
                                {item.giaGoc > item.giaHienThi && (
                                  <div className="text-sm text-gray-500 line-through">{formatCurrency(item.giaGoc)}</div>
                                )}
                              </div>
                              {item.giaGoc > item.giaHienThi && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  -{Math.round((1 - item.giaHienThi / item.giaGoc) * 100)}%
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.maBienThe, item.soLuong - 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="w-12 text-center">{item.soLuong}</span>
                            <button
                              onClick={() => updateQuantity(item.maBienThe, item.soLuong + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="font-medium text-gray-800">{formatCurrency(item.thanhTien)}</div>
                            {item.giaGoc > item.giaHienThi && (
                              <div className="text-xs text-green-600">
                                Tiết kiệm {formatCurrency((item.giaGoc - item.giaHienThi) * item.soLuong)}
                              </div>
                            )}
                            <button
                              onClick={() => removeItem(item.maBienThe)}
                              className="text-red-600 hover:text-red-800 p-2 mt-1"
                              title="Xóa sản phẩm"
                            >
                              <IoTrashOutline />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : cartItems.length > 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Đang tải thông tin sản phẩm...</p>
                    </div>
                  ) : null}
                </div>

                {cartItems.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">🛒</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Giỏ hàng trống</h3>
                    <p className="text-gray-600 mb-4">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
                    <button
                      onClick={() => window.location.href = '/shop'}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Tiếp tục mua sắm
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Shipping Information */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin giao hàng</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IoPersonOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IoCallOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IoMailOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập địa chỉ email"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IoLocationOutline className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập địa chỉ chi tiết"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.ward}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, ward: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập phường/xã"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.district}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, district: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập quận/huyện"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tỉnh/thành phố"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      value={shippingInfo.note}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, note: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)"
                      rows="2"
                    />
                  </div>
                </div>

                {/* Shipping Methods */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Phương thức giao hàng</h4>
                  <div className="space-y-3">
                    {shippingOptions && shippingOptions.length > 0 ? (
                      shippingOptions.map(opt => (
                        <label key={opt.maDichVu} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={String(opt.maDichVu)}
                            checked={String(shippingMethod) === String(opt.maDichVu)}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{opt.tenDichVu}</div>
                            {opt.moTa && <div className="text-sm text-gray-600">{opt.moTa}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(Number(opt.chiPhi || 0))}</div>
                          </div>
                        </label>
                      ))
                    ) : (
                      // fallback static options
                      <>
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value="standard"
                            checked={shippingMethod === 'standard'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <IoCarOutline className="text-blue-600 mr-3" />
                          <div className="flex-1">
                            <div className="font-medium">Giao hàng tiêu chuẩn</div>
                            <div className="text-sm text-gray-600">3-5 ngày làm việc</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(50000)}</div>
                            <div className="text-xs text-gray-600">Miễn phí &gt; 10 triệu</div>
                          </div>
                        </label>

                        <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value="express"
                            checked={shippingMethod === 'express'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <IoTimeOutline className="text-orange-600 mr-3" />
                          <div className="flex-1">
                            <div className="font-medium">Giao hàng nhanh</div>
                            <div className="text-sm text-gray-600">1-2 ngày làm việc</div>
                          </div>
                          <div className="font-medium">{formatCurrency(150000)}</div>
                        </label>

                        <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value="same-day"
                            checked={shippingMethod === 'same-day'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <IoStarOutline className="text-purple-600 mr-3" />
                          <div className="flex-1">
                            <div className="font-medium">Giao trong ngày</div>
                            <div className="text-sm text-gray-600">Trong vòng 6 giờ</div>
                          </div>
                          <div className="font-medium">{formatCurrency(300000)}</div>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Phương thức thanh toán</h3>

                <div className="space-y-4">
                  {/* Cash on Delivery */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <IoCashOutline className="text-green-600 text-2xl mr-4" />
                    <div>
                      <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</div>
                    </div>
                  </label>

                  {/* Credit Card */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <FaCreditCard className="text-blue-600 text-2xl mr-4" />
                    <div>
                      <div className="font-medium">Thẻ tín dụng/ghi nợ</div>
                      <div className="text-sm text-gray-600">Visa, Mastercard, JCB</div>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <FaUniversity className="text-purple-600 text-2xl mr-4" />
                    <div>
                      <div className="font-medium">Chuyển khoản ngân hàng</div>
                      <div className="text-sm text-gray-600">Internet Banking, ATM</div>
                    </div>
                  </label>

                  {/* E-Wallet */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <IoWalletOutline className="text-orange-600 text-2xl mr-4" />
                    <div>
                      <div className="font-medium">Ví điện tử</div>
                      <div className="text-sm text-gray-600">MoMo, ZaloPay, VNPay</div>
                    </div>
                  </label>
                </div>

                {/* Payment Details */}
                {paymentMethod === 'card' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Thông tin thẻ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số thẻ</label>
                        <input
                          type="text"
                          value={paymentDetails.cardNumber}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ thẻ</label>
                        <input
                          type="text"
                          value={paymentDetails.cardName}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="NGUYEN VAN A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                        <input
                          type="text"
                          value={paymentDetails.expiryDate}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123"
                          maxLength="4"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Chọn ngân hàng</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Vietcombank', 'Techcombank', 'BIDV', 'VietinBank', 'ACB', 'Sacombank'].map((bank) => (
                        <label key={bank} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="bankCode"
                            value={bank}
                            checked={paymentDetails.bankCode === bank}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, bankCode: e.target.value })}
                            className="mr-2"
                          />
                          <span className="text-sm">{bank}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tóm tắt đơn hàng</h3>

              {/* Voucher Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Mã giảm giá</span>
                  <IoGiftOutline className="text-orange-500" />
                </div>

                {selectedVoucher ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium text-green-800">{selectedVoucher.code}</div>
                      <div className="text-sm text-green-600">
                        Giảm {formatCurrency(selectedVoucher.discount)}
                      </div>
                    </div>
                    <button
                      onClick={removeVoucher}
                      className="text-green-600 hover:text-green-800"
                    >
                      <IoCloseCircleOutline />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableVouchers.length > 0 ? (
                      availableVouchers.map((voucher) => (
                        <button
                          key={voucher.maVoucher}
                          onClick={() => applyVoucher(voucher)}
                          className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{voucher.maCode}</div>
                              <div className="text-sm text-gray-600">{voucher.tenVoucher}</div>
                            </div>
                            <IoAddOutline className="text-blue-600" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Không có voucher khả dụng
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loyalty Points Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Điểm thưởng
                    {availablePoints != null && (
                      <span className="ml-2 text-gray-500 font-normal">({availablePoints} điểm)</span>
                    )}
                  </span>
                  <IoStarOutline className="text-yellow-500" />
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 mb-2">
                    Nhập số điểm muốn sử dụng (1 điểm = 1,000đ)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={availablePoints != null ? availablePoints : undefined}
                      value={appliedLoyaltyPoints}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value);
                        const points = isNaN(raw) ? 0 : Math.max(0, raw);
                        const capped = (availablePoints != null) ? Math.min(points, availablePoints) : points;
                        setAppliedLoyaltyPoints(capped);
                      }}
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Nhập số điểm"
                    />
                  </div>
                  {appliedLoyaltyPoints > 0 && (
                    <div className="text-xs text-yellow-700 mt-1">
                      Giảm {formatCurrency(appliedLoyaltyPoints * 1000)}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{formatCurrency(serverPreview?.tamTinh || calculateSubtotal())}</span>
                </div>

                {/* VIP discount row */}
                {serverPreview?.giamGiaVip > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Giảm giá hạng thành viên (VIP)</span>
                    <span>-{formatCurrency(serverPreview.giamGiaVip)}</span>
                  </div>
                )}
                {serverPreview?.giamGiaVoucher > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Giảm voucher:</span>
                    <span>-{formatCurrency(serverPreview.giamGiaVoucher)}</span>
                  </div>
                )}
                {serverPreview?.giamGiaDiem > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Giảm điểm:</span>
                    <span>-{formatCurrency(serverPreview.giamGiaDiem)}</span>
                  </div>
                )}
                {/* Server-provided total discount (prefer this) */}
                {((serverPreview && typeof serverPreview.tongGiamGia === 'number') || serverPreview?.tongGiamGia) && (
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Tổng giảm:</span>
                    <span>-{formatCurrency(serverPreview.tongGiamGia)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Điểm thưởng nhận được</span>
                  <span>
                    {getPointsEarned()} điểm
                    {getPointsEarned() > 0 && (
                      <>
                        {' '}~ {formatCurrency(getPointsEarned() * getRewardMoneyPerPoint() / getRewardPointPerMoney())}
                        <span className="text-xs text-gray-500 ml-1">(1 điểm = {formatCurrency(getRewardMoneyPerPoint() / getRewardPointPerMoney())})</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Phí giao hàng</span>
                  <span>
                    {serverPreview?.chiPhiDichVu === 0 
                      ? 'Miễn phí' 
                      : (serverPreview?.phiGiaoHang || 'Miễn phí')
                    }
                  </span>
                </div>

                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">
                    {formatCurrency(serverPreview?.tongCong || calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-4">
                <IoShieldCheckmarkOutline className="text-green-600" />
                <div className="text-sm text-green-800">
                  Thanh toán an toàn và bảo mật
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {step < 3 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={cartItems.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {step === 1 ? 'Tiếp tục' : step === 2 ? 'Chọn thanh toán' : 'Đặt hàng'}
                  </button>
                ) : (
                  paymentMethod === 'wallet' ? (
                    <button
                      onClick={handleVNPayPayment}
                      disabled={isProcessing || cartItems.length === 0}
                      className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang chuyển hướng ví điện tử...
                        </>
                      ) : (
                        <>
                          <IoWalletOutline />
                          Thanh toán qua Ví điện tử
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={isProcessing || cartItems.length === 0}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <IoCheckmarkCircleOutline />
                          Xác nhận đặt hàng
                        </>
                      )}
                    </button>
                  )
                )}

                {step > 1 && (
                  <button
                    onClick={handlePreviousStep}
                    className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Quay lại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handlePlaceOrder}
          title="Xác nhận đặt hàng"
          message={`Bạn có chắc chắn muốn đặt hàng với tổng tiền ${formatCurrency(calculateTotal())}?`}
          confirmText="Đặt hàng"
          confirmColor="green"
        />

        {/* Toast handled via Toast API (Toast.showSuccess / Toast.showError) */}
      </div>
    </div>
  );
};

export default CustomerCheckout;
