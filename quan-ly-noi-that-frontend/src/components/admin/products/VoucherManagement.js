import React, { useState, useEffect, useRef } from 'react';
import { IoGift, IoAdd, IoCreate, IoTrash, IoEye, IoTime, IoCheckmarkCircle, IoRefresh, IoCopy, IoPause, IoPlay } from 'react-icons/io5';
import api from '../../../api';

const VoucherManagement = () => {
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [editingOriginalApplicable, setEditingOriginalApplicable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newVoucher, setNewVoucher] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    startDate: '',
    endDate: '',
    description: '',
    applicableTo: 'everyone', // 'everyone' or 'tiers'
    selectedTiers: [],
    isActive: true // Mặc định voucher được kích hoạt
  });

  const [vouchers, setVouchers] = useState([]);
  const [membershipTiers, setMembershipTiers] = useState([]);

  const [usageHistory, setUsageHistory] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningVoucher, setAssigningVoucher] = useState(null);
  // Lightweight toast notifications
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message: string }
  const toastTimerRef = useRef(null);

  // Filter states
  const [filterType, setFilterType] = useState(''); // 'percentage', 'fixed', or ''
  const [filterTimeRange, setFilterTimeRange] = useState(''); // 'upcoming', 'active', 'expired', or ''
  const [filterUsage, setFilterUsage] = useState(''); // '25', '50', '70', or ''

  const showToast = (type, message) => {
    try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch { }
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  // Use backend status tokens as keys here so UI directly reflects server-side enum-like values.
  // Expected tokens: "CHUA_BAT_DAU", "DANG_HOAT_DONG", "DA_HET_HAN", "KHONG_HOAT_DONG"
  const statusConfig = {
    DANG_HOAT_DONG: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Hoạt động' },
    DA_HET_HAN: { color: 'text-red-600', bg: 'bg-red-100', icon: IoTime, label: 'Hết hạn' },
    KHONG_HOAT_DONG: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Không hoạt động' },
    CHUA_BAT_DAU: { color: 'text-gray-600', bg: 'bg-gray-100', icon: IoTime, label: 'Chưa bắt đầu' }
  };

  const typeConfig = {
    percentage: { label: 'Phần trăm', color: 'text-blue-600' },
    fixed: { label: 'Số tiền cố định', color: 'text-green-600' }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.CHUA_BAT_DAU;
  };

  const getTypeInfo = (type) => {
    return typeConfig[type] || typeConfig.percentage;
  };

  // Map voucher from API to UI
  const mapVoucherFromApi = (voucher) => {
    const fmtDate = (v) => {
      if (v === null || v === undefined || v === '') return '';
      // If it's already a string like '2023-10-16T00:00:00' or '2023-10-16'
      if (typeof v === 'string') {
        if (v.includes('T')) return v.split('T')[0];
        // try parseable string
        const p = new Date(v);
        if (!isNaN(p.getTime())) return p.toISOString().split('T')[0];
        return v;
      }
      // If it's a number or Date-like
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      return '';
    };

    return ({
      id: voucher.maVoucher || voucher.id,
      code: voucher.maCode || voucher.code,
      name: voucher.tenVoucher || voucher.name,
      type: voucher.loaiGiamGia === 'PERCENTAGE' ? 'percentage' : 'fixed',
      value: voucher.giaTriGiam || voucher.value || 0,
      minOrderValue: voucher.giaTriDonHangToiThieu || voucher.minOrderValue || 0,
      maxDiscount: voucher.giaTriGiamToiDa || voucher.maxDiscount || 0,
      usageLimit: voucher.soLuongToiDa || voucher.usageLimit || 0,
      usedCount: voucher.soLuongDaSuDung || voucher.usedCount || 0,
      // quantity is used by the edit form (labelled "Số lượng")
      quantity: voucher.soLuongToiDa || voucher.quantity || voucher.usageLimit || 0,
      // Expect backend to return an effective status token in `trangThai` (string).
      // Fall back to stored admin override or a default token when missing.
      status: voucher.trangThai || voucher.trangThaiAdmin || 'DANG_HOAT_DONG',
      startDate: fmtDate(voucher.ngayBatDau) || voucher.startDate || '',
      endDate: fmtDate(voucher.ngayKetThuc) || voucher.endDate || '',
      // Products: keep as array of names when provided, otherwise show default text
      applicableProducts: Array.isArray(voucher.sanPhamApDung)
        ? voucher.sanPhamApDung.map(p => (p?.tenSanPham || p?.name || String(p?.maSanPham || p?.id || p)))
        : (typeof voucher.sanPhamApDung === 'string' ? voucher.sanPhamApDung : 'Tất cả sản phẩm'),
      // Customers: either a list or default text
      applicableCustomers: Array.isArray(voucher.khachHangApDung)
        ? voucher.khachHangApDung.map(c => (c?.tenKhachHang || c?.name || String(c?.maKhachHang || c?.id || c)))
        : (voucher.khachHangApDung ? String(voucher.khachHangApDung) : 'Tất cả khách hàng'),
      // Tiers applied (names) — backend may return tenHangThanhVienApDung or hanCheHangThanhVien
      appliedTierNames: Array.isArray(voucher.tenHangThanhVienApDung)
        ? voucher.tenHangThanhVienApDung.map(t => (t?.tenHang || t?.name || String(t?.maHangThanhVien || t?.id || t))).join(', ')
        : (Array.isArray(voucher.hanCheHangThanhVien)
          ? voucher.hanCheHangThanhVien.map(t => (t?.tenHang || t?.name || String(t?.maHangThanhVien || t?.id || t))).join(', ')
          : ''),
      apDungChoMoiNguoi: voucher.apDungChoMoiNguoi === undefined ? true : Boolean(voucher.apDungChoMoiNguoi),
      description: voucher.moTa || voucher.description || '',
      createdBy: voucher.nguoiTao || 'Admin',
      createdAt: voucher.ngayTao || voucher.createdAt || '',
      // Map trạng thái thành checkbox isActive (true nếu KHÔNG phải KHONG_HOAT_DONG)
      isActive: voucher.trangThai !== 'KHONG_HOAT_DONG'
    });
  };

  // Map voucher from UI to API
  const mapVoucherToApi = (voucher) => ({
    maCode: voucher.code,
    tenVoucher: voucher.name,
    moTa: voucher.description,
    loaiGiamGia: voucher.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
    // Only include numeric fields when they parse to valid numbers
    giaTriGiam: (() => {
      const v = parseFloat(voucher.value);
      return Number.isNaN(v) ? undefined : v;
    })(),
    giaTriDonHangToiThieu: (() => {
      const v = parseFloat(voucher.minOrderValue);
      return Number.isNaN(v) ? undefined : v;
    })(),
    giaTriGiamToiDa: (() => {
      if (voucher.type !== 'percentage') return undefined;
      const v = parseFloat(voucher.maxDiscount);
      return Number.isNaN(v) ? undefined : v;
    })(),
    // Only include dates when provided to avoid sending invalid empty strings
    ...(voucher.startDate ? { ngayBatDau: String(voucher.startDate).includes('T') ? voucher.startDate : `${voucher.startDate}T00:00:00` } : {}),
    ...(voucher.endDate ? { ngayKetThuc: String(voucher.endDate).includes('T') ? voucher.endDate : `${voucher.endDate}T23:59:59` } : {}),
    // support both create UI (usageLimit) and edit UI (quantity)
    soLuongToiDa: (() => {
      const v = parseInt(voucher.quantity ?? voucher.usageLimit ?? 0);
      return Number.isNaN(v) ? undefined : v;
    })(),
    apDungChoMoiNguoi: voucher.applicableTo === 'everyone',
    // If applying to specific tiers, include the selected tier IDs so backend update can create links
    maHangThanhVienIds: voucher.applicableTo === 'tiers' && Array.isArray(voucher.selectedTiers)
      ? voucher.selectedTiers.map(s => Number(s))
      : undefined
    ,
    // Gửi trạng thái dựa trên checkbox isActive:
    // - Nếu isActive = false => KHONG_HOAT_DONG (tạm dừng)
    // - Nếu isActive = true => để trigger tự động quyết định dựa trên ngày
    //   (CHUA_BAT_DAU / DANG_HOAT_DONG / DA_HET_HAN)
    trangThai: voucher.isActive === false ? 'KHONG_HOAT_DONG' : 'DANG_HOAT_DONG'
  });

  // API Functions
  const fetchVouchers = async () => {
    try {
      // Use the detailed endpoint so we receive apDungChoMoiNguoi and tenHangThanhVienApDung
      const response = await api.get('/api/v1/voucher/details');

      // Normal case: array of VoucherResponse
      if (Array.isArray(response)) {
        setVouchers(response.map(mapVoucherFromApi));
        return;
      }

      // Sometimes backend returns a paginated object (content) or wrapped data
      if (response && Array.isArray(response.content)) {
        setVouchers(response.content.map(mapVoucherFromApi));
        return;
      }

      if (response && Array.isArray(response.data)) {
        setVouchers(response.data.map(mapVoucherFromApi));
        return;
      }

      // As a last resort try the simpler entity endpoint
      try {
        const fallback = await api.get('/api/v1/voucher');
        if (Array.isArray(fallback)) {
          setVouchers(fallback.map(mapVoucherFromApi));
          return;
        }
      } catch (fallbackErr) {

      }
    } catch (err) {
      setError('Không thể tải danh sách voucher (xem console để biết chi tiết)');
    }
  };

  // Note: initial data for usageHistory and membershipTiers is fetched inline in useEffect.

  const fetchVoucherDetail = async (id) => {
    try {
      // Call the detailed endpoint to get tenHangThanhVienApDung, maHangThanhVienIds and apDungChoMoiNguoi
      const response = await api.get(`/api/v1/voucher/${id}/details`);
      // Build editing object including applicability and selected tiers
      const base = mapVoucherFromApi(response);
      const applicableTo = response.apDungChoMoiNguoi ? 'everyone' : 'tiers';
      // Use maHangThanhVienIds from backend (list of IDs from voucher_hang_thanh_vien table)
      const selectedTiers = Array.isArray(response.maHangThanhVienIds)
        ? response.maHangThanhVienIds.map(id => String(id))
        : [];
      return { ...base, applicableTo, selectedTiers };
    } catch (err) {
      throw err;
    }
  };

  // Simple voucher code generator
  const generateVoucherCode = (prefix = 'VCHR') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix}-${code}`;
  };

  const createVoucher = async (voucherData) => {
    try {
      const response = await api.post('/api/v1/voucher', { body: voucherData });
      const newVoucher = mapVoucherFromApi(response);
      setVouchers(prev => [...prev, newVoucher]);
      return newVoucher;
    } catch (err) {
      throw new Error(err.response?.message || err.message || 'Không thể tạo voucher');
    }
  };

  const updateVoucher = async (voucherId, voucherData) => {
    try {
      const response = await api.patch(`/api/v1/voucher/${voucherId}`, { body: voucherData });
      const updatedVoucher = mapVoucherFromApi(response);
      setVouchers(prev => prev.map(voucher =>
        voucher.id === voucherId ? updatedVoucher : voucher
      ));
      return updatedVoucher;
    } catch (err) {
      throw new Error('Không thể cập nhật voucher');
    }
  };

  // Toggle voucher active state: pause (KHONG_HOAT_DONG) or resume (DANG_HOAT_DONG)
  const toggleVoucherStatus = async (voucher, newStatus) => {
    try {
      await updateVoucher(voucher.id, { trangThai: newStatus });
    } catch (err) {
      throw new Error('Không thể cập nhật trạng thái voucher');
    }
  };

  // Fetch vouchers and related data once on mount. Inline the calls to avoid
  // hook dependency warnings for locally defined helper functions.
  // We intentionally call `fetchVouchers()` here and do not want the
  // exhaustive-deps rule to force it into the dependency list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Fetch membership tiers from backend
  const fetchMembershipTiers = async () => {
    try {
      const tResp = await api.get('/api/hang-thanh-vien/all');
      const mapTiers = arr => Array.isArray(arr) ? arr.map(t => ({ id: t.maHangThanhVien ?? t.id, name: t.tenHang ?? t.name })) : [];
      if (Array.isArray(tResp)) {
        setMembershipTiers(mapTiers(tResp));
      } else if (tResp && Array.isArray(tResp.data)) {
        setMembershipTiers(mapTiers(tResp.data));
      } else if (tResp && Array.isArray(tResp.content)) {
        setMembershipTiers(mapTiers(tResp.content));
      }
    } catch (err) {
      setError('Không thể tải danh sách hạng thành viên');
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        await fetchVouchers();
        if (!mounted) return;
        const hResp = await api.get('/api/v1/voucher/usage-history');
        if (Array.isArray(hResp)) setUsageHistory(hResp);
        await fetchMembershipTiers();
      } catch (err) {
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch { }
    };
  }, []);

  const handleViewVoucher = (voucher) => {
    // load full voucher details (including dates and applied tiers) before opening modal
    (async () => {
      try {
        const detailed = await fetchVoucherDetail(voucher.id);
        setSelectedVoucher(detailed);
        setShowVoucherModal(true);
      } catch (err) {
        setError('Không tải được chi tiết voucher');
      }
    })();
  };

  const handleAddVoucher = () => {
    setNewVoucher(prev => ({ 
      ...prev, 
      code: generateVoucherCode(), 
      applicableTo: 'everyone', 
      selectedTiers: [],
      isActive: true // Mặc định kích hoạt
    }));
    setShowAddModal(true);
  };

  const handleSaveVoucher = async () => {
    try {
      // Validate: if applicableTo is 'tiers', must select at least one tier
      if (newVoucher.applicableTo === 'tiers' && (!Array.isArray(newVoucher.selectedTiers) || newVoucher.selectedTiers.length === 0)) {
        setError('Vui lòng chọn ít nhất một hạng thành viên');
        return;
      }

      const payload = mapVoucherToApi(newVoucher);
      await createVoucher(payload);
      setShowAddModal(false);
      showToast('success', `Đã tạo voucher "${newVoucher.name}"`);
      setNewVoucher({
        name: '',
        code: '',
        type: 'percentage',
        value: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        usageLimit: 0,
        startDate: '',
        endDate: '',
        description: '',
        applicableTo: 'everyone',
        selectedTiers: [],
        isActive: true // Reset về mặc định kích hoạt
      });
    } catch (err) {
      setError(err.message);
      showToast('error', err.message || 'Tạo voucher thất bại');
    }
  };

  const handleEditVoucher = (voucher) => {
    // load full voucher details (including applied tiers) before opening modal
    (async () => {
      try {
        const detailed = await fetchVoucherDetail(voucher.id);
        setEditingVoucher(detailed);
        setEditingOriginalApplicable(detailed.applicableTo);
        setShowEditModal(true);
      } catch (err) {
        setError('Không tải được chi tiết voucher');
      }
    })();
  };

  const handleSaveEdit = async () => {
    try {
      // Prevent changing applicability from the edit form. Applicability (apDungChoMoiNguoi)
      // and assigned tiers must be managed via the separate "Gán hạng" flow.
      // Use the original applicability and selected tiers when building the payload so
      // that we don't unintentionally remove or change tier assignments here.
      const payloadObj = { ...editingVoucher };
      // force applicability fields to original values
      payloadObj.applicableTo = editingOriginalApplicable ?? editingVoucher.applicableTo;
      payloadObj.selectedTiers = editingOriginalApplicable === 'tiers' ? (editingVoucher.selectedTiers || []) : [];
      const payload = mapVoucherToApi(payloadObj);
      await updateVoucher(editingVoucher.id, payload);
      setShowEditModal(false);
      setEditingVoucher(null);
      showToast('success', 'Đã cập nhật voucher');
    } catch (err) {
      setError(err.message);
      showToast('error', err.message || 'Cập nhật voucher thất bại');
    }
  };

  const handleToggleVoucherStatus = async (voucher) => {
    const isActive = voucher.status === 'DANG_HOAT_DONG';
    const newStatus = isActive ? 'KHONG_HOAT_DONG' : 'DANG_HOAT_DONG';
    const msg = isActive
      ? `Bạn muốn tạm dừng voucher ${voucher.name}?`
      : `Bạn muốn tiếp tục kích hoạt voucher ${voucher.name}?`;
    if (!window.confirm(msg)) return;
    try {
      await toggleVoucherStatus(voucher, newStatus);
      showToast('success', isActive ? `Đã tạm dừng "${voucher.name}"` : `Đã kích hoạt lại "${voucher.name}"`);
    } catch (err) {
      setError(err.message);
      showToast('error', err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast('success', 'Đã sao chép mã voucher');
  };

  const getVoucherUsage = (voucherCode) => {
    return usageHistory.filter(usage => usage.voucherCode === voucherCode);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const fmtDisplayDate = (d) => d && String(d).trim() !== '' ? d : '—';

  const fmtMinOrderDisplay = (v) => {
    if (!v || parseFloat(v) === 0) return 'Không yêu cầu';
    return formatCurrency(v);
  };

  const fmtUsageDisplay = (used, limit) => {
    if (!limit || parseInt(limit) === 0) return `${used}/Không giới hạn`;
    return `${used}/${limit}`;
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  };

  // Filter vouchers based on selected filters
  const filteredVouchers = vouchers.filter(voucher => {
    // Filter by type
    if (filterType && voucher.type !== filterType) {
      return false;
    }

    // Filter by time range
    if (filterTimeRange) {
      const now = new Date();
      const startDate = voucher.startDate ? new Date(voucher.startDate) : null;
      const endDate = voucher.endDate ? new Date(voucher.endDate) : null;

      if (filterTimeRange === 'upcoming') {
        // Chưa bắt đầu
        if (!startDate || startDate <= now) return false;
      } else if (filterTimeRange === 'active') {
        // Đang hoạt động
        if (!startDate || !endDate || startDate > now || endDate < now) return false;
      } else if (filterTimeRange === 'expired') {
        // Đã hết hạn
        if (!endDate || endDate >= now) return false;
      }
    }

    // Filter by usage percentage (sắp hết)
    if (filterUsage) {
      const usagePercent = getUsagePercentage(voucher.usedCount, voucher.usageLimit);
      const threshold = parseInt(filterUsage);
      
      // Only show vouchers that have reached or exceeded the threshold
      // and have a usage limit (not unlimited)
      if (voucher.usageLimit === 0 || usagePercent < threshold) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
              <div className="mt-0.5">
                {toast.type === 'success' ? (
                  <IoCheckmarkCircle className="w-5 h-5" />
                ) : toast.type === 'error' ? (
                  <IoTrash className="w-5 h-5" />
                ) : (
                  <IoTime className="w-5 h-5" />
                )}
              </div>
              <div className="text-sm font-medium">{toast.message}</div>
              <button onClick={() => setToast(null)} className="ml-2 text-inherit hover:opacity-80">✕</button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý voucher</h1>
          <p className="text-gray-600">Quản lý mã giảm giá và khuyến mãi</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoTrash className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="mb-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoGift className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng voucher</p>
                <p className="text-2xl font-bold text-gray-900">{vouchers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">{vouchers.filter(v => v.status === 'DANG_HOAT_DONG').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoGift className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã sử dụng</p>
                <p className="text-2xl font-bold text-gray-900">{vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <IoGift className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng giảm giá ước tính</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    // Tính tổng giá trị giảm dựa trên số lượng đã sử dụng * giá trị giảm
                    const total = vouchers.reduce((sum, v) => {
                      const usedCount = v.usedCount || 0;
                      const value = v.value || 0;
                      // Ước tính: nếu là phần trăm, giả sử đơn hàng trung bình 1,000,000đ
                      // Nếu là fixed, lấy giá trị trực tiếp
                      const avgDiscount = v.type === 'percentage' 
                        ? (value / 100) * 1000000 // Giả sử đơn hàng TB 1tr
                        : value;
                      return sum + (usedCount * avgDiscount);
                    }, 0);
                    return Math.round(total).toLocaleString('vi-VN');
                  })()}đ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Bộ lọc</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại voucher
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tất cả</option>
                <option value="percentage">Phần trăm</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>

            {/* Filter by Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian
              </label>
              <select
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tất cả</option>
                <option value="upcoming">Chưa bắt đầu</option>
                <option value="active">Đang hoạt động</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </div>

            {/* Filter by Usage Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức độ sử dụng
              </label>
              <select
                value={filterUsage}
                onChange={(e) => setFilterUsage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tất cả</option>
                <option value="25">Sắp hết ≥25%</option>
                <option value="50">Sắp hết ≥50%</option>
                <option value="70">Sắp hết ≥70%</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filterType || filterTimeRange || filterUsage) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterTimeRange('');
                  setFilterUsage('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Vouchers List */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách voucher ({filteredVouchers.length})</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await fetchVouchers();
                    showToast('info', 'Đã làm mới danh sách voucher');
                  } catch (e) {
                    showToast('error', 'Làm mới thất bại');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <IoRefresh className="w-4 h-4" />
                Làm mới
              </button>
              <button
                onClick={handleAddVoucher}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <IoAdd className="w-4 h-4" />
                Tạo voucher
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <IoGift className="w-12 h-12 text-gray-300 mb-2" />
                        <p>Không tìm thấy voucher nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((voucher) => {
                  const statusInfo = getStatusInfo(voucher.status);
                  const typeInfo = getTypeInfo(voucher.type);
                  const StatusIcon = statusInfo.icon;
                  const usagePercentage = getUsagePercentage(voucher.usedCount, voucher.usageLimit);
                  const isActive = voucher.status === 'DANG_HOAT_DONG';

                  return (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{voucher.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          {voucher.code}
                          <button
                            onClick={() => handleCopyCode(voucher.code)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <IoCopy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {voucher.type === 'percentage' ? `${voucher.value}%` : formatCurrency(voucher.value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tối thiểu: {fmtMinOrderDisplay(voucher.minOrderValue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{fmtUsageDisplay(voucher.usedCount, voucher.usageLimit)}</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${usagePercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{fmtDisplayDate(voucher.startDate)}</div>
                        <div className="text-sm text-gray-500">đến {fmtDisplayDate(voucher.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewVoucher(voucher)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditVoucher(voucher)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <IoCreate className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              // Open assign tiers modal, prefill with voucher selected tiers from voucher_hang_thanh_vien table
                              (async () => {
                                try {
                                  // Fetch membership tiers if not loaded yet
                                  if (membershipTiers.length === 0) {
                                    await fetchMembershipTiers();
                                  }

                                  const detail = await fetchVoucherDetail(voucher.id);
                                  // Set applyToEveryone based on applicableTo
                                  const assignData = {
                                    ...detail,
                                    applyToEveryone: detail.applicableTo === 'everyone',
                                    selectedTiers: detail.selectedTiers || []
                                  };

                                  setAssigningVoucher(assignData);
                                  setShowAssignModal(true);
                                } catch (err) {
                                  setError('Không tải được chi tiết voucher để gán hạng');
                                }
                              })();
                            }}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            Gán hạng
                          </button>
                          <button
                            onClick={() => handleToggleVoucherStatus(voucher)}
                            className={isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                            title={isActive ? 'Tạm dừng' : 'Tiếp tục'}
                          >
                            {isActive ? (
                              <IoPause className="w-4 h-4" />
                            ) : (
                              <IoPlay className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voucher Detail Modal */}
        {showVoucherModal && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết voucher
                  </h3>
                  <button
                    onClick={() => setShowVoucherModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Voucher Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tên voucher:</span>
                          <span className="text-sm font-medium">{selectedVoucher.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mã voucher:</span>
                          <span className="text-sm font-medium">{selectedVoucher.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Loại:</span>
                          <span className="text-sm font-medium">{getTypeInfo(selectedVoucher.type).label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Giá trị:</span>
                          <span className="text-sm font-medium">
                            {selectedVoucher.type === 'percentage' ? `${selectedVoucher.value}%` : formatCurrency(selectedVoucher.value)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`text-sm font-medium ${getStatusInfo(selectedVoucher.status).color}`}>
                            {getStatusInfo(selectedVoucher.status).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Điều kiện sử dụng</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Đơn hàng tối thiểu:</span>
                          <span className="text-sm font-medium">{fmtMinOrderDisplay(selectedVoucher.minOrderValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Giảm tối đa:</span>
                          <span className="text-sm font-medium">{selectedVoucher.maxDiscount ? formatCurrency(selectedVoucher.maxDiscount) : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sử dụng:</span>
                          <span className="text-sm font-medium">{fmtUsageDisplay(selectedVoucher.usedCount, selectedVoucher.usageLimit)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time and Applicability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thời gian áp dụng</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Bắt đầu:</span>
                          <span className="text-sm font-medium">{fmtDisplayDate(selectedVoucher.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Kết thúc:</span>
                          <span className="text-sm font-medium">{fmtDisplayDate(selectedVoucher.endDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Đối tượng áp dụng</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sản phẩm:</span>
                          <span className="text-sm font-medium">
                            {Array.isArray(selectedVoucher.applicableProducts)
                              ? (selectedVoucher.applicableProducts.length > 0 ? selectedVoucher.applicableProducts.join(', ') : 'Tất cả sản phẩm')
                              : (selectedVoucher.applicableProducts || 'Tất cả sản phẩm')}
                          </span>
                        </div>

                        {/* If voucher is not for everyone, show applied membership tiers explicitly. Otherwise show customer applicability. */}
                        {selectedVoucher.apDungChoMoiNguoi === false ? (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Áp dụng hạng thành viên:</span>
                            <span className="text-sm font-medium">
                              {selectedVoucher.appliedTierNames && selectedVoucher.appliedTierNames.trim() !== ''
                                ? selectedVoucher.appliedTierNames
                                : 'Không có hạng cụ thể'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Khách hàng:</span>
                            <span className="text-sm font-medium">
                              {Array.isArray(selectedVoucher.applicableCustomers)
                                ? (selectedVoucher.applicableCustomers.length > 0 ? selectedVoucher.applicableCustomers.join(', ') : 'Tất cả khách hàng')
                                : (selectedVoucher.applicableCustomers || 'Tất cả khách hàng')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Mô tả</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{selectedVoucher.description}</p>
                    </div>
                  </div>

                  {/* Usage History */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Lịch sử sử dụng</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getVoucherUsage(selectedVoucher.code).map((usage) => (
                        <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{usage.customer}</span>
                            <div className="text-sm text-gray-500">Đơn hàng: {usage.orderId}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(usage.discountAmount)}</div>
                            <div className="text-sm text-gray-500">{usage.usedAt}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowVoucherModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Voucher Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Tạo voucher mới
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveVoucher(); }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên voucher</label>
                        <input
                          type="text"
                          value={newVoucher.name}
                          onChange={(e) => setNewVoucher({ ...newVoucher, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập tên voucher"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
                        <input
                          type="text"
                          value={newVoucher.code}
                          onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập mã voucher"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                        <select
                          value={newVoucher.type}
                          onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="percentage">Phần trăm (%)</option>
                          <option value="fixed">Số tiền cố định (VND)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {newVoucher.type === 'percentage' ? 'Phần trăm giảm' : 'Số tiền giảm (VND)'}
                        </label>
                        <input
                          type="number"
                          value={newVoucher.value}
                          onChange={(e) => setNewVoucher({ ...newVoucher, value: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="0"
                          max={newVoucher.type === 'percentage' ? 100 : undefined}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị đơn hàng tối thiểu (VND)</label>
                        <input
                          type="number"
                          value={newVoucher.minOrderValue}
                          onChange={(e) => setNewVoucher({ ...newVoucher, minOrderValue: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá tối đa (VND)</label>
                        <input
                          type="number"
                          value={newVoucher.maxDiscount}
                          onChange={(e) => setNewVoucher({ ...newVoucher, maxDiscount: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
                        <input
                          type="number"
                          value={newVoucher.usageLimit}
                          onChange={(e) => setNewVoucher({ ...newVoucher, usageLimit: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="0"
                          placeholder="0 = không giới hạn"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <input
                          type="date"
                          value={newVoucher.startDate}
                          onChange={(e) => setNewVoucher({ ...newVoucher, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={newVoucher.endDate}
                        onChange={(e) => setNewVoucher({ ...newVoucher, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                      <textarea
                        value={newVoucher.description}
                        onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="3"
                        placeholder="Mô tả chi tiết về voucher..."
                      />
                    </div>

                    {/* 'Điều kiện sử dụng' removed (unused) */}

                    {/* Applicability: everyone or specific tiers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Áp dụng cho</label>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center">
                          <input type="radio" name="applicableTo" checked={newVoucher.applicableTo === 'everyone'} onChange={() => setNewVoucher({ ...newVoucher, applicableTo: 'everyone', selectedTiers: [] })} />
                          <span className="ml-2">Tất cả mọi người</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input type="radio" name="applicableTo" checked={newVoucher.applicableTo === 'tiers'} onChange={() => {
                            setNewVoucher({ ...newVoucher, applicableTo: 'tiers' });
                            // Fetch membership tiers when selecting this option
                            if (membershipTiers.length === 0) {
                              fetchMembershipTiers();
                            }
                          }} />
                          <span className="ml-2">Theo hạng thành viên</span>
                        </label>
                      </div>

                      {newVoucher.applicableTo === 'tiers' && (
                        <div className="mt-2">
                          <label className="block text-sm text-gray-600 mb-1">Chọn hạng thành viên</label>
                          <select multiple value={newVoucher.selectedTiers} onChange={(e) => {
                            const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                            setNewVoucher({ ...newVoucher, selectedTiers: opts });
                          }} className="w-full h-32 p-2 border rounded">
                            {membershipTiers.map(t => (
                              <option key={t.id} value={String(t.id)}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Checkbox kích hoạt voucher */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="newVoucherActive"
                        checked={newVoucher.isActive}
                        onChange={(e) => setNewVoucher({ ...newVoucher, isActive: e.target.checked })}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <label htmlFor="newVoucherActive" className="ml-3 text-sm font-medium text-gray-700">
                        Kích hoạt voucher này ngay sau khi tạo
                        <span className="block text-xs text-gray-500 mt-1">
                          Nếu bỏ chọn, voucher sẽ ở trạng thái "Tạm dừng" và không thể sử dụng
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Tạo voucher
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Assign tiers Modal */}
        {showAssignModal && assigningVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Gán hạng cho voucher</h3>
                  <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-3">Voucher: <span className="font-medium">{assigningVoucher.name}</span></p>
                  <div className="mb-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(assigningVoucher.applyToEveryone)}
                        onChange={(e) => setAssigningVoucher({
                          ...assigningVoucher,
                          applyToEveryone: e.target.checked,
                          selectedTiers: e.target.checked ? [] : (assigningVoucher.selectedTiers || [])
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 font-medium">Áp dụng cho mọi người</span>
                    </label>
                  </div>

                  {!assigningVoucher.applyToEveryone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chọn hạng thành viên</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {membershipTiers.map(tier => {
                          const selectedTiersArray = assigningVoucher.selectedTiers || [];
                          const tierIdString = String(tier.id);
                          const isChecked = selectedTiersArray.includes(tierIdString);
                          return (
                            <label key={tier.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentTiers = assigningVoucher.selectedTiers || [];
                                  const tierId = String(tier.id);
                                  const newTiers = e.target.checked
                                    ? [...currentTiers, tierId]
                                    : currentTiers.filter(id => id !== tierId);
                                  setAssigningVoucher({
                                    ...assigningVoucher,
                                    selectedTiers: newTiers,
                                    applyToEveryone: false
                                  });
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="ml-2 text-sm">{tier.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                  <button type="button" onClick={async () => {
                    try {
                      const ids = assigningVoucher.applyToEveryone ? [] : (assigningVoucher.selectedTiers || []).map(s => Number(s));
                      await api.post(`/api/v1/voucher/${assigningVoucher.id}/assign-tiers`, { body: ids });

                      // Refresh vouchers list to show updated tier assignments
                      await fetchVouchers();

                      // If editing modal is open, refresh its data too
                      if (editingVoucher && editingVoucher.id === assigningVoucher.id) {
                        const updatedDetail = await fetchVoucherDetail(assigningVoucher.id);
                        setEditingVoucher(updatedDetail);
                      }

                      setShowAssignModal(false);
                      setError(null);
                      showToast('success', 'Đã gán hạng cho voucher');
                    } catch (err) {
                      setError('Gán hạng thất bại');
                      showToast('error', 'Gán hạng thất bại');
                    }
                  }} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Gán</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Voucher Modal */}
        {showEditModal && editingVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chỉnh sửa voucher
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên voucher
                      </label>
                      <input
                        type="text"
                        value={editingVoucher.name}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập tên voucher"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã voucher
                      </label>
                      <input
                        type="text"
                        value={editingVoucher.code}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập mã voucher"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại giảm giá
                      </label>
                      <select
                        value={editingVoucher.type}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="percentage">Phần trăm</option>
                        <option value="fixed">Số tiền cố định</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá trị giảm
                      </label>
                      <input
                        type="number"
                        value={editingVoucher.value}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, value: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập giá trị giảm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={editingVoucher.startDate}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={editingVoucher.endDate}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        value={editingVoucher.quantity}
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, quantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập số lượng"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={editingVoucher.description}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nhập mô tả voucher"
                    />
                  </div>

                  {/* Checkbox kích hoạt voucher */}
                  <div className="mt-6 flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="editVoucherActive"
                      checked={editingVoucher.isActive}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="editVoucherActive" className="ml-3 text-sm font-medium text-gray-700">
                      Kích hoạt voucher này
                      <span className="block text-xs text-gray-500 mt-1">
                        Nếu bỏ chọn, voucher sẽ ở trạng thái "Tạm dừng" và không thể sử dụng
                      </span>
                    </label>
                  </div>

                  {/* Applicability is read-only in the Edit modal. Use the separate "Gán hạng" flow to manage tier assignments. */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Áp dụng cho</label>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {(editingVoucher.applicableTo === 'everyone' ? 'Tất cả mọi người' : 'Theo hạng thành viên')}
                        </div>
                        {editingVoucher.appliedTierNames && editingVoucher.appliedTierNames.length > 0 && (
                          <div className="text-sm text-gray-600 mt-1">Hạng đã gán: {editingVoucher.appliedTierNames}</div>
                        )}
                      </div>
                      <div>
                        <button type="button" onClick={async () => {
                          // Open assign modal to allow assigning/clearing tiers
                          try {
                            // Fetch membership tiers if not loaded yet
                            if (membershipTiers.length === 0) {
                              await fetchMembershipTiers();
                            }

                            const detail = await fetchVoucherDetail(editingVoucher.id);
                            setAssigningVoucher({
                              ...detail,
                              applyToEveryone: detail.applicableTo === 'everyone',
                              selectedTiers: detail.selectedTiers || []
                            });
                            setShowAssignModal(true);
                            // Keep edit modal open underneath; admin can close when done
                          } catch (err) {
                            setError('Không tải được chi tiết voucher để gán hạng');
                          }
                        }} className="px-3 py-1 bg-indigo-600 text-white rounded">Gán hạng</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherManagement;

