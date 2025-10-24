import React, { useState, useEffect } from 'react';
import { IoAdd, IoCreate, IoTrash, IoEye, IoSearch, IoFilter, IoDownload, IoTrendingUp, IoTrendingDown, IoGift, IoPerson, IoTime } from 'react-icons/io5';
import Modal from './Modal';
import Toast from './Toast';
import api from '../api';

const LoyaltyPointsHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map loyalty points data from API
  const mapPointsHistoryFromApi = (history) => ({
    maLichSu: history.maLichSu || history.id,
    maKhachHang: history.khachHang?.maKhachHang || history.customerId,
    tenKhachHang: history.khachHang?.hoTen || history.customerName,
    loaiGiaoDich: mapTransactionType(history.loaiGiaoDich || history.type),
    soLuongDiem: history.soLuongDiem || history.points || 0,
    lyDo: history.lyDo || history.reason || '',
    maDonHang: history.donHang?.maDonHang || history.orderId || '',
    trangThai: mapTransactionStatus(history.trangThai || history.status),
    ngayTao: history.ngayTao || history.createdAt || '',
    ngayHetHan: history.ngayHetHan || history.expiredAt || ''
  });

  const mapTransactionType = (type) => {
    const typeMap = {
      'Tích điểm': 'earn',
      'Sử dụng điểm': 'redeem',
      'Điều chỉnh': 'adjust',
      'Hết hạn': 'expire'
    };
    return typeMap[type] || type;
  };

  const mapTransactionStatus = (status) => {
    const statusMap = {
      'Hoàn thành': 'completed',
      'Đang xử lý': 'processing',
      'Đã hủy': 'cancelled'
    };
    return statusMap[status] || status;
  };

  // Fetch loyalty points history
  useEffect(() => {
    const fetchPointsHistory = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/v1/khach-hang/lich-su-diem');
        if (Array.isArray(data)) {
          setPointsHistory(data.map(mapPointsHistoryFromApi));
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPointsHistory();
  }, []);

  const [pointsHistory, setPointsHistory] = useState([
    {
      maLichSu: 'LS001',
      maKhachHang: 'KH001',
      tenKhachHang: 'Nguyễn Văn An',
      loaiGiaoDich: 'earn',
      soLuongDiem: 500,
      lyDo: 'Mua sắm đơn hàng DH001',
      maDonHang: 'DH001',
      trangThai: 'hoan_thanh',
      ngayTao: '2024-01-15 10:30:00',
      ngayHetHan: '2024-07-15',
      nguoiXuLy: 'Hệ thống'
    },
    {
      maLichSu: 'LS002',
      maKhachHang: 'KH001',
      tenKhachHang: 'Nguyễn Văn An',
      loaiGiaoDich: 'redeem',
      soLuongDiem: -200,
      lyDo: 'Đổi voucher giảm giá 10%',
      maVoucher: 'VC001',
      trangThai: 'hoan_thanh',
      ngayTao: '2024-01-14 16:20:00',
      nguoiXuLy: 'Nhã'
    },
    {
      maLichSu: 'LS003',
      maKhachHang: 'KH002',
      tenKhachHang: 'Trần Thị Bình',
      loaiGiaoDich: 'earn',
      soLuongDiem: 800,
      lyDo: 'Mua sắm đơn hàng DH002',
      maDonHang: 'DH002',
      trangThai: 'hoan_thanh',
      ngayTao: '2024-01-13 14:45:00',
      ngayHetHan: '2024-07-13',
      nguoiXuLy: 'Hệ thống'
    },
    {
      maLichSu: 'LS004',
      maKhachHang: 'KH003',
      tenKhachHang: 'Lê Minh Cường',
      loaiGiaoDich: 'bonus',
      soLuongDiem: 1000,
      lyDo: 'Khuyến mãi sinh nhật khách hàng',
      trangThai: 'hoan_thanh',
      ngayTao: '2024-01-12 09:00:00',
      ngayHetHan: '2024-07-12',
      nguoiXuLy: 'Nhã'
    },
    {
      maLichSu: 'LS005',
      maKhachHang: 'KH002',
      tenKhachHang: 'Trần Thị Bình',
      loaiGiaoDich: 'redeem',
      soLuongDiem: -500,
      lyDo: 'Đổi voucher miễn phí vận chuyển',
      maVoucher: 'VC002',
      trangThai: 'hoan_thanh',
      ngayTao: '2024-01-11 11:30:00',
      nguoiXuLy: 'Nhã'
    },
    {
      maLichSu: 'LS006',
      maKhachHang: 'KH004',
      tenKhachHang: 'Phạm Thị Dung',
      loaiGiaoDich: 'expire',
      soLuongDiem: -300,
      lyDo: 'Hết hạn điểm tích lũy',
      trangThai: 'hoan_thanh',
      ngayTao: '2024-01-10 00:00:00',
      nguoiXuLy: 'Hệ thống'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTransactionType, setFilterTransactionType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [editingHistory, setEditingHistory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState(null);

  const [newHistory, setNewHistory] = useState({
    maKhachHang: '',
    tenKhachHang: '',
    loaiGiaoDich: 'earn',
    soLuongDiem: '',
    lyDo: '',
    maDonHang: '',
    maVoucher: '',
    trangThai: 'hoan_thanh',
    ngayHetHan: ''
  });

  // Filter points history
  const filteredHistory = pointsHistory.filter(history => {
    const matchesSearch = history.tenKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         history.maKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         history.lyDo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTransactionType = filterTransactionType === 'all' || history.loaiGiaoDich === filterTransactionType;
    const matchesStatus = filterStatus === 'all' || history.trangThai === filterStatus;
    return matchesSearch && matchesTransactionType && matchesStatus;
  });

  // Statistics
  const stats = {
    total: pointsHistory.length,
    totalEarned: pointsHistory.filter(h => h.soLuongDiem > 0).reduce((sum, h) => sum + h.soLuongDiem, 0),
    totalRedeemed: Math.abs(pointsHistory.filter(h => h.soLuongDiem < 0).reduce((sum, h) => sum + h.soLuongDiem, 0)),
    totalCustomers: new Set(pointsHistory.map(h => h.maKhachHang)).size,
    earningTransactions: pointsHistory.filter(h => h.loaiGiaoDich === 'earn').length,
    redeemTransactions: pointsHistory.filter(h => h.loaiGiaoDich === 'redeem').length
  };

  const handleAddHistory = () => {
    if (!newHistory.maKhachHang || !newHistory.tenKhachHang || !newHistory.soLuongDiem || !newHistory.lyDo) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    const history = {
      maLichSu: `LS${String(pointsHistory.length + 1).padStart(3, '0')}`,
      ...newHistory,
      soLuongDiem: newHistory.loaiGiaoDich === 'redeem' || newHistory.loaiGiaoDich === 'expire' 
        ? -Math.abs(parseFloat(newHistory.soLuongDiem))
        : parseFloat(newHistory.soLuongDiem),
      ngayTao: new Date().toLocaleString('vi-VN'),
      nguoiXuLy: 'Nhã'
    };

    setPointsHistory([...pointsHistory, history]);
    setNewHistory({
      maKhachHang: '',
      tenKhachHang: '',
      loaiGiaoDich: 'earn',
      soLuongDiem: '',
      lyDo: '',
      maDonHang: '',
      maVoucher: '',
      trangThai: 'hoan_thanh',
      ngayHetHan: ''
    });
    setShowAddModal(false);
    Toast.show('Thêm lịch sử điểm thưởng thành công', 'success');
  };

  const handleEditHistory = () => {
    if (!editingHistory.maKhachHang || !editingHistory.tenKhachHang || !editingHistory.soLuongDiem || !editingHistory.lyDo) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    setPointsHistory(pointsHistory.map(history => 
      history.maLichSu === editingHistory.maLichSu 
        ? { 
            ...editingHistory, 
            soLuongDiem: editingHistory.loaiGiaoDich === 'redeem' || editingHistory.loaiGiaoDich === 'expire' 
              ? -Math.abs(parseFloat(editingHistory.soLuongDiem))
              : parseFloat(editingHistory.soLuongDiem)
          }
        : history
    ));
    setShowEditModal(false);
    setEditingHistory(null);
    Toast.show('Cập nhật lịch sử điểm thưởng thành công', 'success');
  };

  const handleDeleteHistory = () => {
    setPointsHistory(pointsHistory.filter(history => history.maLichSu !== historyToDelete));
    setShowDeleteConfirm(false);
    setHistoryToDelete(null);
    Toast.show('Xóa lịch sử điểm thưởng thành công', 'success');
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'earn': return 'bg-green-100 text-green-800';
      case 'redeem': return 'bg-orange-100 text-orange-800';
      case 'bonus': return 'bg-purple-100 text-purple-800';
      case 'expire': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'earn': return 'Tích điểm';
      case 'redeem': return 'Đổi điểm';
      case 'bonus': return 'Thưởng';
      case 'expire': return 'Hết hạn';
      default: return type;
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'earn': return <IoTrendingUp className="w-4 h-4 text-green-600" />;
      case 'redeem': return <IoTrendingDown className="w-4 h-4 text-orange-600" />;
      case 'bonus': return <IoGift className="w-4 h-4 text-purple-600" />;
      case 'expire': return <IoTime className="w-4 h-4 text-red-600" />;
      default: return <IoPerson className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hoan_thanh': return 'bg-green-100 text-green-800';
      case 'dang_xu_ly': return 'bg-yellow-100 text-yellow-800';
      case 'that_bai': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'hoan_thanh': return 'Hoàn thành';
      case 'dang_xu_ly': return 'Đang xử lý';
      case 'that_bai': return 'Thất bại';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lịch sử điểm thưởng</h1>
        <p className="text-gray-600">Theo dõi lịch sử tích điểm và đổi điểm của khách hàng</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <IoPerson className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Tổng GD</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <IoTrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEarned.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Điểm tích</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <IoTrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRedeemed.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Điểm đổi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <IoPerson className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Khách hàng</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <IoTrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.earningTransactions}</p>
              <p className="text-sm text-gray-500">GD tích điểm</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <IoTrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.redeemTransactions}</p>
              <p className="text-sm text-gray-500">GD đổi điểm</p>
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
                placeholder="Tìm kiếm khách hàng, lý do..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <IoFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterTransactionType}
                onChange={(e) => setFilterTransactionType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tất cả loại GD</option>
                <option value="earn">Tích điểm</option>
                <option value="redeem">Đổi điểm</option>
                <option value="bonus">Thưởng</option>
                <option value="expire">Hết hạn</option>
              </select>
            </div>

            <div className="relative">
              <IoFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="hoan_thanh">Hoàn thành</option>
                <option value="dang_xu_ly">Đang xử lý</option>
                <option value="that_bai">Thất bại</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <IoAdd className="w-4 h-4" />
              Thêm lịch sử
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <IoDownload className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Points History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã LS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại GD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lý do
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((history) => (
                <tr key={history.maLichSu} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{history.maLichSu}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{history.tenKhachHang}</div>
                      <div className="text-sm text-gray-500">{history.maKhachHang}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionTypeIcon(history.loaiGiaoDich)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(history.loaiGiaoDich)}`}>
                        {getTransactionTypeText(history.loaiGiaoDich)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${history.soLuongDiem > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {history.soLuongDiem > 0 ? '+' : ''}{history.soLuongDiem.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={history.lyDo}>
                      {history.lyDo}
                    </div>
                    {history.maDonHang && (
                      <div className="text-sm text-gray-500">Đơn: {history.maDonHang}</div>
                    )}
                    {history.maVoucher && (
                      <div className="text-sm text-gray-500">Voucher: {history.maVoucher}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(history.trangThai)}`}>
                      {getStatusText(history.trangThai)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {history.ngayTao}
                    {history.ngayHetHan && (
                      <div className="text-xs text-gray-400">HSD: {history.ngayHetHan}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedHistory(history);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        <IoEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingHistory({...history, soLuongDiem: Math.abs(history.soLuongDiem).toString()});
                          setShowEditModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Chỉnh sửa"
                      >
                        <IoCreate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setHistoryToDelete(history.maLichSu);
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

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <IoPerson className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy lịch sử</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc thêm lịch sử mới</p>
          </div>
        )}
      </div>

      {/* Add History Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm lịch sử điểm thưởng">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newHistory.maKhachHang}
                onChange={(e) => setNewHistory({...newHistory, maKhachHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã khách hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newHistory.tenKhachHang}
                onChange={(e) => setNewHistory({...newHistory, tenKhachHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên khách hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
              <select
                value={newHistory.loaiGiaoDich}
                onChange={(e) => setNewHistory({...newHistory, loaiGiaoDich: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="earn">Tích điểm</option>
                <option value="redeem">Đổi điểm</option>
                <option value="bonus">Thưởng</option>
                <option value="expire">Hết hạn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điểm <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newHistory.soLuongDiem}
                onChange={(e) => setNewHistory({...newHistory, soLuongDiem: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số điểm"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newHistory.lyDo}
                onChange={(e) => setNewHistory({...newHistory, lyDo: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập lý do"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
              <input
                type="text"
                value={newHistory.maDonHang}
                onChange={(e) => setNewHistory({...newHistory, maDonHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã đơn hàng (nếu có)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
              <input
                type="text"
                value={newHistory.maVoucher}
                onChange={(e) => setNewHistory({...newHistory, maVoucher: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã voucher (nếu có)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
              <input
                type="date"
                value={newHistory.ngayHetHan}
                onChange={(e) => setNewHistory({...newHistory, ngayHetHan: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={newHistory.trangThai}
                onChange={(e) => setNewHistory({...newHistory, trangThai: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hoan_thanh">Hoàn thành</option>
                <option value="dang_xu_ly">Đang xử lý</option>
                <option value="that_bai">Thất bại</option>
              </select>
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
              onClick={handleAddHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Thêm lịch sử
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit History Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa lịch sử điểm thưởng">
        {editingHistory && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingHistory.maKhachHang}
                  onChange={(e) => setEditingHistory({...editingHistory, maKhachHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingHistory.tenKhachHang}
                  onChange={(e) => setEditingHistory({...editingHistory, tenKhachHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                <select
                  value={editingHistory.loaiGiaoDich}
                  onChange={(e) => setEditingHistory({...editingHistory, loaiGiaoDich: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="earn">Tích điểm</option>
                  <option value="redeem">Đổi điểm</option>
                  <option value="bonus">Thưởng</option>
                  <option value="expire">Hết hạn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điểm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingHistory.soLuongDiem}
                  onChange={(e) => setEditingHistory({...editingHistory, soLuongDiem: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingHistory.lyDo}
                  onChange={(e) => setEditingHistory({...editingHistory, lyDo: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <input
                  type="text"
                  value={editingHistory.maDonHang || ''}
                  onChange={(e) => setEditingHistory({...editingHistory, maDonHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
                <input
                  type="text"
                  value={editingHistory.maVoucher || ''}
                  onChange={(e) => setEditingHistory({...editingHistory, maVoucher: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                <input
                  type="date"
                  value={editingHistory.ngayHetHan || ''}
                  onChange={(e) => setEditingHistory({...editingHistory, ngayHetHan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editingHistory.trangThai}
                  onChange={(e) => setEditingHistory({...editingHistory, trangThai: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hoan_thanh">Hoàn thành</option>
                  <option value="dang_xu_ly">Đang xử lý</option>
                  <option value="that_bai">Thất bại</option>
                </select>
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
                onClick={handleEditHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* History Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết lịch sử điểm thưởng">
        {selectedHistory && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã lịch sử</label>
                <p className="text-sm text-gray-900">{selectedHistory.maLichSu}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã khách hàng</label>
                <p className="text-sm text-gray-900">{selectedHistory.maKhachHang}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                <p className="text-sm text-gray-900">{selectedHistory.tenKhachHang}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                <div className="flex items-center">
                  {getTransactionTypeIcon(selectedHistory.loaiGiaoDich)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(selectedHistory.loaiGiaoDich)}`}>
                    {getTransactionTypeText(selectedHistory.loaiGiaoDich)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điểm</label>
                <p className={`text-sm font-medium ${selectedHistory.soLuongDiem > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedHistory.soLuongDiem > 0 ? '+' : ''}{selectedHistory.soLuongDiem.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedHistory.trangThai)}`}>
                  {getStatusText(selectedHistory.trangThai)}
                </span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                <p className="text-sm text-gray-900">{selectedHistory.lyDo}</p>
              </div>
              {selectedHistory.maDonHang && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                  <p className="text-sm text-gray-900">{selectedHistory.maDonHang}</p>
                </div>
              )}
              {selectedHistory.maVoucher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
                  <p className="text-sm text-gray-900">{selectedHistory.maVoucher}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                <p className="text-sm text-gray-900">{selectedHistory.ngayTao}</p>
              </div>
              {selectedHistory.ngayHetHan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                  <p className="text-sm text-gray-900">{selectedHistory.ngayHetHan}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người xử lý</label>
                <p className="text-sm text-gray-900">{selectedHistory.nguoiXuLy}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Xác nhận xóa">
        <div className="space-y-4">
          <p className="text-gray-700">Bạn có chắc chắn muốn xóa lịch sử điểm thưởng này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteHistory}
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

export default LoyaltyPointsHistory;


