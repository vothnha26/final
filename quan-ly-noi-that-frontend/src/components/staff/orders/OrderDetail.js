import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IoArrowBack,
  IoPerson,
  IoLocation,
  IoCall,
  IoMail,
  IoCube,
  IoCash,
  IoCheckmarkCircle,
  IoTime,
  IoPrint,
  IoCreate
} from 'react-icons/io5';
import api from '../../../api';
import Toast from '../../shared/Toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  // Payment status modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/banhang/donhang/${id}`);

      // Handle different response structures
      let orderData = response;
      if (response.data) {
        orderData = response.data;
      }
      if (response.result) {
        orderData = response.result;
      }

      setOrder(orderData);
    } catch (error) {
      showToast('Không thể tải thông tin đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  // Safely read numeric fields across various key names
  const getNum = (obj, keys = []) => {
    if (!obj) return 0;
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
    }
    return 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'CHO_XU_LY': 'bg-yellow-100 text-yellow-800',
      'XAC_NHAN': 'bg-blue-100 text-blue-800',
      'DANG_CHUAN_BI': 'bg-indigo-100 text-indigo-800',
      'DANG_XU_LY': 'bg-indigo-100 text-indigo-800', // UI alias -> preparing/confirmed
      'DANG_GIAO_HANG': 'bg-purple-100 text-purple-800',
      'DANG_GIAO': 'bg-purple-100 text-purple-800', // alias support
      'DA_GIAO_HANG': 'bg-green-100 text-green-800',
      'HOAN_THANH': 'bg-green-100 text-green-800',
      'DA_HUY': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'CHO_XU_LY': 'Chờ xử lý',
      'XAC_NHAN': 'Đang xử lý', // show as UI-friendly
      'DANG_CHUAN_BI': 'Đang xử lý', // show as UI-friendly
      'DANG_XU_LY': 'Đang xử lý',
      'DANG_GIAO_HANG': 'Đang giao hàng',
      'DANG_GIAO': 'Đang giao hàng', // alias support
      'DA_GIAO_HANG': 'Đã giao hàng',
      'HOAN_THANH': 'Hoàn thành',
      'DA_HUY': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  // Map backend stored statuses to UI status values
  const normalizeStatusForUI = (raw) => {
    const s = (raw || '').toUpperCase();
    if (s === 'CHO_XU_LY' || s === 'XAC_NHAN' || s === 'DANG_CHUAN_BI') return 'DANG_XU_LY';
    if (s === 'DANG_GIAO') return 'DANG_GIAO_HANG';
    if (s === 'DA_GIAO_HANG') return 'DA_GIAO_HANG';
    return s || 'CHO_XU_LY';
  };

  // Map UI status back to backend-accepted values
  const mapUiToBackendStatus = (ui) => {
    const s = (ui || '').toUpperCase();
    if (s === 'DANG_XU_LY') return 'DANG_CHUAN_BI';
    if (s === 'DANG_GIAO') return 'DANG_GIAO_HANG';
    return s;
  };

  const getPaymentStatusLabel = (status) => {
    const map = {
      'PAID': 'Đã thanh toán',
      'UNPAID': 'Chưa thanh toán',
      'PENDING': 'Đang chờ',
      'FAILED': 'Thất bại'
    };
    return map[status] || 'Chưa thanh toán';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = () => {
    const current = order?.trangThaiDonHang || order?.trangThai || order?.status || '';
    setNewStatus(normalizeStatusForUI(current));
    setShowStatusModal(true);
  };

  const updateOrderStatus = async () => {
    if (!newStatus) {
      showToast('Vui lòng chọn trạng thái', 'error');
      return;
    }

    try {
      setUpdating(true);
  const statusToSend = mapUiToBackendStatus(newStatus);
  if (statusToSend === 'HOAN_THANH') {
        // Gọi API hoàn thành đơn hàng (→ HOAN_THANH)
        await api.post(`/api/v1/quan-ly-trang-thai-don-hang/${id}/complete`, {
          nguoiThayDoi: 'staff', // TODO: lấy từ AuthContext nếu có
          ghiChu: 'Hoàn thành đơn hàng'
        });
        showToast('Đã hoàn thành đơn hàng', 'success');
      } else {
        try {
          // Use validated transition endpoint to ensure business rules and history are applied
          await api.put(`/api/v1/quan-ly-trang-thai-don-hang/cap-nhat-trang-thai/${id}`, {
            trangThaiMoi: statusToSend,
            nguoiCapNhat: 'staff',
            ghiChu: 'Cập nhật trạng thái từ giao diện nhân viên'
          });
          showToast('Cập nhật trạng thái thành công', 'success');
        } catch (err) {
          // Fallback: call simpler endpoint if server returns 500 or unexpected error
          if (err && err.status === 500) {
            await api.put(`/api/banhang/donhang/${id}/trangthai`, { trangThai: statusToSend });
            showToast('Cập nhật trạng thái thành công (dự phòng)', 'success');
          } else {
            throw err;
          }
        }
      }
      setShowStatusModal(false);
      await fetchOrderDetail();
    } catch (error) {
      const msg = (error && error.data && (error.data.message || error.data.error || (typeof error.data === 'string' ? error.data : ''))) || '';
      showToast(`Không thể cập nhật trạng thái${msg ? ': ' + msg : ''}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const paymentStatusOptions = [
    { value: 'UNPAID', label: 'Chưa thanh toán' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'PENDING', label: 'Đang xử lý' },
    { value: 'FAILED', label: 'Thất bại' }
  ];

  const handleUpdatePaymentStatus = () => {
    // Infer current payment status from known fields
    const current = order?.trangThaiThanhToan || order?.paymentStatus || 'UNPAID';
    setNewPaymentStatus(current);
    setShowPaymentModal(true);
  };

  const updatePaymentStatus = async () => {
    if (!newPaymentStatus) {
      showToast('Vui lòng chọn trạng thái thanh toán', 'error');
      return;
    }
    try {
      setUpdatingPayment(true);
      // Assumption: backend endpoint for payment status update
      await api.put(`/api/banhang/donhang/${id}/thanh-toan/trang-thai`, {
        trangThaiThanhToan: newPaymentStatus
      });
      showToast('Cập nhật trạng thái thanh toán thành công', 'success');
      setShowPaymentModal(false);
      await fetchOrderDetail();
    } catch (error) {
      showToast('Không thể cập nhật trạng thái thanh toán', 'error');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // UI flow as requested: DANG_XU_LY → DANG_GIAO_HANG → DA_GIAO_HANG → HOAN_THANH (+ DA_HUY)
  const statusOptions = [
    { value: 'DANG_XU_LY', label: 'Đang xử lý' },
    { value: 'DANG_GIAO_HANG', label: 'Đang giao hàng' },
    { value: 'DA_GIAO_HANG', label: 'Đã giao hàng' },
    { value: 'HOAN_THANH', label: 'Hoàn thành' },
    { value: 'DA_HUY', label: 'Đã hủy' }
  ];

  // Compute next valid statuses based on current UI-normalized status
  const getNextValidStatuses = (currentUi) => {
    switch ((currentUi || '').toUpperCase()) {
      case 'DANG_XU_LY':
        return ['DANG_GIAO_HANG', 'DA_HUY'];
      case 'DANG_GIAO_HANG':
        return ['DA_GIAO_HANG', 'HOAN_THANH', 'DA_HUY'];
      case 'DA_GIAO_HANG':
        return ['HOAN_THANH'];
      case 'HOAN_THANH':
      case 'DA_HUY':
        return [];
      default:
        // Fallback: treat unknown as DANG_XU_LY
        return ['DANG_GIAO_HANG', 'DA_HUY'];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy đơn hàng</h2>
        <button
          onClick={() => navigate('/staff/dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay về Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IoArrowBack className="text-2xl text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Chi tiết đơn hàng #{order.maDonHang || order.soDonHang || order.id || id}
              </h1>
              <p className="text-gray-600">
                Ngày đặt: {formatDate(order.ngayDatHang || order.ngayTao || order.ngayDat || order.createdAt || order.orderDate || order.ngayDatHangStr)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <IoPrint />
              In đơn hàng
            </button>
            <button
              onClick={handleUpdateStatus}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <IoCreate />
              Cập nhật trạng thái
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <IoCheckmarkCircle className="text-blue-600" />
                Trạng thái đơn hàng
              </h2>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.trangThaiDonHang || order.trangThai || order.status)}`}>
                  {getStatusLabel(order.trangThaiDonHang || order.trangThai || order.status)}
                </span>
                <div className="text-sm text-gray-600">
                  <IoTime className="inline mr-1" />
                  Cập nhật: {formatDate(order.ngayCapNhat || order.ngaySua || order.updatedAt || order.modifiedDate)}
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <IoCube className="text-blue-600" />
                Sản phẩm
              </h2>
              <div className="space-y-4">
                {(order.chiTietDonHangList || order.chiTietDonHangs || order.items || order.orderDetails || []).map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.bienTheSanPham?.sanPham?.tenSanPham ||
                          item.sanPham?.tenSanPham ||
                          item.productName ||
                          item.tenSanPham ||
                          'Sản phẩm'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.bienTheSanPham?.tenBienThe ||
                          item.tenBienThe ||
                          item.variantName ||
                          'Biến thể mặc định'}
                      </p>
                      <p className="text-sm text-gray-500">
                        SKU: {item.bienTheSanPham?.sku || item.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right min-w-[220px]">
                      {(() => {
                        const qty = item.soLuong || item.quantity || 0;
                        const unitOriginal = getNum(item, ['donGiaGoc', 'giaGoc', 'donGiaTruocGiam', 'priceOriginal', 'giaBan']);
                        const unitFinal = getNum(item, ['donGiaThucTe', 'donGiaSauGiam', 'price', 'donGia']);
                        const discVoucher = getNum(item, ['giamGiaVoucher', 'voucherDiscount']);
                        const discVip = getNum(item, ['giamGiaVip', 'vipDiscount']);
                        const discPromo = getNum(item, ['giamGiaKhuyenMai', 'promotionDiscount', 'giamGiaApDung']);
                        const lineDiscountTotal = getNum(item, ['tongGiamGia', 'totalDiscount']) || (discVoucher + discVip + discPromo) * qty;

                        return (
                          <div className="space-y-0.5">
                            <p className="text-sm text-gray-600">Số lượng: {qty}</p>
                            {unitOriginal > 0 && unitOriginal > unitFinal && (
                              <p className="text-xs text-gray-500 line-through">{formatCurrency(unitOriginal)}</p>
                            )}
                            <p className="font-semibold text-gray-900">{formatCurrency(unitFinal || unitOriginal)}</p>
                            {(discPromo > 0 || discVoucher > 0 || discVip > 0 || lineDiscountTotal > 0) && (
                              <div className="mt-1 text-xs">
                                {discPromo > 0 && (
                                  <div className="text-orange-600">- KM: {formatCurrency(discPromo)} /sp</div>
                                )}
                                {discVoucher > 0 && (
                                  <div className="text-green-600">- Voucher: {formatCurrency(discVoucher)} /sp</div>
                                )}
                                {discVip > 0 && (
                                  <div className="text-blue-600">- VIP: {formatCurrency(discVip)} /sp</div>
                                )}
                              </div>
                            )}
                            <p className="text-sm font-bold text-blue-600">
                              = {formatCurrency((unitFinal || unitOriginal) * qty)}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}

                {(!order.chiTietDonHangList && !order.chiTietDonHangs && !order.items && !order.orderDetails) && (
                  <div className="text-center py-8 text-gray-500">
                    Không có sản phẩm nào trong đơn hàng
                  </div>
                )}

                {((order.chiTietDonHangList || order.chiTietDonHangs || order.items || order.orderDetails || []).length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Không có sản phẩm nào trong đơn hàng
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <IoCash className="text-blue-600" />
                Tổng quan thanh toán
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(order.tongTienGoc || order.tongTien || order.tamTinh || order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Giảm giá:</span>
                  <span className="text-red-600">
                    -{formatCurrency(order.tongGiamGia || order.tienGiam || order.giamGia || order.discount || 0)}
                  </span>
                </div>
                {/* Extra discount breakdowns when available */}
                {(getNum(order, ['giamGiaVip', 'GiamGiaVip']) > 0 || getNum(order, ['giamGiaVoucher', 'GiamGiaVoucher']) > 0 || getNum(order, ['giamGiaDiem', 'GiamGiaDiem']) > 0) && (
                  <div className="pl-2 space-y-1 text-sm">
                    {getNum(order, ['giamGiaVip', 'GiamGiaVip']) > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>• Giảm VIP</span>
                        <span>-{formatCurrency(getNum(order, ['giamGiaVip', 'GiamGiaVip']))}</span>
                      </div>
                    )}
                    {getNum(order, ['giamGiaVoucher', 'GiamGiaVoucher']) > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>• Giảm voucher</span>
                        <span>-{formatCurrency(getNum(order, ['giamGiaVoucher', 'GiamGiaVoucher']))}</span>
                      </div>
                    )}
                    {getNum(order, ['giamGiaDiem', 'GiamGiaDiem']) > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>• Giảm do dùng điểm</span>
                        <span>-{formatCurrency(getNum(order, ['giamGiaDiem', 'GiamGiaDiem']))}</span>
                      </div>
                    )}
                  </div>
                )}
                {order.voucherCode && (
                  <div className="flex justify-between text-gray-600">
                    <span>Voucher:</span>
                    <span className="font-medium">{order.voucherCode}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển/Dịch vụ:</span>
                  <span>{formatCurrency(order.phiVanChuyen || order.phiShip || order.shippingFee || order.chiPhiDichVu || 0)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">
                    {formatCurrency(
                      order.tongTienSauGiam ||
                      order.thanhTien ||
                      order.total ||
                      order.tongTien ||
                      0
                    )}
                  </span>
                </div>
                {/* Loyalty points summary */}
                {(getNum(order, ['diemThuongDaDung', 'diemDaDung', 'soDiemSuDung', 'diemSuDung']) > 0 || (order?.voucherCode || getNum(order, ['giamGiaVip', 'GiamGiaVip']) > 0 || getNum(order, ['DiemThuongNhanDuoc', 'diemThuongNhanDuoc']) >= 0)) && (
                  <div className="mt-4 border-t pt-3 space-y-1 text-sm">
                    {getNum(order, ['diemThuongDaDung', 'diemDaDung', 'soDiemSuDung', 'diemSuDung']) > 0 && (
                      <div className="flex justify-between">
                        <span>Điểm đã dùng</span>
                        <span className="font-medium text-purple-700">{getNum(order, ['diemThuongDaDung', 'diemDaDung', 'soDiemSuDung', 'diemSuDung'])}</span>
                      </div>
                    )}
                    {typeof (order?.DiemThuongNhanDuoc ?? order?.diemThuongNhanDuoc) !== 'undefined' && (
                      <div className="flex justify-between">
                        <span>Điểm nhận được</span>
                        <span className="font-medium text-green-700">{order.DiemThuongNhanDuoc ?? order.diemThuongNhanDuoc ?? 0}</span>
                      </div>
                    )}
                    {getNum(order, ['giamGiaVip', 'GiamGiaVip']) > 0 && (
                      <div className="text-xs text-blue-600">
                        Ưu đãi VIP được áp dụng{order?.khachHang?.hangThanhVien?.tenHang ? `: ${order.khachHang.hangThanhVien.tenHang}` : order?.khachHang?.capBac ? `: ${order.khachHang.capBac}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Customer Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <IoPerson className="text-blue-600" />
                Thông tin khách hàng
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <IoPerson className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Họ tên</p>
                    <p className="font-medium text-gray-900">
                      {order.khachHang?.hoTen || order.tenKhachHang || order.customerName || 'Khách lẻ'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IoCall className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                    <p className="font-medium text-gray-900">
                      {order.khachHang?.soDienThoai || order.soDienThoaiKhachHang || order.customerPhone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IoMail className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {order.khachHang?.email || order.emailKhachHang || order.customerEmail || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <IoLocation className="text-blue-600" />
                Địa chỉ giao hàng
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Người nhận</p>
                  <p className="font-medium text-gray-900">
                    {order.thongTinGiaoHang?.tenNguoiNhan || order.receiverName || order.tenKhachHang || order.khachHang?.hoTen || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium text-gray-900">
                    {order.thongTinGiaoHang?.sdtNguoiNhan || order.receiverPhone || order.soDienThoaiKhachHang || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Địa chỉ</p>
                  <p className="font-medium text-gray-900">
                    {order.thongTinGiaoHang?.diaChiGiaoHang || order.shippingAddress || order.diaChiGiaoHang || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <IoCash className="text-blue-600" />
                Phương thức thanh toán
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {order.hinhThucThanhToan || order.phuongThucThanhToan || order.phuongThucTT || order.paymentMethod || 'Chưa xác định'}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Trạng thái thanh toán:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${(order.trangThaiThanhToan || order.paymentStatus) === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {getPaymentStatusLabel(order.trangThaiThanhToan || order.paymentStatus || 'UNPAID')}
                    </span>
                  </div>
                  <button
                    onClick={handleUpdatePaymentStatus}
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <IoCash />
                    Xử lý thanh toán
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(order.ghiChu || order.notes) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Ghi chú</h2>
                <p className="text-gray-700">{order.ghiChu || order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cập nhật trạng thái đơn hàng
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn trạng thái mới
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Chọn trạng thái --</option>
                {getNextValidStatuses(normalizeStatusForUI(order?.trangThaiDonHang || order?.trangThai || order?.status)).map(code => {
                  const option = statusOptions.find(o => o.value === code);
                  if (!option) return null;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={updating || !newStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Update Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cập nhật trạng thái thanh toán
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn trạng thái mới
              </label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Chọn trạng thái --</option>
                {paymentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={updatingPayment}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={updatePaymentStatus}
                disabled={updatingPayment || !newPaymentStatus}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updatingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
