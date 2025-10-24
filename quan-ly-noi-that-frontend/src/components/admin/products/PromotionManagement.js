import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoEye, IoGift, IoTime, IoCheckmark, IoClose } from 'react-icons/io5';
import api from '../../../api';

const PromotionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map promotion data from API
  const mapPromotionFromApi = (promotion) => ({
    id: promotion.maChuongTrinh || promotion.id,
    name: promotion.tenChuongTrinh || promotion.name,
    code: promotion.maCode || promotion.code,
    type: mapPromotionType(promotion.loaiGiamGia || promotion.type),
    value: promotion.giaTriGiam || promotion.value || 0,
    minOrder: promotion.giaTriDonHangToiThieu || promotion.minOrder || 0,
    maxDiscount: promotion.giaTriGiamToiDa || promotion.maxDiscount || 0,
    startDate: promotion.ngayBatDau || promotion.startDate,
    endDate: promotion.ngayKetThuc || promotion.endDate,
    usageLimit: promotion.soLuongToiDa || promotion.usageLimit || 0,
    usedCount: promotion.soLuongDaSuDung || promotion.usedCount || 0,
    status: promotion.trangThai || promotion.status || 'active',
    description: promotion.moTa || promotion.description || ''
  });

  const mapPromotionType = (type) => {
    const typeMap = {
      'PERCENTAGE': 'percentage',
      'FIXED': 'fixed'
    };
    return typeMap[type] || type;
  };

  // mapPromotionToApi kept out for now until API save is wired

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/chuongtrinh-giamgia'); // Fixed: aligned with backend endpoint
        if (Array.isArray(data)) {
          setPromotions(data.map(mapPromotionFromApi));
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [promotions, setPromotions] = useState([]);

  // route params (for direct edit/add links)
  const { id: routeId } = useParams() || {};
  const location = useLocation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    description: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'expired': return 'Hết hạn';
      case 'inactive': return 'Tạm dừng';
      default: return 'Không xác định';
    }
  };

  const getTypeText = (type) => {
    return type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định';
  };

  const handleAddPromotion = () => {
    const promotion = {
      id: promotions.length + 1,
      ...newPromotion,
      value: parseInt(newPromotion.value),
      minOrder: parseInt(newPromotion.minOrder),
      maxDiscount: parseInt(newPromotion.maxDiscount),
      usageLimit: parseInt(newPromotion.usageLimit),
      usedCount: 0,
      status: 'active'
    };
    setPromotions([...promotions, promotion]);
    setNewPromotion({
      name: '',
      code: '',
      type: 'percentage',
      value: '',
      minOrder: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      description: ''
    });
    setShowAddModal(false);
  };

  const handleDeletePromotion = (id) => {
    setPromotions(promotions.filter(promotion => promotion.id !== id));
  };

  const navigate = useNavigate();

  const handleEditPromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setShowEditModal(true);
    // push url so direct navigation works and modal state is reflected
    try {
      navigate(`/admin/promotions/${promotion.id}/edit`, { replace: false });
    } catch (e) {
      // ignore when navigate not available in tests
    }
  };

  const handleSaveEdit = () => {
    setPromotions(promotions.map(promotion => 
      promotion.id === selectedPromotion.id 
        ? { ...promotion, ...selectedPromotion }
        : promotion
    ));
    setShowEditModal(false);
    setSelectedPromotion(null);
    try { navigate('/admin/promotions'); } catch(e) {}
  };

  const handleViewPromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailModal(true);
  };

  // If user navigates directly to /admin/promotions/:id or /admin/promotions/:id/edit
  // open the edit modal and populate selectedPromotion. Also support /admin/promotions/add to
  // open create modal.
  useEffect(() => {
    // open add modal when path ends with /add
    if (location && location.pathname && location.pathname.endsWith('/add')) {
      setShowAddModal(true);
      return;
    }

    if (!routeId) return;

    // try to find in already fetched promotions
    const found = promotions.find(p => String(p.id) === String(routeId));
    if (found) {
      setSelectedPromotion(found);
      setShowEditModal(true);
      return;
    }

    // if not found in list (promotions might still be loading), fetch single promotion
    const fetchSingle = async () => {
      try {
        const data = await api.get(`/api/chuongtrinh-giamgia/${routeId}`);
        if (data) {
          const mapped = {
            id: data.maChuongTrinh || data.id,
            name: data.tenChuongTrinh || data.name,
            code: data.maCode || data.code,
            type: mapPromotionType(data.loaiGiamGia || data.type),
            value: data.giaTriGiam || data.value || 0,
            minOrder: data.giaTriDonHangToiThieu || data.minOrder || 0,
            maxDiscount: data.giaTriGiamToiDa || data.maxDiscount || 0,
            startDate: data.ngayBatDau || data.startDate,
            endDate: data.ngayKetThuc || data.endDate,
            usageLimit: data.soLuongToiDa || data.usageLimit || 0,
            usedCount: data.soLuongDaSuDung || data.usedCount || 0,
            status: data.trangThai || data.status || 'active',
            description: data.moTa || data.description || ''
          };
          setSelectedPromotion(mapped);
          setShowEditModal(true);
        }
      } catch (err) {
        
      }
    };

    fetchSingle();
  }, [routeId, promotions, location]);

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || promotion.status === selectedStatus;
    const matchesType = selectedType === 'all' || promotion.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Khuyến mãi</h1>
          <p className="text-gray-600">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoGift className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng khuyến mãi</p>
                <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmark className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotions.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <IoTime className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotions.filter(p => {
                    const endDate = new Date(p.endDate);
                    const today = new Date();
                    const diffTime = endDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7 && diffDays > 0;
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoClose className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hết hạn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotions.filter(p => p.status === 'expired').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khuyến mãi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="expired">Hết hạn</option>
                <option value="inactive">Tạm dừng</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả loại</option>
                <option value="percentage">Phần trăm</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>

            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <IoAdd className="w-5 h-5" />
              Tạo khuyến mãi
            </button>
          </div>
        </div>

        {/* Promotions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khuyến mãi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại & Giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng tối thiểu
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {promotion.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {promotion.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {promotion.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getTypeText(promotion.type)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {promotion.type === 'percentage' 
                          ? `${promotion.value}%` 
                          : `${promotion.value.toLocaleString('vi-VN')}đ`
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promotion.minOrder.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {promotion.usedCount}/{promotion.usageLimit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(promotion.usedCount / promotion.usageLimit) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{promotion.startDate}</div>
                      <div>đến {promotion.endDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promotion.status)}`}>
                        {getStatusText(promotion.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPromotion(promotion)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <IoEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPromotion(promotion)}
                          className="text-green-600 hover:text-green-800"
                          title="Chỉnh sửa"
                        >
                          <IoCreate className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promotion.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <IoTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Promotion Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Tạo khuyến mãi mới</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khuyến mãi
                  </label>
                  <input
                    type="text"
                    value={newPromotion.name}
                    onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tên khuyến mãi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã code
                  </label>
                  <input
                    type="text"
                    value={newPromotion.code}
                    onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập mã code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại khuyến mãi
                  </label>
                  <select
                    value={newPromotion.type}
                    onChange={(e) => setNewPromotion({...newPromotion, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="percentage">Phần trăm</option>
                    <option value="fixed">Số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị
                  </label>
                  <input
                    type="number"
                    value={newPromotion.value}
                    onChange={(e) => setNewPromotion({...newPromotion, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={newPromotion.type === 'percentage' ? 'Nhập %' : 'Nhập số tiền'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newPromotion.minOrder}
                    onChange={(e) => setNewPromotion({...newPromotion, minOrder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số tiền tối thiểu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newPromotion.maxDiscount}
                    onChange={(e) => setNewPromotion({...newPromotion, maxDiscount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số tiền giảm tối đa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới hạn sử dụng
                  </label>
                  <input
                    type="number"
                    value={newPromotion.usageLimit}
                    onChange={(e) => setNewPromotion({...newPromotion, usageLimit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số lần sử dụng tối đa"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập mô tả khuyến mãi"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddPromotion}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Tạo khuyến mãi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Detail Modal */}
        {showDetailModal && selectedPromotion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Chi tiết khuyến mãi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedPromotion.name}</h4>
                    <p className="text-gray-600">{selectedPromotion.description}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Mã code: </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {selectedPromotion.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Loại: </span>
                    <span className="text-sm font-medium">{getTypeText(selectedPromotion.type)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Giá trị: </span>
                    <span className="text-sm font-medium">
                      {selectedPromotion.type === 'percentage' 
                        ? `${selectedPromotion.value}%` 
                        : `${selectedPromotion.value.toLocaleString('vi-VN')}đ`
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Đơn hàng tối thiểu: </span>
                    <span className="text-sm font-medium">{selectedPromotion.minOrder.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Giảm tối đa: </span>
                    <span className="text-sm font-medium">{selectedPromotion.maxDiscount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Sử dụng: </span>
                    <span className="text-sm font-medium">{selectedPromotion.usedCount}/{selectedPromotion.usageLimit}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Thời gian: </span>
                    <span className="text-sm font-medium">{selectedPromotion.startDate} - {selectedPromotion.endDate}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Trạng thái: </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPromotion.status)}`}>
                      {getStatusText(selectedPromotion.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Promotion Modal */}
        {showEditModal && selectedPromotion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa khuyến mãi</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên khuyến mãi
                    </label>
                    <input
                      type="text"
                      value={selectedPromotion.name}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã code
                    </label>
                    <input
                      type="text"
                      value={selectedPromotion.code}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại khuyến mãi
                    </label>
                    <select
                      value={selectedPromotion.type}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="percentage">Phần trăm</option>
                      <option value="fixed">Giảm giá cố định</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị
                    </label>
                    <input
                      type="number"
                      value={selectedPromotion.value}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, value: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn hàng tối thiểu (đ)
                    </label>
                    <input
                      type="number"
                      value={selectedPromotion.minOrder}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, minOrder: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giảm tối đa (đ)
                    </label>
                    <input
                      type="number"
                      value={selectedPromotion.maxDiscount}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, maxDiscount: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={selectedPromotion.startDate}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={selectedPromotion.endDate}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giới hạn sử dụng
                    </label>
                    <input
                      type="number"
                      value={selectedPromotion.usageLimit}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, usageLimit: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={selectedPromotion.status}
                      onChange={(e) => setSelectedPromotion({...selectedPromotion, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={selectedPromotion.description}
                    onChange={(e) => setSelectedPromotion({...selectedPromotion, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    try { navigate('/admin/promotions'); } catch(e) {}
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionManagement;

