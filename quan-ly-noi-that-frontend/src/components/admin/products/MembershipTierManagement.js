import React, { useState, useEffect } from 'react';
import { IoAdd, IoCreate, IoTrash, IoEye, IoSearch, IoFilter, IoDownload, IoTrophy, IoStar, IoTrendingUp, IoGift, IoTime, IoClose, IoCheckmark } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import Toast from '../../shared/Toast';
import api from '../../../api';

const MembershipTierManagement = () => {
  // State declarations (added missing ones)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [membershipTiers, setMembershipTiers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [benefitsEditingTier, setBenefitsEditingTier] = useState(null);
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const [selectedTierCustomers, setSelectedTierCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const initialNewTier = {
    tenHang: '',
    diemToiThieu: '',
    // diemToiDa removed — max points managed elsewhere
    // tiLeHoan removed — reward rate managed elsewhere
    tiLeGiam: '',
    gioiHanMuaHang: '',
    uu_dai: [{ benefitType: 'LEGACY_TEXT', params: '{}', description: '' }], // Initial benefit
    mauSac: 'bg-blue-600',
    bieuTuong: '⭐',
    moTa: '',
    trangThai: 'hoat_dong',
    thuTu: 0,
    icon: '⭐' // Using 'icon' for API mapping
  };

  const [newTier, setNewTier] = useState(initialNewTier);


  // Map membership tier data from API
  const mapMembershipTierFromApi = (tier) => ({
    maHang: tier.maHangThanhVien ?? tier.id,
    tenHang: tier.tenHang ?? tier.name ?? '',
    diemToiThieu: tier.diemToiThieu ?? tier.minPoints ?? 0,
    // backend may not provide diemToiDa; fall back to diemToiThieu
    diemToiDa: tier.diemToiDa ?? tier.maxPoints ?? (tier.diemToiThieu ?? 0),
    tiLeHoan: tier.tiLeHoan ?? tier.pointsRate ?? 1.0,
    tiLeGiam: tier.tiLeGiam ?? tier.discountRate ?? 0,
    gioiHanMuaHang: tier.gioiHanMuaHang ?? tier.purchaseLimit ?? 0,
    // normalize benefits to array of objects for UI (prefer structured vipBenefits)
    uu_dai: (tier.vipBenefits && Array.isArray(tier.vipBenefits) && tier.vipBenefits.length > 0)
      ? tier.vipBenefits.map(b => ({
        maVipBenefit: b.maVipBenefit,
        benefitType: b.benefitType || 'LEGACY_TEXT',
        params: b.params || '{}',
        description: b.description || (typeof b === 'string' ? b : (b.tenUuDai || b.moTa || '')),
        active: b.active == null ? true : b.active
      }))
      : (tier.uuDaiList && Array.isArray(tier.uuDaiList) && tier.uuDaiList.length > 0)
        ? tier.uuDaiList.map(b => ({
          maVipBenefit: b.maVipBenefit,
          benefitType: b.benefitType || 'LEGACY_TEXT',
          params: b.params || (b.giaTriUuDai ? JSON.stringify(b.giaTriUuDai) : '{}'),
          description: b.tenUuDai || b.description || (typeof b === 'string' ? b : ''),
          active: b.active == null ? true : b.active
        }))
        : (tier.moTa ? [{ benefitType: 'LEGACY_TEXT', params: '{}', description: tier.moTa }] : []),
    mauSac: tier.mauSac ?? tier.color ?? 'bg-gray-200',
    icon: tier.icon ?? '⭐',
    bieuTuong: tier.icon ?? '⭐', // Use bieuTuong for UI display
  thuTu: tier.thuTu ?? tier.order ?? 0,
  // Normalize status: backend may return boolean or legacy string. Provide both boolean and UI string.
  trangThaiBool: (typeof tier.trangThai === 'boolean') ? tier.trangThai : (typeof tier.active === 'boolean' ? tier.active : (tier.trangThai === 'hoat_dong' || tier.active ? true : false)),
  trangThai: (typeof tier.trangThai === 'boolean') ? (tier.trangThai ? 'hoat_dong' : 'tam_dung') : (tier.trangThai ?? (tier.active ? 'hoat_dong' : 'tam_dung')) || 'hoat_dong',
    soKhachHang: tier.soLuongKhachHang ?? tier.soKhachHang ?? tier.memberCount ?? 0,
    soThanhVien: tier.soLuongKhachHang ?? tier.soKhachHang ?? tier.memberCount ?? 0, // for statistics/display
    moTa: tier.moTa ?? '',
    // Add missing fields for detail modal if needed from API
    ngayTao: tier.ngayTao ?? 'N/A',
    nguoiTao: tier.nguoiTao ?? 'N/A'
  });

  const mapMembershipTierToApi = (tier) => ({
    tenHang: tier.tenHang,
    diemToiThieu: Number(tier.diemToiThieu) || 0,
    diemToiDa: Number(tier.diemToiDa) || 0,
    tiLeHoan: Number(tier.tiLeHoan) || 0,
    tiLeGiam: Number(tier.tiLeGiam) || 0,
    gioiHanMuaHang: Number(tier.gioiHanMuaHang) || 0,
    mauSac: tier.mauSac,
    icon: tier.icon ?? tier.bieuTuong,
    thuTu: tier.thuTu,
  // Send backend boolean for status field (true = active)
  trangThai: (typeof tier.trangThaiBool === 'boolean') ? tier.trangThaiBool : (tier.trangThai === 'hoat_dong'),
    moTa: tier.moTa,
    // send structured vipBenefits for backend to persist
    vipBenefits: (tier.uu_dai || []).map(benefit => ({
      maVipBenefit: benefit.maVipBenefit,
      benefitType: benefit.benefitType || 'LEGACY_TEXT',
      // Backend expects params as a JSON string field. Ensure we send a string.
      params: (typeof benefit.params === 'string') ? benefit.params : JSON.stringify(benefit.params || {}),
      description: benefit.description || benefit.tenUuDai || benefit.moTa || (typeof benefit === 'string' ? benefit : ''),
      active: benefit.active == null ? true : benefit.active
    }))
  });

  // Create new tier (calls backend)
  const createTier = async (tierInput) => {
    try {
      const payload = mapMembershipTierToApi(tierInput);
        const created = await api.post('/api/hang-thanh-vien', { body: payload });
      // map and insert
      setMembershipTiers(prev => [...prev, mapMembershipTierFromApi(created)]);
      Toast.show('Thêm hạng thành viên thành công', 'success');
      return created;
    } catch (err) {
      Toast.show(err.data?.message || 'Không thể thêm hạng', 'error');
      throw err;
    }
  };

  // Update tier
  const updateTier = async (id, tierInput) => {
    try {
      const payload = mapMembershipTierToApi(tierInput);
  const updated = await api.put(`/api/hang-thanh-vien/${id}`, { body: payload });
      setMembershipTiers(prev => prev.map(t => t.maHang === (updated.maHangThanhVien ?? id) ? mapMembershipTierFromApi(updated) : t));
      Toast.show('Cập nhật hạng thành viên thành công', 'success');
      return updated;
    } catch (err) {
      Toast.show(err.data?.message || 'Không thể cập nhật hạng', 'error');
      throw err;
    }
  };

  // Toggle tier status (activate/deactivate) using PATCH
  const toggleTierStatus = async (tier) => {
    try {
      const newStatus = !tier.trangThaiBool;
      const response = await api.patch(`/api/hang-thanh-vien/${tier.maHang}/status`, { trangThai: newStatus });
      
      // Update with response from server
      const updated = mapMembershipTierFromApi(response);
      setMembershipTiers(prev => prev.map(t => t.maHang === tier.maHang ? updated : t));
      
      Toast.show(newStatus ? 'Đã kích hoạt hạng thành viên' : 'Đã vô hiệu hóa hạng thành viên', 'success');
    } catch (err) {
      Toast.show(err.data?.message || 'Không thể thay đổi trạng thái', 'error');
      throw err;
    }
  };

  // Fetch customers for a specific tier
  const fetchTierCustomers = async (tierId) => {
    setLoadingCustomers(true);
    try {
      const response = await api.get(`/api/hang-thanh-vien/${tierId}/khach-hang`);
      const customers = Array.isArray(response) ? response : (response?.data || []);
      setSelectedTierCustomers(customers.map(customer => ({
        maKhachHang: customer.maKhachHang || customer.id,
        hoTen: customer.hoTen || customer.name || '',
        email: customer.email || '',
        soDienThoai: customer.soDienThoai || customer.phone || '',
        diemThuong: customer.diemThuong || customer.points || 0,
        tongChiTieu: customer.tongChiTieu || customer.totalSpent || 0,
        ngayThamGia: customer.ngayThamGia || customer.joinDate || 'N/A'
      })));
      setShowCustomersModal(true);
    } catch (err) {
      Toast.show('Không thể tải danh sách khách hàng', 'error');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch membership tiers (use /all endpoint to get non-paginated list)
  useEffect(() => {
    const fetchMembershipTiers = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/hang-thanh-vien/all');
        if (Array.isArray(data)) {
          setMembershipTiers(data.map(mapMembershipTierFromApi));
        }
      } catch (err) {
        setError(err);
        Toast.show('Không thể tải danh sách hạng thành viên', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembershipTiers();
  }, []); // Run only once on mount

  // Filter and sort tiers
  const filteredTiers = membershipTiers.filter(tier => {
    const matchesSearch = tier.tenHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(tier.maHang).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tier.moTa?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'all' || tier.trangThai === filterStatus;
    
    // Points range filter
    const tierPoints = Number(tier.diemToiThieu) || 0;
    const matchesMinPoints = minPoints === '' || tierPoints >= Number(minPoints);
    const matchesMaxPoints = maxPoints === '' || tierPoints <= Number(maxPoints);
    
    return matchesSearch && matchesStatus && matchesMinPoints && matchesMaxPoints;
  }).sort((a, b) => (Number(a.diemToiThieu) || 0) - (Number(b.diemToiThieu) || 0));

  // Statistics
  const stats = {
    total: membershipTiers.length,
    active: membershipTiers.filter(tier => tier.trangThai === 'hoat_dong').length,
    inactive: membershipTiers.filter(tier => tier.trangThai === 'tam_dung').length,
    totalMembers: membershipTiers.reduce((sum, tier) => sum + (Number(tier.soThanhVien) || 0), 0),
    // avgRewardRate/avgDiscountRate intentionally omitted — rewards/discounts managed via VipBenefit
  };

  const colors = [
    'bg-amber-600', 'bg-gray-500', 'bg-yellow-500', 'bg-gray-400',
    'bg-blue-600', 'bg-purple-600', 'bg-red-600', 'bg-green-600',
    'bg-indigo-600', 'bg-pink-600'
  ];

  const icons = ['⭐', '🥉', '🥈', '🥇', '💎', '👑', '🏆', '🎖️', '🌟', '✨'];

  const handleAddTier = () => {
    if (!newTier.tenHang || !newTier.diemToiThieu) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    // call backend create
    (async () => {
      setIsLoading(true);
      try {
        await createTier(newTier);
        // reset form
        setNewTier(initialNewTier);
        setShowAddModal(false);
      } catch (err) {
        // error already shown in createTier
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleEditTier = () => {
    if (!editingTier.tenHang || !editingTier.diemToiThieu) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    // call backend update
    (async () => {
      setIsLoading(true);
      try {
        await updateTier(editingTier.maHang, editingTier);
        setShowEditModal(false);
        setEditingTier(null);
      } catch (err) {
        // error already shown in updateTier
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleToggleStatus = (tier) => {
    (async () => {
      setIsLoading(true);
      try {
        await toggleTierStatus(tier);
      } catch (err) {
        // error shown in toggleTierStatus
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hoat_dong': return 'bg-green-100 text-green-800';
      case 'tam_dung': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'hoat_dong': return 'Hoạt động';
      case 'tam_dung': return 'Tạm dừng';
      default: return status;
    }
  };

  const addBenefit = (benefits, setBenefits) => {
    setBenefits([...benefits, { benefitType: 'LEGACY_TEXT', params: '{}', description: '' }]);
  };

  const removeBenefit = (benefits, setBenefits, index) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const updateBenefit = (benefits, setBenefits, index, value) => {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  };

  // parse params which may be JSON string or object
  const parseParams = (params) => {
    if (!params && params !== 0) return {};
    if (typeof params === 'object') return params;
    try {
      return JSON.parse(params);
    } catch (e) {
      return {};
    }
  };

  // Format a VipBenefit object into a friendly string for display
  const formatBenefit = (benefit) => {
    if (!benefit) return '';
    const type = benefit.benefitType || 'LEGACY_TEXT';
    const params = parseParams(benefit.params);
    switch (type) {
      case 'PERCENT_DISCOUNT': {
        const pct = params.percent != null ? params.percent : params.percent === 0 ? 0 : null;
        const min = params.minOrder || params.min || 0;
        if (pct != null) return `Giảm ${pct}% cho đơn trên ${formatCurrency(min)}`;
        return benefit.description || 'Giảm giá';
      }
      case 'FREE_SHIPPING': {
        const min = params.minOrder || params.min || 0;
        return benefit.description || `Miễn phí vận chuyển cho đơn trên ${formatCurrency(min)}`;
      }
      case 'BONUS_POINTS': {
        if (params.points) return benefit.description || `Tặng ${params.points} điểm`;
        if (params.percent) return benefit.description || `Tặng ${params.percent}% điểm`;
        return benefit.description || 'Tặng điểm';
      }
      case 'PRIORITY_SHIPPING':
        return benefit.description || 'Ưu tiên giao hàng';
      case 'LEGACY_TEXT':
      case 'CUSTOM':
      default:
        return benefit.description || (benefit.params ? (typeof benefit.params === 'string' ? benefit.params : JSON.stringify(benefit.params)) : '');
    }
  };

  // render the params input depending on benefitType
  const renderParamsInput = (benefit, index, benefitsArray, setBenefitsFunc) => {
    const paramsObj = parseParams(benefit.params);
  // ensure inputs can shrink inside flex/grid containers to avoid horizontal overflow
  const inputClass = 'w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

    switch (benefit.benefitType) {
      case 'PERCENT_DISCOUNT': {
        const pct = paramsObj.percent ?? '';
        const minOrder = paramsObj.minOrder ?? '';
        return (
          <div key={`${index}-percent-discount`} className="flex gap-2 w-full">
            <input
              type="number"
              step="0.1"
              min="0"
              value={pct}
              onChange={(e) => {
                const v = e.target.value;
                const newObj = { ...paramsObj, percent: v === '' ? undefined : parseFloat(v), minOrder: paramsObj.minOrder ?? 0 };
                updateBenefit(benefitsArray, setBenefitsFunc, index, { ...benefit, params: JSON.stringify(newObj) });
              }}
              className={inputClass}
              placeholder="Phần trăm giảm (%)"
            />
            <input
              type="number"
              step="1000"
              min="0"
              value={minOrder}
              onChange={(e) => {
                const v = e.target.value;
                const newObj = { ...paramsObj, minOrder: v === '' ? 0 : parseFloat(v), percent: paramsObj.percent ?? 0 };
                updateBenefit(benefitsArray, setBenefitsFunc, index, { ...benefit, params: JSON.stringify(newObj) });
              }}
              className={inputClass}
              placeholder="Mức đơn tối thiểu (VND)"
            />
          </div>
        );
      }
      case 'FREE_SHIPPING': {
        const val = paramsObj.minOrder ?? '';
        return (
          <input
            key={`${index}-free-shipping`}
            type="number"
            step="1000"
            min="0"
            value={val}
            onChange={(e) => {
              const v = e.target.value;
              const newObj = { ...paramsObj, minOrder: v === '' ? undefined : parseFloat(v) };
              updateBenefit(benefitsArray, setBenefitsFunc, index, { ...benefit, params: JSON.stringify(newObj) });
            }}
            className={inputClass}
            placeholder="Mức đơn tối thiểu (VND)"
          />
        );
      }
      case 'BONUS_POINTS': {
        const val = paramsObj.points ?? '';
        return (
          <input
            key={`${index}-bonus-points`}
            type="number"
            step="1"
            min="0"
            value={val}
            onChange={(e) => {
              const v = e.target.value;
              const newObj = { ...paramsObj, points: v === '' ? undefined : parseInt(v, 10) };
              updateBenefit(benefitsArray, setBenefitsFunc, index, { ...benefit, params: JSON.stringify(newObj) });
            }}
            className={inputClass}
            placeholder="Số điểm cộng"
          />
        );
      }
      case 'PRIORITY_SHIPPING': {
        const val = paramsObj.level ?? 'fast';
        return (
          <select
            key={`${index}-priority-shipping`}
            value={val}
            onChange={(e) => {
              const v = e.target.value;
              const newObj = { ...paramsObj, level: v };
              updateBenefit(benefitsArray, setBenefitsFunc, index, { ...benefit, params: JSON.stringify(newObj) });
            }}
            className={inputClass}
          >
            <option value="standard">Chuẩn</option>
            <option value="fast">Nhanh</option>
          </select>
        );
      }
      default: {
        // LEGACY_TEXT or unknown — raw JSON/text
        const val = typeof benefit.params === 'string' ? benefit.params : JSON.stringify(benefit.params || {});
        return (
          <input
            key={`${index}-legacy-params`}
            type="text"
            value={val}
            onChange={(e) => updateBenefit(benefitsArray, setBenefitsFunc, index, { ...benefit, params: e.target.value })}
            className={inputClass}
            placeholder='Tham số (JSON) ví dụ {"percent":5}'
          />
        );
      }
    }
  };

  // Display loading/error states
  if (isLoading && membershipTiers.length === 0) {
    return <div className="p-6 text-center text-gray-500">Đang tải danh sách hạng thành viên...</div>;
  }

  if (error && membershipTiers.length === 0) {
    return <div className="p-6 text-center text-red-600">Lỗi: Không thể tải dữ liệu. Vui lòng thử lại.</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý hạng thành viên</h1>
        <p className="text-gray-600">Thiết lập và quản lý các hạng thành viên với ưu đãi tương ứng</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <IoTrophy className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Tổng hạng</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <IoStar className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Hoạt động</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <IoTime className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              <p className="text-sm text-gray-500">Tạm dừng</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <IoTrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Thành viên</p>
            </div>
          </div>
        </div>

        {/* Reward rate statistics removed — managed by VipBenefit */}

        {/* Discount statistics removed — discounts are managed by VipBenefit */}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Row 1: Search + Status Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 sm:max-w-md">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm hạng thành viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <IoFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="hoat_dong">Hoạt động</option>
                  <option value="tam_dung">Tạm dừng</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewTier(initialNewTier);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <IoAdd className="w-4 h-4" />
                Thêm hạng mới
              </button>
              <button 
                onClick={() => {
                  // Export to Excel
                  const data = filteredTiers.map(tier => ({
                    'Mã hạng': tier.maHang,
                    'Tên hạng': tier.tenHang,
                    'Điểm tối thiểu': tier.diemToiThieu,
                    'Số thành viên': tier.soThanhVien,
                    'Trạng thái': getStatusText(tier.trangThai),
                    'Mô tả': tier.moTa
                  }));
                  
                  const ws = window.XLSX?.utils?.json_to_sheet(data);
                  const wb = window.XLSX?.utils?.book_new();
                  window.XLSX?.utils?.book_append_sheet(wb, ws, 'Hạng thành viên');
                  window.XLSX?.writeFile(wb, `hang-thanh-vien-${new Date().toISOString().split('T')[0]}.xlsx`);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <IoDownload className="w-4 h-4" />
                Xuất Excel
              </button>
            </div>
          </div>

          {/* Row 2: Points Range Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Lọc theo điểm:</label>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="number"
                placeholder="Điểm tối thiểu"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">—</span>
              <input
                type="number"
                placeholder="Điểm tối đa"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {(minPoints || maxPoints) && (
                <button
                  onClick={() => {
                    setMinPoints('');
                    setMaxPoints('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Membership Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        {filteredTiers.map((tier) => (
          <div key={tier.maHang} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className={`${tier.mauSac} p-4 text-white relative`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{tier.bieuTuong}</span>
                  <h3 className="text-lg font-bold">{tier.tenHang}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tier.trangThai === 'hoat_dong' ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'
                  }`}>
                  {getStatusText(tier.trangThai)}
                </span>
              </div>
              <p className="text-sm opacity-90 mt-1">{tier.maHang}</p>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Điểm tối thiểu</label>
                  <p className="text-sm font-semibold">{(Number(tier.diemToiThieu) || 0).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Tích điểm</label>
                    {/* Tỷ lệ hoàn điểm không hiển thị ở đây (quản lý bởi VipBenefit) */}
                  </div>
                  {/* Discount display intentionally removed: VipBenefit service manages discounts */}
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Thành viên</label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{(Number(tier.soThanhVien) || 0).toLocaleString()}</p>
                    <button
                      onClick={() => fetchTierCustomers(tier.maHang)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                      title="Xem danh sách khách hàng"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>

                {/* Benefits (show brief summary) */}
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Ưu đãi</label>
                  <ul className="text-sm text-gray-900">
                    {(tier.uu_dai || []).slice(0,2).map((b, i) => (
                      <li key={i}>{formatBenefit(b)}</li>
                    ))}
                    {(tier.uu_dai || []).length > 2 && <li className="text-xs text-gray-500">+{(tier.uu_dai || []).length - 2} ưu đãi khác</li>}
                  </ul>
                </div>
              </div>

              <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedTier(tier);
                    setShowDetailModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  title="Xem chi tiết"
                >
                  <IoEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setBenefitsEditingTier({
                      ...tier,
                      diemToiThieu: String(tier.diemToiThieu ?? ''),
                      tiLeGiam: String(tier.tiLeGiam ?? ''),
                      gioiHanMuaHang: String(tier.gioiHanMuaHang ?? '')
                    });
                    setShowBenefitsModal(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-800"
                  title="Quản lý ưu đãi"
                >
                  <IoGift className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingTier({
                      ...tier,
                      diemToiThieu: String(tier.diemToiThieu ?? ''),
                      tiLeGiam: String(tier.tiLeGiam ?? ''),
                      gioiHanMuaHang: String(tier.gioiHanMuaHang ?? '')
                    });
                    setShowEditModal(true);
                  }}
                  className="text-yellow-600 hover:text-yellow-800"
                  title="Chỉnh sửa"
                >
                  <IoCreate className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(tier)}
                  className={tier.trangThaiBool ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}
                  title={tier.trangThaiBool ? "Vô hiệu hóa" : "Kích hoạt"}
                  disabled={isLoading}
                >
                  {tier.trangThaiBool ? <IoClose className="w-5 h-5" /> : <IoCheckmark className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Not Found Message (outside of map to ensure it shows when array is empty) */}
        {filteredTiers.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 bg-white rounded-lg shadow">
            <IoTrophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy hạng thành viên</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc thêm hạng mới</p>
          </div>
        )}
      </div>

      {/* Add Tier Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm hạng thành viên mới">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên hạng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTier.tenHang}
                onChange={(e) => setNewTier({ ...newTier, tenHang: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên hạng thành viên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={newTier.trangThai}
                onChange={(e) => setNewTier({ ...newTier, trangThai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hoat_dong">Hoạt động</option>
                <option value="tam_dung">Tạm dừng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm tối thiểu <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newTier.diemToiThieu}
                onChange={(e) => setNewTier({ ...newTier, diemToiThieu: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Điểm tối đa và Tỷ lệ hoàn điểm được quản lý bởi hệ thống VipBenefit - trường bị loại khỏi form */}

            {/* Discount and min-order fields removed — managed by VipBenefit service */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
              <select
                value={newTier.mauSac}
                onChange={(e) => setNewTier({ ...newTier, mauSac: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {colors.map(color => (
                  <option key={color} value={color}>
                    {color.replace('bg-', '').replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biểu tượng</label>
              <select
                value={newTier.bieuTuong}
                onChange={(e) => setNewTier({ ...newTier, bieuTuong: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {icons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={newTier.moTa}
                onChange={(e) => setNewTier({ ...newTier, moTa: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mô tả hạng thành viên"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ưu đãi</label>
              {newTier.uu_dai.map((benefit, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 items-center border p-2 rounded-md">
                  <select
                    value={benefit.benefitType}
                    onChange={(e) => updateBenefit(newTier.uu_dai, (benefits) => setNewTier({ ...newTier, uu_dai: benefits }), index, { ...benefit, benefitType: e.target.value })}
                    className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LEGACY_TEXT">Chuỗi mô tả (legacy)</option>
                    <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                    <option value="PERCENT_DISCOUNT">Giảm phần trăm</option>
                    <option value="BONUS_POINTS">Tích điểm</option>
                    <option value="PRIORITY_SHIPPING">Ưu tiên giao hàng</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      {renderParamsInput(benefit, index, newTier.uu_dai, (b) => setNewTier({ ...newTier, uu_dai: b }))}
                      <div className="text-xs text-gray-500 mt-1 truncate">{formatBenefit(benefit)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(newTier.uu_dai, (benefits) => setNewTier({ ...newTier, uu_dai: benefits }), index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Xóa ưu đãi"
                    >
                      <IoTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addBenefit(newTier.uu_dai, (benefits) => setNewTier({ ...newTier, uu_dai: benefits }))}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 mt-2"
              >
                + Thêm ưu đãi
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAddTier}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Đang thêm...' : 'Thêm hạng'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Benefits-only Modal: edit only the uu_dai (vipBenefits) for a tier */}
      <Modal isOpen={showBenefitsModal} onClose={() => { setShowBenefitsModal(false); setBenefitsEditingTier(null); }} title="Quản lý ưu đãi">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          {!benefitsEditingTier && <div className="text-sm text-gray-500">Không có hạng để chỉnh sửa ưu đãi</div>}
          {benefitsEditingTier && (
            <div>
              <div className="mb-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{benefitsEditingTier.tenHang}</h3>
                    <p className="text-sm text-gray-500">Chỉ chỉnh sửa các ưu đãi cho hạng này</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={String(benefitsEditingTier.trangThaiBool)}
                      onChange={(e) => setBenefitsEditingTier({ ...benefitsEditingTier, trangThaiBool: e.target.value === 'true' })}
                      className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={'true'}>Hoạt động</option>
                      <option value={'false'}>Tạm dừng</option>
                    </select>

                    <select
                      value={benefitsEditingTier.icon || benefitsEditingTier.bieuTuong}
                      onChange={(e) => setBenefitsEditingTier({ ...benefitsEditingTier, icon: e.target.value, bieuTuong: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {icons.map(ic => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {(benefitsEditingTier.uu_dai || []).map((benefit, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 items-center border p-2 rounded-md">
                    <select
                      value={benefit.benefitType}
                      onChange={(e) => updateBenefit(benefitsEditingTier.uu_dai, (b) => setBenefitsEditingTier({ ...benefitsEditingTier, uu_dai: b }), idx, { ...benefit, benefitType: e.target.value })}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LEGACY_TEXT">Chuỗi mô tả (legacy)</option>
                      <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                      <option value="PERCENT_DISCOUNT">Giảm phần trăm</option>
                      <option value="BONUS_POINTS">Tích điểm</option>
                      <option value="PRIORITY_SHIPPING">Ưu tiên giao hàng</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        {renderParamsInput(benefit, idx, benefitsEditingTier.uu_dai, (b) => setBenefitsEditingTier({ ...benefitsEditingTier, uu_dai: b }))}
                        <div className="text-xs text-gray-500 mt-1 truncate">{formatBenefit(benefit)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBenefit(benefitsEditingTier.uu_dai, (b) => setBenefitsEditingTier({ ...benefitsEditingTier, uu_dai: b }), idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Xóa ưu đãi"
                      >
                        <IoTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={() => addBenefit(benefitsEditingTier.uu_dai, (b) => setBenefitsEditingTier({ ...benefitsEditingTier, uu_dai: b }))}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md"
                  >
                    Thêm ưu đãi
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowBenefitsModal(false); setBenefitsEditingTier(null); }}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={async () => {
                // Save only the benefits for the tier
                if (!benefitsEditingTier) return;
                try {
                  setIsLoading(true);
                  // call updateTier with only changed fields (map to API shape)
                  const payloadTier = { ...benefitsEditingTier };
                  // Ensure numeric conversions
                  payloadTier.diemToiThieu = Number(payloadTier.diemToiThieu) || 0;
                  // prefer sending icon; fallback to bieuTuong
                  payloadTier.icon = payloadTier.icon || payloadTier.bieuTuong;
                  payloadTier.vipBenefits = (payloadTier.uu_dai || []).map(b => ({
                    maVipBenefit: b.maVipBenefit,
                    benefitType: b.benefitType,
                    params: (typeof b.params === 'string') ? b.params : JSON.stringify(b.params || {}),
                    description: b.description || '',
                    active: b.active == null ? true : b.active
                  }));

                  const updated = await updateTier(payloadTier.maHang, payloadTier);
                  // update local state with server response (preferred)
                  setMembershipTiers(prev => prev.map(t => t.maHang === (updated.maHangThanhVien ?? payloadTier.maHang) ? mapMembershipTierFromApi(updated) : t));
                  setShowBenefitsModal(false);
                  setBenefitsEditingTier(null);
                  Toast.show('Lưu ưu đãi thành công', 'success');
                } catch (err) {
                  Toast.show(err.data?.message || 'Không thể lưu ưu đãi', 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Lưu
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Tier Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa hạng thành viên">
        {editingTier && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên hạng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingTier.tenHang}
                  onChange={(e) => setEditingTier({ ...editingTier, tenHang: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editingTier.trangThai}
                  onChange={(e) => setEditingTier({ ...editingTier, trangThai: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hoat_dong">Hoạt động</option>
                  <option value="tam_dung">Tạm dừng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm tối thiểu <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingTier.diemToiThieu}
                  onChange={(e) => setEditingTier({ ...editingTier, diemToiThieu: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* Điểm tối đa và Tỷ lệ hoàn điểm bị loại khỏi form (được quản lý bên VipBenefit) */}

              {/* Discount and min-order fields removed — managed by VipBenefit service */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <select
                  value={editingTier.mauSac}
                  onChange={(e) => setEditingTier({ ...editingTier, mauSac: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {colors.map(color => (
                    <option key={color} value={color}>
                      {color.replace('bg-', '').replace('-', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biểu tượng</label>
                <select
                  value={editingTier.bieuTuong}
                  onChange={(e) => setEditingTier({ ...editingTier, bieuTuong: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {icons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={editingTier.moTa}
                  onChange={(e) => setEditingTier({ ...editingTier, moTa: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ưu đãi</label>
                {editingTier.uu_dai.map((benefit, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 items-center border p-2 rounded-md">
                    <select
                      value={benefit.benefitType}
                      onChange={(e) => updateBenefit(editingTier.uu_dai, (benefits) => setEditingTier({ ...editingTier, uu_dai: benefits }), index, { ...benefit, benefitType: e.target.value })}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LEGACY_TEXT">Chuỗi mô tả (legacy)</option>
                      <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                      <option value="PERCENT_DISCOUNT">Giảm phần trăm</option>
                      <option value="BONUS_POINTS">Tích điểm</option>
                      <option value="PRIORITY_SHIPPING">Ưu tiên giao hàng</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        {renderParamsInput(benefit, index, editingTier.uu_dai, (b) => setEditingTier({ ...editingTier, uu_dai: b }))}
                        <div className="text-xs text-gray-500 mt-1 truncate">{formatBenefit(benefit)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBenefit(editingTier.uu_dai, (benefits) => setEditingTier({ ...editingTier, uu_dai: benefits }), index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Xóa ưu đãi"
                      >
                        <IoTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBenefit(editingTier.uu_dai, (benefits) => setEditingTier({ ...editingTier, uu_dai: benefits }))}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 mt-2"
                >
                  + Thêm ưu đãi
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleEditTier}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Tier Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết hạng thành viên">
        {selectedTier && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className={`${selectedTier.mauSac} p-4 rounded-lg text-white`}>
              <div className="flex items-center">
                <span className="text-3xl mr-3">{selectedTier.bieuTuong}</span>
                <div>
                  <h3 className="text-xl font-bold">{selectedTier.tenHang}</h3>
                  <p className="opacity-90">{selectedTier.maHang}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm yêu cầu</label>
                <p className="text-sm text-gray-900">{(Number(selectedTier.diemToiThieu) || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số thành viên</label>
                <p className="text-sm text-gray-900">{(Number(selectedTier.soThanhVien) || 0).toLocaleString()}</p>
              </div>
                {/* Tỷ lệ hoàn điểm không hiển thị ở đây (quản lý bởi VipBenefit) */}
              {/* Discount display removed — discounts are managed in VipBenefit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn mua hàng</label>
                <p className="text-sm text-gray-900">{formatCurrency(Number(selectedTier.gioiHanMuaHang) || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTier.trangThai)}`}>
                  {getStatusText(selectedTier.trangThai)}
                </span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <p className="text-sm text-gray-900">{selectedTier.moTa}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ưu đãi</label>
                <ul className="text-sm text-gray-900 space-y-1">
                  {selectedTier.uu_dai.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {formatBenefit(benefit)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>



      {/* Customers List Modal */}
      <Modal isOpen={showCustomersModal} onClose={() => { setShowCustomersModal(false); setSelectedTierCustomers([]); }} title="Danh sách khách hàng">
        <div className="space-y-4">
          {loadingCustomers ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Đang tải danh sách khách hàng...
            </div>
          ) : selectedTierCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có khách hàng nào trong hạng này
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm thưởng
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng chi tiêu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tham gia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTierCustomers.map((customer) => (
                    <tr key={customer.maKhachHang} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.hoTen}</div>
                        <div className="text-xs text-gray-500">ID: {customer.maKhachHang}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-xs text-gray-500">{customer.soDienThoai}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-blue-600">
                          {(Number(customer.diemThuong) || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">
                          {formatCurrency(Number(customer.tongChiTieu) || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {customer.ngayThamGia}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">Tổng số khách hàng:</span>
                  <span className="font-bold text-blue-900">{selectedTierCustomers.length} người</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="font-medium text-blue-900">Tổng điểm thưởng:</span>
                  <span className="font-bold text-blue-900">
                    {selectedTierCustomers.reduce((sum, c) => sum + (Number(c.diemThuong) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="font-medium text-blue-900">Tổng chi tiêu:</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(selectedTierCustomers.reduce((sum, c) => sum + (Number(c.tongChiTieu) || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-3 border-t border-gray-200">
            <button
              onClick={() => { setShowCustomersModal(false); setSelectedTierCustomers([]); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MembershipTierManagement;