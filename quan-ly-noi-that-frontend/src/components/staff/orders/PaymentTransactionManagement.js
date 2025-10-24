import React, { useState, useEffect } from 'react';
import { IoAdd, IoCreate, IoTrash, IoEye, IoSearch, IoFilter, IoDownload, IoCard, IoCheckmarkCircle, IoCloseCircle, IoTime, IoPerson } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import Toast from '../../shared/Toast';
import api from '../../../api';

// Mapping functions for Vietnamese API field names
const mapTransactionFromApi = (transaction) => ({
  maGiaoDich: transaction.ma_giao_dich,
  maDonHang: transaction.ma_don_hang,
  tenKhachHang: transaction.ten_khach_hang,
  soTien: transaction.so_tien,
  phuongThucThanhToan: transaction.phuong_thuc_thanh_toan,
  trangThai: transaction.trang_thai,
  ngayGiaoDich: transaction.ngay_giao_dich,
  maGiaoDichNganHang: transaction.ma_giao_dich_ngan_hang,
  nganHang: transaction.ngan_hang,
  soThe: transaction.so_the,
  phiGiaoDich: transaction.phi_giao_dich,
  maXacThuc: transaction.ma_xac_thuc,
  ghiChu: transaction.ghi_chu,
  ngayCapNhat: transaction.ngay_cap_nhat,
  nhanVienXuLy: transaction.nhan_vien_xu_ly
});

const mapTransactionToApi = (transaction) => ({
  ma_don_hang: transaction.maDonHang,
  so_tien: transaction.soTien,
  phuong_thuc_thanh_toan: transaction.phuongThucThanhToan,
  trang_thai: transaction.trangThai,
  ma_giao_dich_ngan_hang: transaction.maGiaoDichNganHang,
  ngan_hang: transaction.nganHang,
  so_the: transaction.soThe,
  phi_giao_dich: transaction.phiGiaoDich,
  ma_xac_thuc: transaction.maXacThuc,
  ghi_chu: transaction.ghiChu
});

const PaymentTransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API Functions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/giao-dich-thanh-toan');
      setTransactions(response.data.map(mapTransactionFromApi));
    } catch (error) {
      setError('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const processTransaction = async (transactionData) => {
    try {
      const response = await api.post('/api/v1/giao-dich-thanh-toan/xu-ly', mapTransactionToApi(transactionData));
      return mapTransactionFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể xử lý giao dịch');
    }
  };

  const refundTransaction = async (transactionId, refundAmount, reason) => {
    try {
      const response = await api.post(`/api/v1/giao-dich-thanh-toan/${transactionId}/hoan-tien`, {
        so_tien_hoan: refundAmount,
        ly_do: reason
      });
      return mapTransactionFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể hoàn tiền');
    }
  };

  const verifyTransaction = async (transactionId, bankTransactionId) => {
    try {
      const response = await api.put(`/api/v1/giao-dich-thanh-toan/${transactionId}/xac-thuc`, {
        ma_giao_dich_ngan_hang: bankTransactionId
      });
      return mapTransactionFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể xác thực giao dịch');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [newTransaction, setNewTransaction] = useState({
    maDonHang: '',
    tenKhachHang: '',
    soTien: '',
    phuongThucThanhToan: 'credit_card',
    trangThai: 'dang_xu_ly',
    maGiaoDichNganHang: '',
    phiGiaoDich: '',
    ghiChu: ''
  });

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.tenKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.maDonHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.maGiaoDich.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.trangThai === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || transaction.phuongThucThanhToan === filterPaymentMethod;
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  // Statistics
  const stats = {
    total: transactions.length,
    success: transactions.filter(t => t.trangThai === 'thanh_cong').length,
    pending: transactions.filter(t => t.trangThai === 'dang_xu_ly').length,
    failed: transactions.filter(t => t.trangThai === 'that_bai').length,
    totalAmount: transactions.filter(t => t.trangThai === 'thanh_cong').reduce((sum, t) => sum + t.soTien, 0),
    totalFees: transactions.reduce((sum, t) => sum + t.phiGiaoDich, 0)
  };

  const handleAddTransaction = () => {
    if (!newTransaction.maDonHang || !newTransaction.tenKhachHang || !newTransaction.soTien) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    const transaction = {
      maGiaoDich: `GT${String(transactions.length + 1).padStart(3, '0')}`,
      ...newTransaction,
      soTien: parseFloat(newTransaction.soTien),
      phiGiaoDich: parseFloat(newTransaction.phiGiaoDich) || 0,
      ngayGiaoDich: new Date().toLocaleString('vi-VN'),
      nguoiXuLy: 'Huy'
    };

    setTransactions([...transactions, transaction]);
    setNewTransaction({
      maDonHang: '',
      tenKhachHang: '',
      soTien: '',
      phuongThucThanhToan: 'credit_card',
      trangThai: 'dang_xu_ly',
      maGiaoDichNganHang: '',
      phiGiaoDich: '',
      ghiChu: ''
    });
    setShowAddModal(false);
    Toast.show('Thêm giao dịch thành công', 'success');
  };

  const handleEditTransaction = () => {
    if (!editingTransaction.maDonHang || !editingTransaction.tenKhachHang || !editingTransaction.soTien) {
      Toast.show('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    setTransactions(transactions.map(transaction => 
      transaction.maGiaoDich === editingTransaction.maGiaoDich 
        ? { ...editingTransaction, soTien: parseFloat(editingTransaction.soTien), phiGiaoDich: parseFloat(editingTransaction.phiGiaoDich) || 0 }
        : transaction
    ));
    setShowEditModal(false);
    setEditingTransaction(null);
    Toast.show('Cập nhật giao dịch thành công', 'success');
  };

  const handleDeleteTransaction = () => {
    setTransactions(transactions.filter(transaction => transaction.maGiaoDich !== transactionToDelete));
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
    Toast.show('Xóa giao dịch thành công', 'success');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'thanh_cong': return 'bg-green-100 text-green-800';
      case 'dang_xu_ly': return 'bg-yellow-100 text-yellow-800';
      case 'that_bai': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'thanh_cong': return 'Thành công';
      case 'dang_xu_ly': return 'Đang xử lý';
      case 'that_bai': return 'Thất bại';
      default: return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit_card': return 'Thẻ tín dụng';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'cash': return 'Tiền mặt';
      case 'e_wallet': return 'Ví điện tử';
      case 'installment': return 'Trả góp';
      default: return method;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'cash': return '💵';
      case 'e_wallet': return '📱';
      case 'installment': return '📅';
      default: return '💰';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý giao dịch thanh toán</h1>
        <p className="text-gray-600">Theo dõi và quản lý các giao dịch thanh toán của khách hàng</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <IoCard className="w-4 h-4 text-blue-600" />
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
              <IoCheckmarkCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.success}</p>
              <p className="text-sm text-gray-500">Thành công</p>
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
              <p className="text-sm text-gray-500">Đang xử lý</p>
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
              <IoPerson className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-sm text-gray-500">Tổng tiền</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <IoCard className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalFees)}</p>
              <p className="text-sm text-gray-500">Tổng phí</p>
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
                placeholder="Tìm kiếm giao dịch..."
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
                <option value="thanh_cong">Thành công</option>
                <option value="dang_xu_ly">Đang xử lý</option>
                <option value="that_bai">Thất bại</option>
              </select>
            </div>

            <div className="relative">
              <IoCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="credit_card">Thẻ tín dụng</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="e_wallet">Ví điện tử</option>
                <option value="installment">Trả góp</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <IoAdd className="w-4 h-4" />
              Thêm giao dịch
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <IoDownload className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã GD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng / Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày GD
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.maGiaoDich} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.maGiaoDich}</div>
                    {transaction.maGiaoDichNganHang && (
                      <div className="text-sm text-gray-500">{transaction.maGiaoDichNganHang}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.maDonHang}</div>
                      <div className="text-sm text-gray-500">{transaction.tenKhachHang}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.soTien)}</div>
                      {transaction.phiGiaoDich > 0 && (
                        <div className="text-sm text-gray-500">Phí: {formatCurrency(transaction.phiGiaoDich)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getPaymentMethodIcon(transaction.phuongThucThanhToan)}</span>
                      <span className="text-sm text-gray-900">{getPaymentMethodText(transaction.phuongThucThanhToan)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.trangThai)}`}>
                      {getStatusText(transaction.trangThai)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.ngayGiaoDich}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        <IoEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTransaction({...transaction});
                          setShowEditModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Chỉnh sửa"
                      >
                        <IoCreate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTransactionToDelete(transaction.maGiaoDich);
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

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <IoCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy giao dịch</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc thêm giao dịch mới</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm giao dịch mới">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã đơn hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTransaction.maDonHang}
                onChange={(e) => setNewTransaction({...newTransaction, maDonHang: e.target.value})}
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
                value={newTransaction.tenKhachHang}
                onChange={(e) => setNewTransaction({...newTransaction, tenKhachHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên khách hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newTransaction.soTien}
                onChange={(e) => setNewTransaction({...newTransaction, soTien: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số tiền"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phí giao dịch (VND)</label>
              <input
                type="number"
                value={newTransaction.phiGiaoDich}
                onChange={(e) => setNewTransaction({...newTransaction, phiGiaoDich: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập phí giao dịch"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
              <select
                value={newTransaction.phuongThucThanhToan}
                onChange={(e) => setNewTransaction({...newTransaction, phuongThucThanhToan: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="credit_card">Thẻ tín dụng</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="e_wallet">Ví điện tử</option>
                <option value="installment">Trả góp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={newTransaction.trangThai}
                onChange={(e) => setNewTransaction({...newTransaction, trangThai: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dang_xu_ly">Đang xử lý</option>
                <option value="thanh_cong">Thành công</option>
                <option value="that_bai">Thất bại</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã giao dịch ngân hàng</label>
              <input
                type="text"
                value={newTransaction.maGiaoDichNganHang}
                onChange={(e) => setNewTransaction({...newTransaction, maGiaoDichNganHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã giao dịch ngân hàng"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                value={newTransaction.ghiChu}
                onChange={(e) => setNewTransaction({...newTransaction, ghiChu: e.target.value})}
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
              onClick={handleAddTransaction}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Thêm giao dịch
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa giao dịch">
        {editingTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingTransaction.maDonHang}
                  onChange={(e) => setEditingTransaction({...editingTransaction, maDonHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingTransaction.tenKhachHang}
                  onChange={(e) => setEditingTransaction({...editingTransaction, tenKhachHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingTransaction.soTien}
                  onChange={(e) => setEditingTransaction({...editingTransaction, soTien: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí giao dịch (VND)</label>
                <input
                  type="number"
                  value={editingTransaction.phiGiaoDich}
                  onChange={(e) => setEditingTransaction({...editingTransaction, phiGiaoDich: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <select
                  value={editingTransaction.phuongThucThanhToan}
                  onChange={(e) => setEditingTransaction({...editingTransaction, phuongThucThanhToan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit_card">Thẻ tín dụng</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="e_wallet">Ví điện tử</option>
                  <option value="installment">Trả góp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editingTransaction.trangThai}
                  onChange={(e) => setEditingTransaction({...editingTransaction, trangThai: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dang_xu_ly">Đang xử lý</option>
                  <option value="thanh_cong">Thành công</option>
                  <option value="that_bai">Thất bại</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã giao dịch ngân hàng</label>
                <input
                  type="text"
                  value={editingTransaction.maGiaoDichNganHang || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, maGiaoDichNganHang: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={editingTransaction.ghiChu}
                  onChange={(e) => setEditingTransaction({...editingTransaction, ghiChu: e.target.value})}
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
                onClick={handleEditTransaction}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết giao dịch">
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã giao dịch</label>
                <p className="text-sm text-gray-900">{selectedTransaction.maGiaoDich}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <p className="text-sm text-gray-900">{selectedTransaction.maDonHang}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                <p className="text-sm text-gray-900">{selectedTransaction.tenKhachHang}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedTransaction.soTien)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí giao dịch</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedTransaction.phiGiaoDich)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <div className="flex items-center">
                  <span className="mr-2">{getPaymentMethodIcon(selectedTransaction.phuongThucThanhToan)}</span>
                  <span className="text-sm text-gray-900">{getPaymentMethodText(selectedTransaction.phuongThucThanhToan)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.trangThai)}`}>
                  {getStatusText(selectedTransaction.trangThai)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao dịch</label>
                <p className="text-sm text-gray-900">{selectedTransaction.ngayGiaoDich}</p>
              </div>
              {selectedTransaction.maGiaoDichNganHang && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã giao dịch ngân hàng</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.maGiaoDichNganHang}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người xử lý</label>
                <p className="text-sm text-gray-900">{selectedTransaction.nguoiXuLy}</p>
              </div>
              {selectedTransaction.ghiChu && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.ghiChu}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Xác nhận xóa">
        <div className="space-y-4">
          <p className="text-gray-700">Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteTransaction}
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

export default PaymentTransactionManagement;

