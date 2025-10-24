import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCreate,
  IoSave,
  IoClose,
  IoCheckmarkCircle,
  IoStar,
  IoWarning,
  IoReceipt,
  IoWallet,
  IoTrophy,
  IoGift,
  IoTrendingUp,
  IoCalendar,
  IoArrowForward,
  IoShieldCheckmark,
  IoNotifications
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'male',
    vipLevel: '', // will be set from maHang
    joinDate: '',
    totalOrders: 0,
    totalSpent: 0,
    avatar: 'https://via.placeholder.com/150',
    rewardPoints: 0 // will be set from khach hang
  });

  const [editProfile, setEditProfile] = useState(profile);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({
    completedOrders: 0,
    pendingOrders: 0,
    canceledOrders: 0,
    rewardPoints: 0
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setLoading(true);
        try {
          // Fetch fresh customer data from API
          const freshCustomerData = await api.get('/api/v1/khach-hang/me');

          const customerData = freshCustomerData?.data || freshCustomerData;

          const userProfile = {
            name: customerData.hoTen || customerData.tenKhachHang || user.hoTen || user.name || '',
            email: customerData.email || user.email || '',
            phone: customerData.soDienThoai || user.soDienThoai || user.phone || '',
            address: customerData.diaChi || user.diaChi || user.address || '',
            dateOfBirth: customerData.ngaySinh || user.ngaySinh || user.dateOfBirth || '',
            gender: customerData.gioiTinh || user.gioiTinh || user.gender || 'male',
            vipLevel: customerData.hangThanhVien?.maHangThanhVien || '',
            hangThanhVien: customerData.hangThanhVien || null,
            joinDate: customerData.ngayThamGia || customerData.ngayTaoTaiKhoan || customerData.createdAt || user.ngayThamGia || user.createdAt || new Date().toISOString().split('T')[0],
            totalOrders: Number(customerData.tongDonHang || customerData.totalOrders || 0),
            totalSpent: Number(customerData.tongChiTieu || customerData.totalSpent || 0),
            avatar: customerData.avatar || customerData.hinhAnh || user.avatar || 'https://via.placeholder.com/150',
            rewardPoints: Number(customerData.diemThuong || 0)
          };

          setProfile(userProfile);
          setEditProfile(userProfile);

          // Fetch orders
          try {
            const customerId = customerData.maKhachHang || user.maKhachHang;

            if (customerId) {
              const ordersResponse = await api.get(`/api/v1/khach-hang/${customerId}/don-hang?limit=5&sort=desc`);

              // Try to get the array of orders from possible response shapes
              let orders = [];
              if (Array.isArray(ordersResponse)) {
                orders = ordersResponse;
              } else if (ordersResponse && Array.isArray(ordersResponse.data)) {
                orders = ordersResponse.data;
              } else if (ordersResponse && Array.isArray(ordersResponse.data?.orders)) {
                orders = ordersResponse.data.orders;
              } else if (ordersResponse && Array.isArray(ordersResponse.orders)) {
                orders = ordersResponse.orders;
              }
              // Fallback: if still not array, try to convert object values to array
              if (!Array.isArray(orders) && orders && typeof orders === 'object') {
                orders = Object.values(orders);
              }
              if (!Array.isArray(orders)) orders = [];

              setRecentOrders(orders.slice(0, 5));

              const completed = orders.filter(o => o.trangThai === 'HOAN_THANH').length;
              const pending = orders.filter(o => o.trangThai === 'CHO_XU_LY' || o.trangThai === 'DANG_XU_LY').length;
              const canceled = orders.filter(o => o.trangThai === 'DA_HUY').length;

              setStats({
                completedOrders: completed,
                pendingOrders: pending,
                canceledOrders: canceled,
                rewardPoints: userProfile.rewardPoints
              });
            }
          } catch (err) {

          }
        } catch (err) {
          setError('Không thể tải thông tin người dùng');
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Lấy label và màu từ dữ liệu backend (tenHang, mauSac)
  const gradients = [
    'from-orange-400 to-orange-600',
    'from-gray-200 to-gray-400', // brighter for silver
    'from-yellow-400 to-yellow-600',
    'from-purple-400 to-purple-600',
    'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600'
  ];

  function getRandomGradient() {
    return gradients[Math.floor(Math.random() * gradients.length)];
  }

  const getVipInfo = (hangThanhVien) => {
    if (!hangThanhVien) return { label: 'Chưa xác định', gradient: getRandomGradient() };
    let gradient = getRandomGradient();
    if (hangThanhVien.mauSac) {
      if (hangThanhVien.mauSac.startsWith('bg-')) {
        gradient = `${hangThanhVien.mauSac} to-${hangThanhVien.mauSac.replace('bg-', '')}`;
      } else {
        gradient = hangThanhVien.mauSac;
      }
    }
    return {
      label: hangThanhVien.tenHang || 'Chưa xác định',
      gradient
    };
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0 ₫';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numPrice);
  };

  const handleEdit = () => {
    setEditProfile(profile);
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        hoTen: editProfile.name,
        email: editProfile.email,
        soDienThoai: editProfile.phone,
        diaChi: editProfile.address,
        ngaySinh: editProfile.dateOfBirth || null,
        gioiTinh: editProfile.gender
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        setProfile(editProfile);
        setIsEditing(false);
        setSuccess('Cập nhật thông tin thành công!');
        await refreshUser();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setEditProfile(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'CHO_XU_LY': 'bg-blue-100 text-blue-700',
      'DANG_GIAO_HANG': 'bg-yellow-100 text-yellow-700',
      'DA_GIAO_HANG': 'bg-orange-100 text-orange-700',
      'HOAN_THANH': 'bg-green-100 text-green-700',
      'DA_HUY': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'CHO_XU_LY': 'Chờ xử lý',
      'DANG_GIAO_HANG': 'Đang giao',
      'DA_GIAO_HANG': 'Đã giao',
      'HOAN_THANH': 'Hoàn thành',
      'DA_HUY': 'Đã hủy'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin và theo dõi hoạt động của bạn</p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-fadeIn">
            <IoCheckmarkCircle className="w-6 h-6" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-fadeIn">
            <IoWarning className="w-6 h-6" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Orders */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <IoReceipt className="w-6 h-6" />
                  </div>
                  <IoTrendingUp className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">Tổng đơn hàng</p>
                <p className="text-3xl font-bold">{profile.totalOrders}</p>
                <button
                  onClick={() => navigate('/orders')}
                  className="mt-3 text-xs flex items-center gap-1 hover:gap-2 transition-all opacity-90 hover:opacity-100"
                >
                  Xem tất cả <IoArrowForward />
                </button>
              </div>

              {/* Total Spent */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <IoWallet className="w-6 h-6" />
                  </div>
                  <IoTrendingUp className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">Tổng chi tiêu</p>
                <p className="text-2xl font-bold">{formatPrice(profile.totalSpent)}</p>
                <p className="text-xs opacity-75 mt-1">+12% so với tháng trước</p>
              </div>

              {/* Reward Points */}
              <div
                onClick={() => navigate('/profile/benefits')}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <IoGift className="w-6 h-6" />
                  </div>
                  <IoTrophy className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">Điểm tích lũy</p>
                <p className="text-3xl font-bold">{profile.rewardPoints || stats.rewardPoints}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/profile/benefits');
                  }}
                  className="mt-3 text-xs flex items-center gap-1 hover:gap-2 transition-all opacity-90 hover:opacity-100"
                >
                  Xem ưu đãi <IoArrowForward />
                </button>
              </div>

              {/* VIP Status */}
              <div
                onClick={() => navigate('/profile/benefits?tab=membership')}
                className={`bg-gradient-to-br ${getVipInfo(profile.hangThanhVien).gradient} rounded-xl shadow-lg p-6 text-gray-900 transform hover:scale-105 transition-transform cursor-pointer`}
                style={{ color: '#222' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <IoShieldCheckmark className="w-6 h-6" />
                  </div>
                  <span className="text-2xl">👑</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Hạng thành viên</p>
                <p className="text-3xl font-bold">{getVipInfo(profile.hangThanhVien).label}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/profile/benefits?tab=membership');
                  }}
                  className="mt-3 text-xs flex items-center gap-1 hover:gap-2 transition-all opacity-90 hover:opacity-100"
                >
                  Xem chi tiết <IoArrowForward />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Info */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Thông tin cá nhân</h2>
                    {!isEditing && (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                      >
                        <IoCreate className="w-4 h-4" />
                        Chỉnh sửa
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                            <input
                              type="text"
                              value={editProfile.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nhập họ tên"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input
                              type="email"
                              value={editProfile.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                            <input
                              type="tel"
                              value={editProfile.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0912345678"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                            <input
                              type="date"
                              value={editProfile.dateOfBirth}
                              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                          <select
                            value={editProfile.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                          <textarea
                            value={editProfile.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nhập địa chỉ chi tiết"
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <IoSave className="w-5 h-5" />
                                Lưu thay đổi
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            <IoClose className="w-5 h-5 inline mr-2" />
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Họ và tên</label>
                            <p className="text-gray-900 font-medium">{profile.name}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Email</label>
                            <p className="text-gray-900 font-medium">{profile.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Số điện thoại</label>
                            <p className="text-gray-900 font-medium">{profile.phone}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Ngày sinh</label>
                            <p className="text-gray-900 font-medium flex items-center gap-2">
                              <IoCalendar className="text-gray-400" />
                              {profile.dateOfBirth || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Giới tính</label>
                            <p className="text-gray-900 font-medium">
                              {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Tham gia từ</label>
                            <p className="text-gray-900 font-medium flex items-center gap-2">
                              <IoCalendar className="text-gray-400" />
                              {new Date(profile.joinDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">Địa chỉ</label>
                          <p className="text-gray-900 font-medium">{profile.address || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <IoReceipt className="w-5 h-5" />
                      Đơn hàng gần đây
                    </h2>
                    <button
                      onClick={() => navigate('/orders')}
                      className="text-sm text-white/90 hover:text-white flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Xem tất cả <IoArrowForward />
                    </button>
                  </div>

                  <div className="p-6">
                    {recentOrders.length > 0 ? (
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <div
                            key={order.maDonHang || order.id}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/orders/${order.maDonHang || order.id}`)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-gray-900">#{order.maDonHang || order.id}</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.trangThai || order.status)}`}>
                                  {getStatusLabel(order.trangThai || order.status)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <IoCalendar className="w-4 h-4" />
                                {order.ngayDatHangStr || (order.ngayDatHang ? new Date(order.ngayDatHang).toLocaleDateString('vi-VN') : order.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">
                                {formatPrice(order.thanhTien || order.tongTien || order.total)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IoReceipt className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">Chưa có đơn hàng nào</p>
                        <button
                          onClick={() => navigate('/shop')}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Khám phá sản phẩm
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <IoTrendingUp className="w-5 h-5" />
                      Thống kê nhanh
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Đơn hoàn thành</span>
                      <span className="text-lg font-bold text-green-600">{stats.completedOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm text-gray-600">Đơn đang xử lý</span>
                      <span className="text-lg font-bold text-yellow-600">{stats.pendingOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-600">Đơn đã hủy</span>
                      <span className="text-lg font-bold text-red-600">{stats.canceledOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <IoStar className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-gray-600">Đánh giá TB</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">4.8</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white">Thao tác nhanh</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <button
                      onClick={() => navigate('/orders')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all group"
                    >
                      <span className="flex items-center gap-3 text-gray-700">
                        <IoReceipt className="w-5 h-5 text-blue-500" />
                        Lịch sử đơn hàng
                      </span>
                      <IoArrowForward className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigate('/favorites')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 rounded-lg transition-all group"
                    >
                      <span className="flex items-center gap-3 text-gray-700">
                        <IoStar className="w-5 h-5 text-pink-500" />
                        Sản phẩm yêu thích
                      </span>
                      <IoArrowForward className="text-pink-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigate('/profile/benefits')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-all group"
                    >
                      <span className="flex items-center gap-3 text-gray-700">
                        <IoGift className="w-5 h-5 text-purple-500" />
                        Ưu đãi & Khuyến mãi
                      </span>
                      <IoArrowForward className="text-purple-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigate('/notifications')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-lg transition-all group"
                    >
                      <span className="flex items-center gap-3 text-gray-700">
                        <IoNotifications className="w-5 h-5 text-yellow-500" />
                        Thông báo
                      </span>
                      <IoArrowForward className="text-yellow-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
