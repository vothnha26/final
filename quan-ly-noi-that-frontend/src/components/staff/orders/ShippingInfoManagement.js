import React, { useState, useEffect } from 'react';
import { IoAdd, IoCreate, IoTrash, IoEye, IoSearch, IoFilter, IoDownload, IoLocation, IoCall, IoCar, IoCheckmarkCircle, IoTime, IoCloseCircle } from 'react-icons/io5';
import Modal from '../shared/Modal';
import Toast from '../shared/Toast';
import api from '../../../api';

// Mapping functions for Vietnamese API field names
const mapShippingInfoFromApi = (info) => ({
  maThongTin: info.ma_thong_tin,
  maDonHang: info.ma_don_hang,
  tenKhachHang: info.ten_khach_hang,
  diaChiGiaoHang: info.dia_chi_giao_hang,
  soDienThoai: info.so_dien_thoai,
  nguoiNhan: info.nguoi_nhan,
  donViVanChuyen: info.don_vi_van_chuyen,
  maVanDon: info.ma_van_don,
  trangThai: info.trang_thai,
  ngayGui: info.ngay_gui,
  ngayGiaoHang: info.ngay_giao_hang,
  phiVanChuyen: info.phi_van_chuyen,
  trongLuong: info.trong_luong,
  kichThuoc: info.kich_thuoc,
  ghiChu: info.ghi_chu,
  lichSuVanChuyen: info.lich_su_van_chuyen || []
});

const mapShippingInfoToApi = (info) => ({
  ma_don_hang: info.maDonHang,
  ten_khach_hang: info.tenKhachHang,
  dia_chi_giao_hang: info.diaChiGiaoHang,
  so_dien_thoai: info.soDienThoai,
  nguoi_nhan: info.nguoiNhan,
  don_vi_van_chuyen: info.donViVanChuyen,
  ma_van_don: info.maVanDon,
  trang_thai: info.trangThai,
  ngay_gui: info.ngayGui,
  ngay_giao_hang: info.ngayGiaoHang,
  phi_van_chuyen: info.phiVanChuyen,
  trong_luong: info.trongLuong,
  kich_thuoc: info.kichThuoc,
  ghi_chu: info.ghiChu
});

