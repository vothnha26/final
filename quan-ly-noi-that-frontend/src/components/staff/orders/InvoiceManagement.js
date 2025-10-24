import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { 
  IoAdd, 
  IoTrashOutline, 
  IoPencilOutline, 
  IoSearch, 
  IoFilterOutline, 
  IoEyeOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoStatsChartOutline
} from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';

// Mapping functions for Vietnamese API field names
const mapInvoiceFromApi = (invoice) => ({
  id: invoice.id,
  soHoaDon: invoice.so_hoa_don,
  maDonHang: invoice.ma_don_hang,
  ngayXuat: invoice.ngay_xuat,
  tongTienThanhToan: invoice.tong_tien_thanh_toan,
  maNhanVienXuat: invoice.ma_nhan_vien_xuat,
  tenNhanVienXuat: invoice.ten_nhan_vien_xuat,
  tenKhachHang: invoice.ten_khach_hang,
  soDienThoai: invoice.so_dien_thoai,
  diaChi: invoice.dia_chi,
  trangThai: invoice.trang_thai,
  ghiChu: invoice.ghi_chu,
  chiTiet: (invoice.chi_tiet || []).map(item => ({
    sanPhamId: item.san_pham_id,
    tenSanPham: item.ten_san_pham,
    soLuong: item.so_luong,
    donGia: item.don_gia,
    thanhTien: item.thanh_tien
  }))
});