const ShippingInfoManagement = () => {
  const [shippingInfos, setShippingInfos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API Functions
  const fetchShippingInfos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/thong-tin-giao-hang');
      setShippingInfos(response.data.map(mapShippingInfoFromApi));
    } catch (error) {
      setError('Không thể tải thông tin giao hàng');
    } finally {
      setLoading(false);
    }
  };

  const createShippingInfo = async (infoData) => {
    try {
      const response = await api.post('/api/v1/thong-tin-giao-hang', mapShippingInfoToApi(infoData));
      return mapShippingInfoFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể tạo thông tin giao hàng');
    }
  };

  const updateShippingInfo = async (id, infoData) => {
    try {
      const response = await api.put(`/api/v1/thong-tin-giao-hang/${id}`, mapShippingInfoToApi(infoData));
      return mapShippingInfoFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể cập nhật thông tin giao hàng');
    }
  };

  const updateShippingStatus = async (id, status) => {
    try {
      const response = await api.put(`/api/v1/thong-tin-giao-hang/${id}/trang-thai`, { trang_thai: status });
      return mapShippingInfoFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể cập nhật trạng thái giao hàng');
    }
  };

  const deleteShippingInfo = async (id) => {
    try {
      await api.delete(`/api/v1/thong-tin-giao-hang/${id}`);
    } catch (error) {
      throw new Error('Không thể xóa thông tin giao hàng');
    }
  };

  useEffect(() => {
    fetchShippingInfos();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCarrier, setFilterCarrier] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [editingInfo, setEditingInfo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [infoToDelete, setInfoToDelete] = useState(null);

  const [newInfo, setNewInfo] = useState({
    maDonHang: '',
    tenKhachHang: '',
    diaChiGiaoHang: '',
    soDienThoai: '',
    nguoiNhan: '',
    donViVanChuyen: 'Giao Hàng Nhanh',
    maVanDon: '',
    trangThai: 'cho_giao',
    phiVanChuyen: '',
    thoiGianDuKien: '',
    ghiChu: ''
  });

  // Filter shipping infos
  const filteredInfos = shippingInfos.filter(info => {
    const matchesSearch = info.tenKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         info.maDonHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         info.maVanDon.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         info.nguoiNhan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || info.trangThai === filterStatus;
    const matchesCarrier = filterCarrier === 'all' || info.donViVanChuyen === filterCarrier;
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  // Statistics
  const stats = {
    total: shippingInfos.length,
    pending: shippingInfos.filter(info => info.trangThai === 'cho_giao').length,
    shipping: shippingInfos.filter(info => info.trangThai === 'dang_giao').length,
    delivered: shippingInfos.filter(info => info.trangThai === 'da_giao').length,
    failed: shippingInfos.filter(info => info.trangThai === 'that_bai').length,
    totalFee: shippingInfos.reduce((sum, info) => sum + info.phiVanChuyen, 0)
  };

  const carriers = [
    'Giao Hàng Nhanh',
    'Viettel Post',
    'J&T Express',
    'Shopee Express',
    'Ninja Van',
    'BEST Express',
    'Kerry Express'
  ];

  const handleAddInfo = () => {
    if (!newInfo.maDonHang || !newInfo.tenKhachHang || !newInfo.diaChiGiaoHang || !newInfo.soDienThoai) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    const info = {
      maThongTin: `TT${String(shippingInfos.length + 1).padStart(3, '0')}`,
      ...newInfo,
      phiVanChuyen: parseFloat(newInfo.phiVanChuyen) || 0,
      thoiGianGiao: null,
      nguoiTao: 'Huy'
    };

    setShippingInfos([...shippingInfos, info]);
    setNewInfo({
      maDonHang: '',
      tenKhachHang: '',
      diaChiGiaoHang: '',
      soDienThoai: '',
      nguoiNhan: '',
      donViVanChuyen: 'Giao Hàng Nhanh',
      maVanDon: '',
      trangThai: 'cho_giao',
      phiVanChuyen: '',
      thoiGianDuKien: '',
      ghiChu: ''
    });
    setShowAddModal(false);
    Toast.show('Thêm thông tin giao hàng thành công', 'success');
  };

  const handleEditInfo = () => {
    if (!editingInfo.maDonHang || !editingInfo.tenKhachHang || !editingInfo.diaChiGiaoHang || !editingInfo.soDienThoai) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    setShippingInfos(shippingInfos.map(info => 
      info.maThongTin === editingInfo.maThongTin 
        ? { ...editingInfo, phiVanChuyen: parseFloat(editingInfo.phiVanChuyen) || 0 }
        : info
    ));
    setShowEditModal(false);
    setEditingInfo(null);
    Toast.show('Cập nhật thông tin giao hàng thành công', 'success');
  };

  const handleDeleteInfo = () => {
    setShippingInfos(shippingInfos.filter(info => info.maThongTin !== infoToDelete));
    setShowDeleteConfirm(false);
    setInfoToDelete(null);
    Toast.show('Xóa thông tin giao hàng thành công', 'success');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'cho_giao': return 'bg-yellow-100 text-yellow-800';
      case 'dang_giao': return 'bg-blue-100 text-blue-800';
      case 'da_giao': return 'bg-green-100 text-green-800';
      case 'that_bai': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'cho_giao': return 'Chờ giao';
      case 'dang_giao': return 'Đang giao';
      case 'da_giao': return 'Đã giao';
      case 'that_bai': return 'Thất bại';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cho_giao': return <IoTime className="w-4 h-4 text-yellow-600" />;
      case 'dang_giao': return <IoCar className="w-4 h-4 text-blue-600" />;
      case 'da_giao': return <IoCheckmarkCircle className="w-4 h-4 text-green-600" />;
      case 'that_bai': return <IoCloseCircle className="w-4 h-4 text-red-600" />;
      default: return <IoLocation className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý thông tin giao hàng</h1>
        <p className="text-gray-600">Theo dõi và quản lý thông tin giao hàng đơn hàng</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <IoLocation className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Tổng đơn</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
              <IoTime className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Chờ giao</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <IoCar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.shipping}</p>
              <p className="text-sm text-gray-500">Đang giao</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <IoCheckmarkCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Đã giao</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <IoCloseCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              <p className="text-sm text-gray-500">Thất bại</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <IoCall className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalFee)}</p>
              <p className="text-sm text-gray-500">Tổng phí VC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 sm:max-w-md">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm đơn hàng, khách hàng..."
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
                <option value="cho_giao">Chờ giao</option>
                <option value="dang_giao">Đang giao</option>
                <option value="da_giao">Đã giao</option>
                <option value="that_bai">Thất bại</option>
              </select>
            </div>

            <div className="relative">
              <IoCar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterCarrier}
                onChange={(e) => setFilterCarrier(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tất cả đối tác VC</option>
                {carriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <IoAdd className="w-4 h-4" />
              Thêm thông tin
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <IoDownload className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Shipping Info Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã TT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng / Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin giao hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đối tác vận chuyển
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phí VC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInfos.map((info) => (
                <tr key={info.maThongTin} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{info.maThongTin}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{info.maDonHang}</div>
                      <div className="text-sm text-gray-500">{info.tenKhachHang}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900 font-medium">{info.nguoiNhan}</div>
                      <div className="text-sm text-gray-500">{info.soDienThoai}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={info.diaChiGiaoHang}>
                        {info.diaChiGiaoHang}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{info.donViVanChuyen}</div>
                      {info.maVanDon && (
                        <div className="text-sm text-gray-500">{info.maVanDon}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(info.trangThai)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(info.trangThai)}`}>
                        {getStatusText(info.trangThai)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(info.phiVanChuyen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>DK: {info.thoiGianDuKien}</div>
                      {info.thoiGianGiao && (
                        <div className="text-green-600">TT: {info.thoiGianGiao}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedInfo(info);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        <IoEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingInfo({...info, phiVanChuyen: info.phiVanChuyen.toString()});
                          setShowEditModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Chỉnh sửa"
                      >
                        <IoCreate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setInfoToDelete(info.maThongTin);
                          setShowDeleteConfirm(true);
                        }}
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

        {filteredInfos.length === 0 && (
          <div className="text-center py-12">
            <IoLocation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy thông tin giao hàng</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc thêm thông tin mới</p>
          </div>
        )}
      </div>

      {/* Add Info Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm thông tin giao hàng">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã đơn hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newInfo.maDonHang}
                onChange={(e) => setNewInfo({...newInfo, maDonHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã đơn hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newInfo.tenKhachHang}
                onChange={(e) => setNewInfo({...newInfo, tenKhachHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên khách hàng"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ giao hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newInfo.diaChiGiaoHang}
                onChange={(e) => setNewInfo({...newInfo, diaChiGiaoHang: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập địa chỉ giao hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newInfo.soDienThoai}
                onChange={(e) => setNewInfo({...newInfo, soDienThoai: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người nhận</label>
              <input
                type="text"
                value={newInfo.nguoiNhan}
                onChange={(e) => setNewInfo({...newInfo, nguoiNhan: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên người nhận"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị vận chuyển</label>
              <select
                value={newInfo.donViVanChuyen}
                onChange={(e) => setNewInfo({...newInfo, donViVanChuyen: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {carriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã vận đơn</label>
              <input
                type="text"
                value={newInfo.maVanDon}
                onChange={(e) => setNewInfo({...newInfo, maVanDon: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã vận đơn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển (VND)</label>
              <input
                type="number"
                value={newInfo.phiVanChuyen}
                onChange={(e) => setNewInfo({...newInfo, phiVanChuyen: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập phí vận chuyển"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian dự kiến</label>
              <input
                type="datetime-local"
                value={newInfo.thoiGianDuKien}
                onChange={(e) => setNewInfo({...newInfo, thoiGianDuKien: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={newInfo.trangThai}
                onChange={(e) => setNewInfo({...newInfo, trangThai: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cho_giao">Chờ giao</option>
                <option value="dang_giao">Đang giao</option>
                <option value="da_giao">Đã giao</option>
                <option value="that_bai">Thất bại</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                value={newInfo.ghiChu}
                onChange={(e) => setNewInfo({...newInfo, ghiChu: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập ghi chú"
              />
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
              onClick={handleAddInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Thêm thông tin
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Info Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa thông tin giao hàng">
        {editingInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingInfo.maDonHang}
                  onChange={(e) => setEditingInfo({...editingInfo, maDonHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingInfo.tenKhachHang}
                  onChange={(e) => setEditingInfo({...editingInfo, tenKhachHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingInfo.diaChiGiaoHang}
                  onChange={(e) => setEditingInfo({...editingInfo, diaChiGiaoHang: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editingInfo.soDienThoai}
                  onChange={(e) => setEditingInfo({...editingInfo, soDienThoai: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người nhận</label>
                <input
                  type="text"
                  value={editingInfo.nguoiNhan}
                  onChange={(e) => setEditingInfo({...editingInfo, nguoiNhan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị vận chuyển</label>
                <select
                  value={editingInfo.donViVanChuyen}
                  onChange={(e) => setEditingInfo({...editingInfo, donViVanChuyen: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {carriers.map(carrier => (
                    <option key={carrier} value={carrier}>{carrier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã vận đơn</label>
                <input
                  type="text"
                  value={editingInfo.maVanDon || ''}
                  onChange={(e) => setEditingInfo({...editingInfo, maVanDon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển (VND)</label>
                <input
                  type="number"
                  value={editingInfo.phiVanChuyen}
                  onChange={(e) => setEditingInfo({...editingInfo, phiVanChuyen: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian dự kiến</label>
                <input
                  type="datetime-local"
                  value={editingInfo.thoiGianDuKien}
                  onChange={(e) => setEditingInfo({...editingInfo, thoiGianDuKien: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editingInfo.trangThai}
                  onChange={(e) => setEditingInfo({...editingInfo, trangThai: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cho_giao">Chờ giao</option>
                  <option value="dang_giao">Đang giao</option>
                  <option value="da_giao">Đã giao</option>
                  <option value="that_bai">Thất bại</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={editingInfo.ghiChu}
                  onChange={(e) => setEditingInfo({...editingInfo, ghiChu: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                onClick={handleEditInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Info Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết thông tin giao hàng">
        {selectedInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã thông tin</label>
                <p className="text-sm text-gray-900">{selectedInfo.maThongTin}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <p className="text-sm text-gray-900">{selectedInfo.maDonHang}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                <p className="text-sm text-gray-900">{selectedInfo.tenKhachHang}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người nhận</label>
                <p className="text-sm text-gray-900">{selectedInfo.nguoiNhan}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <p className="text-sm text-gray-900">{selectedInfo.soDienThoai}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị vận chuyển</label>
                <p className="text-sm text-gray-900">{selectedInfo.donViVanChuyen}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                <p className="text-sm text-gray-900">{selectedInfo.diaChiGiaoHang}</p>
              </div>
              {selectedInfo.maVanDon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã vận đơn</label>
                  <p className="text-sm text-gray-900">{selectedInfo.maVanDon}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <div className="flex items-center">
                  {getStatusIcon(selectedInfo.trangThai)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInfo.trangThai)}`}>
                    {getStatusText(selectedInfo.trangThai)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedInfo.phiVanChuyen)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian dự kiến</label>
                <p className="text-sm text-gray-900">{selectedInfo.thoiGianDuKien}</p>
              </div>
              {selectedInfo.thoiGianGiao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian giao thực tế</label>
                  <p className="text-sm text-green-600">{selectedInfo.thoiGianGiao}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo</label>
                <p className="text-sm text-gray-900">{selectedInfo.nguoiTao}</p>
              </div>
              {selectedInfo.ghiChu && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <p className="text-sm text-gray-900">{selectedInfo.ghiChu}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Xác nhận xóa">
        <div className="space-y-4">
          <p className="text-gray-700">Bạn có chắc chắn muốn xóa thông tin giao hàng này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteInfo}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShippingInfoManagement;