// mapInvoiceToApi removed — UI currently works with invoices fetched from backend

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  // loading/error are handled inline where needed
  
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    maDonHang: '',
    soHoaDon: '',
    ngayXuat: '',
    maNhanVienXuat: '',
    tongTienThanhToan: ''
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: 'all',
    staffId: '',
    amountRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // API Functions
  const fetchInvoices = async () => {
    try {
      const response = await api.get('/api/v1/hoa-don');
      const data = response.data || response;
      if (Array.isArray(data)) setInvoices(data.map(mapInvoiceFromApi));
      else setInvoices([]);
    } catch (err) {
      alert('Không thể tải danh sách hóa đơn. Kiểm tra console để biết chi tiết.');
      setInvoices([]);
    }
  };

  // helper functions for create/update/delete/pdf were removed because
  // the UI currently relies on the fetchInvoices list and server-side
  // operations can be added later when needed.

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Attempt to fetch staff and orders for the invoice UI; if backend doesn't provide them, fall back to empty arrays
  useEffect(() => {
    const fetchSupportingData = async () => {
      try {
        const [staffRes, ordersRes] = await Promise.allSettled([
          api.get('/api/nhan-vien'), // adjust if your backend has a different endpoint
          api.get('/api/banhang/donhang')
        ]);

        if (staffRes.status === 'fulfilled') {
          const sData = staffRes.value.data || staffRes.value;
          setStaff(Array.isArray(sData) ? sData : []);
        } else {
          setStaff([]);
        }

        if (ordersRes.status === 'fulfilled') {
          const oData = ordersRes.value.data || ordersRes.value;
          setOrders(Array.isArray(oData) ? oData : []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        setStaff([]);
        setOrders([]);
      }
    };

    fetchSupportingData();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = invoices;

    if (filters.searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.soHoaDon.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        invoice.donHang.maDonHang.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        invoice.donHang.khachHang.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.ngayXuat);
            return invoiceDate >= today;
          });
          break;
        case 'this-week':
          const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(invoice => 
            new Date(invoice.ngayXuat) >= thisWeek
          );
          break;
        case 'this-month':
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(invoice => 
            new Date(invoice.ngayXuat) >= thisMonth
          );
          break;
        default:
          break;
      }
    }

    if (filters.staffId) {
      filtered = filtered.filter(invoice => 
        invoice.nhanVienXuat.id.toString() === filters.staffId
      );
    }

    if (filters.amountRange !== 'all') {
      switch (filters.amountRange) {
        case 'under5m':
          filtered = filtered.filter(invoice => invoice.tongTienThanhToan < 5000000);
          break;
        case '5m-15m':
          filtered = filtered.filter(invoice => 
            invoice.tongTienThanhToan >= 5000000 && invoice.tongTienThanhToan <= 15000000
          );
          break;
        case 'over15m':
          filtered = filtered.filter(invoice => invoice.tongTienThanhToan > 15000000);
          break;
        default:
          break;
      }
    }

    setFilteredInvoices(filtered);
  }, [invoices, filters]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const formatDateTime = (dateString) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `HD${year}${count.toString().padStart(3, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const resetForm = () => {
    setFormData({
      maDonHang: '',
      soHoaDon: generateInvoiceNumber(),
      ngayXuat: new Date().toISOString().slice(0, 16),
      maNhanVienXuat: '',
      tongTienThanhToan: ''
    });
    setEditingInvoice(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (invoice) => {
    setFormData({
      maDonHang: invoice.donHang.id.toString(),
      soHoaDon: invoice.soHoaDon,
      ngayXuat: invoice.ngayXuat.slice(0, 16),
      maNhanVienXuat: invoice.nhanVienXuat.id.toString(),
      tongTienThanhToan: invoice.tongTienThanhToan.toString()
    });
    setEditingInvoice(invoice);
    setShowModal(true);
  };

  const handleDelete = (invoice) => {
    setDeletingInvoice(invoice);
    setShowConfirmDialog(true);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.maDonHang || !formData.soHoaDon || !formData.maNhanVienXuat || !formData.tongTienThanhToan) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    if (parseFloat(formData.tongTienThanhToan) <= 0) {
      showToast('Tổng tiền thanh toán phải lớn hơn 0', 'error');
      return;
    }

    // Check for duplicate invoice number
    const isDuplicate = invoices.some(invoice => 
      invoice.soHoaDon === formData.soHoaDon &&
      (!editingInvoice || invoice.id !== editingInvoice.id)
    );

    if (isDuplicate) {
      showToast('Số hóa đơn đã tồn tại', 'error');
      return;
    }

    const selectedOrder = orders.find(o => o.id.toString() === formData.maDonHang);
    const selectedStaff = staff.find(s => s.id.toString() === formData.maNhanVienXuat);

    const invoiceData = {
      id: editingInvoice ? editingInvoice.id : Date.now(),
      maHoaDon: editingInvoice ? editingInvoice.maHoaDon : Date.now(),
      soHoaDon: formData.soHoaDon,
      donHang: selectedOrder,
      ngayXuat: formData.ngayXuat,
      nhanVienXuat: selectedStaff,
      tongTienThanhToan: parseFloat(formData.tongTienThanhToan),
      trangThai: 'pending'
    };

    if (editingInvoice) {
      setInvoices(invoices.map(invoice => 
        invoice.id === editingInvoice.id ? invoiceData : invoice
      ));
      showToast('Cập nhật hóa đơn thành công');
    } else {
      setInvoices([...invoices, invoiceData]);
      showToast('Thêm hóa đơn thành công');
    }

    setShowModal(false);
    resetForm();
  };

  const confirmDelete = () => {
    setInvoices(invoices.filter(invoice => invoice.id !== deletingInvoice.id));
    setShowConfirmDialog(false);
    setDeletingInvoice(null);
    showToast('Xóa hóa đơn thành công');
  };

  const handlePrint = (invoice) => {
    showToast('Đang in hóa đơn...');
    // Simulate printing
    setTimeout(() => {
      showToast('In hóa đơn thành công');
    }, 2000);
  };

  const handleDownload = (invoice) => {
    showToast('Đang tải xuống hóa đơn...');
    // Simulate download
    setTimeout(() => {
      showToast('Tải xuống thành công');
    }, 2000);
  };

  const getStats = () => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.trangThai === 'paid').length;
    const pending = invoices.filter(i => i.trangThai === 'pending').length;
    const totalAmount = invoices.reduce((sum, i) => sum + i.tongTienThanhToan, 0);
    
    return { total, paid, pending, totalAmount };
  };

  const stats = getStats();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Hóa đơn</h1>
        <p className="text-gray-600">Quản lý và theo dõi các hóa đơn bán hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Tổng hóa đơn</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <IoReceiptOutline className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Đã thanh toán</p>
              <p className="text-3xl font-bold">{stats.paid}</p>
            </div>
            <IoCheckmarkCircleOutline className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Chờ thanh toán</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <IoAlertCircleOutline className="text-4xl text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Tổng doanh thu</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <IoStatsChartOutline className="text-4xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm hóa đơn, đơn hàng, khách hàng..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <IoFilterOutline />
              Bộ lọc
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <IoAdd />
            Tạo hóa đơn
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="this-week">Tuần này</option>
                  <option value="this-month">Tháng này</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên xuất</label>
                <select
                  value={filters.staffId}
                  onChange={(e) => setFilters({...filters, staffId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả nhân viên</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.hoTen}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng tiền</label>
                <select
                  value={filters.amountRange}
                  onChange={(e) => setFilters({...filters, amountRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="under5m">Dưới 5 triệu</option>
                  <option value="5m-15m">5 - 15 triệu</option>
                  <option value="over15m">Trên 15 triệu</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày xuất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên xuất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
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
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <IoDocumentTextOutline className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.soHoaDon}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.donHang.maDonHang}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.donHang.khachHang}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <IoCalendarOutline className="text-gray-400 mr-1" />
                      {formatDateTime(invoice.ngayXuat)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <IoPersonOutline className="text-gray-400 mr-1" />
                      {invoice.nhanVienXuat.hoTen}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">
                      {formatCurrency(invoice.tongTienThanhToan)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.trangThai)}`}>
                      {getStatusText(invoice.trangThai)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(invoice)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Xem chi tiết"
                      >
                        <IoEyeOutline className="text-lg" />
                      </button>
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="In hóa đơn"
                      >
                        <IoPrintOutline className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded"
                        title="Tải xuống"
                      >
                        <IoDownloadOutline className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Chỉnh sửa"
                      >
                        <IoPencilOutline className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Xóa"
                      >
                        <IoTrashOutline className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <IoReceiptOutline className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có hóa đơn</h3>
            <p className="text-gray-500 mb-4">
              {filters.searchTerm || filters.dateRange !== 'all' || filters.staffId || filters.amountRange !== 'all'
                ? 'Không tìm thấy hóa đơn nào phù hợp với bộ lọc'
                : 'Chưa có hóa đơn nào được tạo'}
            </p>
            {!filters.searchTerm && filters.dateRange === 'all' && !filters.staffId && filters.amountRange === 'all' && (
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Tạo hóa đơn đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.maDonHang}
                onChange={(e) => {
                  const selectedOrder = orders.find(o => o.id.toString() === e.target.value);
                  setFormData({
                    ...formData, 
                    maDonHang: e.target.value,
                    tongTienThanhToan: selectedOrder ? selectedOrder.tongTien.toString() : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn đơn hàng</option>
                {orders.filter(order => order.trangThai === 'completed').map(order => (
                  <option key={order.id} value={order.id}>
                    {order.maDonHang} - {order.khachHang} ({formatCurrency(order.tongTien)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số hóa đơn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.soHoaDon}
                onChange={(e) => setFormData({...formData, soHoaDon: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số hóa đơn"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày xuất <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.ngayXuat}
                onChange={(e) => setFormData({...formData, ngayXuat: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhân viên xuất <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.maNhanVienXuat}
                onChange={(e) => setFormData({...formData, maNhanVienXuat: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn nhân viên</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.hoTen} - {member.chucVu}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tổng tiền thanh toán <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.tongTienThanhToan}
              onChange={(e) => setFormData({...formData, tongTienThanhToan: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tổng tiền thanh toán"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingInvoice ? 'Cập nhật' : 'Tạo hóa đơn'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Chi tiết hóa đơn: ${selectedInvoice?.soHoaDon}`}
        size="large"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin hóa đơn</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số hóa đơn:</span>
                      <span className="font-medium">{selectedInvoice.soHoaDon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày xuất:</span>
                      <span className="font-medium">{formatDateTime(selectedInvoice.ngayXuat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nhân viên xuất:</span>
                      <span className="font-medium">{selectedInvoice.nhanVienXuat.hoTen}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.trangThai)}`}>
                        {getStatusText(selectedInvoice.trangThai)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin đơn hàng</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-medium">{selectedInvoice.donHang.maDonHang}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khách hàng:</span>
                      <span className="font-medium">{selectedInvoice.donHang.khachHang}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày đặt:</span>
                      <span className="font-medium">{selectedInvoice.donHang.ngayDat}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Tổng tiền thanh toán</h3>
                  <p className="text-sm text-blue-700">Số tiền khách hàng cần thanh toán</p>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(selectedInvoice.tongTienThanhToan)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handlePrint(selectedInvoice)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <IoPrintOutline />
                In hóa đơn
              </button>
              <button
                onClick={() => handleDownload(selectedInvoice)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <IoDownloadOutline />
                Tải xuống
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Xóa hóa đơn"
        message={`Bạn có chắc chắn muốn xóa hóa đơn "${deletingInvoice?.soHoaDon}"? Hành động này không thể hoàn tác.`}
      />

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default InvoiceManagement;

