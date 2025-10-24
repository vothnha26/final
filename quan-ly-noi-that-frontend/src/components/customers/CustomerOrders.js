import React, { useState, useEffect } from 'react';
import { IoSearch, IoEye, IoRefresh, IoLocation, IoTime, IoCheckmarkCircle, IoClose } from 'react-icons/io5';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

// Mapping functions for API field names (supports camelCase and snake_case)
const mapOrderFromApi = (order) => {
  if (!order || typeof order !== 'object') return null;

  const id = order.maDonHang ?? order.ma_don_hang ?? order.id ?? order.maDonHang;
  const orderDate = order.ngayDatHang ?? order.ngay_dat ?? order.orderDate ?? order.ngayDatHang;
  // Normalize backend status values to client-friendly keys used in the UI
  const rawStatus = order.trangThai ?? order.trang_thai ?? order.status ?? '';
  const normalizeStatus = (s) => {
    if (s == null) return 'processing';
    const v = String(s).trim().toLowerCase();
    if (!v) return 'processing';
    if (['processing', 'dang xu ly', 'đang xử lý', 'xac_nhan', 'xac-nhan', 'cho_xac_nhan', 'cho xac nhan', 'pending', 'cho_xu_ly', 'cho xu ly'].includes(v)) return 'processing';
    if (['shipping', 'shipped', 'dang_giao', 'dang giao', 'đang giao', 'dang_giao_hang', 'dang-giao-hang', 'đang giao hàng'].includes(v)) return 'shipping';
    if (['da_giao_hang', 'da giao hang', 'đã giao hàng'].includes(v)) return 'delivered';
    if (['delivered', 'completed', 'hoan_thanh', 'hoàn thành', 'hoan thanh'].includes(v) || v.includes('hoan')) return 'completed';
    if (['cancelled', 'canceled', 'huy', 'hủy', 'da huy', 'đã hủy', 'huy_bo', 'da_huy'].includes(v)) return 'cancelled';
    return 'processing';
  };
  const status = normalizeStatus(rawStatus);
  const total = order.tongTienGoc ?? order.tong_tien ?? order.total ?? order.thanhTien ?? order.thanh_tien;
  const shippingFee = order.chiPhiDichVu ?? order.chi_phi_dich_vu ?? order.phi_giao_hang ?? order.phiGiaoHang;
  const discount = order.giamGiaVoucher ?? order.giam_gia ?? order.discount;
  const finalTotal = order.thanhTien ?? order.thanh_tien ?? order.finalTotal ?? total;
  const customerId = order.khachHang?.maKhachHang ?? order.khach_hang_id ?? order.customerId ?? null;
  const customerName = order.tenKhachHang ?? order.ten_khach_hang ?? order.customerName ?? null;
  const customerPhone = order.sdtKhachHang ?? order.sdt_khach_hang ?? order.customerPhone ?? null;
  const shippingAddress = order.diaChiGiaoHang ?? order.dia_chi_giao_hang ?? order.shippingAddress ?? null;
  const paymentMethod = order.phuongThucThanhToan ?? order.phuong_thuc_thanh_toan ?? order.paymentMethod ?? null;
  const paymentStatus = order.trangThaiThanhToan ?? order.trang_thai_thanh_toan ?? order.paymentStatus ?? null;
  const paymentPaid = (paymentStatus && String(paymentStatus).toLowerCase().includes('paid')) || Boolean(order.daThanhToan ?? order.isPaid ?? order.thanhToan);
  const trackingNumber = order.maVanDon ?? order.ma_van_don ?? order.trackingNumber ?? null;
  const carrier = order.donViVanChuyen ?? order.don_vi_van_chuyen ?? order.carrier ?? null;

  const rawItems = order.chiTietDonHangList ?? order.chi_tiet_don_hang ?? order.items ?? [];
  const items = Array.isArray(rawItems) ? rawItems.map((item) => ({
    id: item.maBienThe ?? item.san_pham_id ?? item.id ?? item.maBienThe ?? item.bienTheId,
    name: item.tenSanPham ?? item.ten_san_pham ?? item.name ?? item.tenSanPham ?? 'N/A',
    price: item.donGia ?? item.don_gia ?? item.price ?? item.donGia ?? 0,
    quantity: item.soLuong ?? item.so_luong ?? item.quantity ?? item.soLuong ?? 0,
    total: item.thanhTien ?? item.thanh_tien ?? item.total ?? 0,
    image: item.hinhAnh ?? item.hinh_anh ?? item.image ?? null,
    variant: item.bienThe ?? item.bien_the ?? item.variant ?? null
  })) : [];

  const notes = order.ghiChu ?? order.ghi_chu ?? order.notes ?? null;
  const estimatedDelivery = order.ngayGiaoHangDuKien ?? order.ngay_giao_hang_du_kien ?? order.estimatedDelivery ?? null;
  const actualDelivery = order.ngayGiaoHangThucTe ?? order.ngay_giao_hang_thuc_te ?? order.actualDelivery ?? null;

  return {
    id,
    orderDate,
    status,
    total,
    shippingFee,
    discount,
    finalTotal,
    customerId,
    customerName,
    customerPhone,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    paymentPaid,
    trackingNumber,
    carrier,
    items,
    notes,
    estimatedDelivery,
    actualDelivery
  };
};

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [cancelingId, setCancelingId] = useState(null);

  const auth = useAuth();

  // API Functions
  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      let customerId = null;
      if (auth && auth.user) {
        customerId = auth.user?.maKhachHang ?? auth.user?.ma_khach_hang ?? auth.user?.id ?? null;
      } else {
        // fallback to localStorage if auth context not available yet
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try { const u = JSON.parse(userStr); customerId = u?.maKhachHang ?? u?.ma_khach_hang ?? u?.id ?? null; } catch (e) { }
        }
      }

      if (!customerId) {
        // No logged-in customer: nothing to fetch
        setOrders([]);
        setLoading(false);
        return;
      }
      const response = await api.get(`/api/v1/khach-hang/${customerId}/don-hang`);
      // api.get returns parsed body directly. But some endpoints may wrap in { data: ... }
      const raw = response && typeof response === 'object' && 'data' in response ? response.data : response;
      const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.orders ?? []);
      setOrders((Array.isArray(list) ? list : []).map(mapOrderFromApi));
    } catch (error) {
      setError('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getOrderDetail = async (orderId) => {
    // Try to find in cached orders first
    const cached = orders.find(o => String(o.id) === String(orderId));
    if (cached) return cached;

    try {
      const response = await api.get(`/api/banhang/donhang/${orderId}`);
      const raw = response && typeof response === 'object' && 'data' in response ? response.data : response;
      return mapOrderFromApi(raw);
    } catch (error) {
      throw new Error('Không thể tải chi tiết đơn hàng');
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      // try to get a friendly name for nguoiThayDoi from cached orders
      const cached = orders.find(o => String(o.id) === String(orderId));
      const nguoiThayDoi = cached?.customerName || cached?.customerId || 'Khách hàng';

      // Backend expects POST to the order status controller
      const response = await api.post(`/api/v1/quan-ly-trang-thai-don-hang/${orderId}/cancel`, { nguoiThayDoi, ghiChu: 'Hủy đơn hàng bởi khách' });
      // api.request may return parsed JSON or raw text when backend returned malformed JSON.
      let raw = response && typeof response === 'object' && 'data' in response ? response.data : response;
      // If raw is a string (malformed JSON), attempt to extract a JSON-looking substring, otherwise assume success.
      if (typeof raw === 'string') {
        try {
          // Try to parse what we can
          raw = JSON.parse(raw);
        } catch (e) {
          // fallback: return a stub that marks the order cancelled
          return { id: orderId, status: 'cancelled' };
        }
      }
      const updatedRaw = raw?.order ?? raw;
      return mapOrderFromApi(updatedRaw);
    } catch (error) {
      // bubble meaningful server message when available
      const msg = error?.data?.message || error?.message || 'Không thể hủy đơn hàng';
      throw new Error(msg);
    }
  };

  const confirmReceive = async (order) => {
    try {
      const userStr = localStorage.getItem('user');
      let customerId = null;
      if (userStr) {
        try { const u = JSON.parse(userStr); customerId = u?.maKhachHang ?? u?.id ?? null; } catch (e) { }
      }
      if (!customerId) {
        setError('Vui lòng đăng nhập để xác nhận nhận hàng');
        return;
      }

      await api.post(`/api/v1/khach-hang/${customerId}/don-hang/${order.id}/xac-nhan-nhan-hang`);
      // Refresh list and detail
      await fetchCustomerOrders();
      if (selectedOrder && String(selectedOrder.id) === String(order.id)) {
        const updated = await getOrderDetail(order.id);
        setSelectedOrder(updated);
      }
      setError('');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Không thể xác nhận nhận hàng';
      setError(msg);
    }
  };

  const trackOrder = async (orderId) => {
    try {
      const response = await api.get(`/api/v1/theo-doi-don-hang/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error('Không thể theo dõi đơn hàng');
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, [auth]);

  const statusConfig = {
    processing: {
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      icon: IoTime,
      label: 'Đang xử lý'
    },
    shipping: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      icon: IoLocation,
      label: 'Đang giao hàng'
    },
    delivered: {
      color: 'text-green-600',
      bg: 'bg-green-100',
      icon: IoCheckmarkCircle,
      label: 'Đã giao hàng'
    },
    completed: {
      color: 'text-green-800',
      bg: 'bg-green-200',
      icon: IoCheckmarkCircle,
      label: 'Hoàn thành'
    },
    cancelled: {
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: IoClose,
      label: 'Đã hủy'
    }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.processing;
  };

  const handleViewDetail = async (order) => {
    try {
      const detail = await getOrderDetail(order.id);

      // try to fetch tracking/shipping details and merge so the UI shows address/tracking
      try {
        const trackingPayload = await trackOrder(order.id);
        const tracking = trackingPayload || {};
        const merged = {
          ...detail,
          trackingNumber: tracking.ma_van_don ?? tracking.maVanDon ?? detail.trackingNumber,
          carrier: tracking.don_vi_van_chuyen ?? tracking.donViVanChuyen ?? detail.carrier,
          shippingAddress: detail.shippingAddress || tracking.dia_chi_giao_hang || tracking.diaChiGiaoHang || detail.shippingAddress,
          estimatedDelivery: tracking.ngay_giao_hang_du_kien ?? tracking.ngayGiaoHangDuKien ?? detail.estimatedDelivery,
          actualDelivery: tracking.ngay_giao_hang_thuc_te ?? tracking.ngayGiaoHangThucTe ?? detail.actualDelivery,
          trackingHistory: tracking.lich_su_van_chuyen ?? []
        };
        setSelectedOrder(merged);
      } catch (e) {
        // if tracking fetch fails, still show basic details
        setSelectedOrder(detail);
      }
      setShowOrderDetail(true);
    } catch (err) {
      setError('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleTrackOrder = async (order) => {
    try {
      const history = await trackOrder(order.id);
      // API may return array or object; normalize to array
      setTrackingHistory(Array.isArray(history) ? history : (history?.events || []));
      setSelectedOrder(order);
      setShowTracking(true);
    } catch (err) {
      setError('Không thể lấy thông tin vận chuyển');
    }
  };

  const handleCancelOrder = async (order) => {
    // Ask for confirmation before cancelling
    const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn hàng #${order.id}?`);
    if (!confirmed) return;

    setCancelingId(order.id);
    try {
      const updated = await cancelOrder(order.id);
      // Refresh order list to reflect server state
      await fetchCustomerOrders();
      setError('');
      // Optionally keep selectedOrder updated if detail modal is open
      if (selectedOrder && String(selectedOrder.id) === String(order.id)) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      const msg = err?.message || 'Không thể hủy đơn hàng';
      setError(msg);
    } finally {
      setCancelingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const idStr = order.id !== undefined && order.id !== null ? String(order.id) : '';
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = idStr.toLowerCase().includes(lowerSearch) ||
      (Array.isArray(order.items) && order.items.some(item => (item.name || '').toLowerCase().includes(lowerSearch)));
    let matchesStatus = false;
    if (selectedStatus === 'all') matchesStatus = true;
    else if (selectedStatus === 'paid') matchesStatus = Boolean(order.paymentPaid);
    else matchesStatus = order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusSteps = (status) => {
    // Normalize and determine progression
    const s = status || 'processing';
    const isProcessing = s === 'processing';
    const isShipping = s === 'shipping';
    const isDelivered = s === 'delivered' || s === 'completed';

    return [
      {
        id: 'processing',
        label: 'Đang xử lý',
        completed: true,
        active: isProcessing
      },
      {
        id: 'shipping',
        label: 'Đang giao hàng',
        completed: isShipping || isDelivered,
        active: isShipping
      },
      {
        id: 'delivered',
        label: 'Đã giao hàng',
        completed: isDelivered,
        active: isDelivered
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Theo dõi đơn hàng</h1>
          <p className="text-gray-600">Xem trạng thái và theo dõi đơn hàng của bạn</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-64">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipping">Đang giao hàng</option>
                <option value="delivered">Đã giao hàng</option>
                <option value="paid">Đã thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="mb-4 text-center text-gray-600">Đang tải đơn hàng...</div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            const steps = getStatusSteps(order.status);

            return (
              <div key={order.id ?? JSON.stringify(order)} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Đơn hàng #{order.id}</h3>
                        <p className="text-sm text-gray-500">Đặt ngày: {order.orderDate}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                        <p className="text-sm text-gray-500">{order.items.length} sản phẩm</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={item.id ?? index} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">📦</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Status Steps */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                      const circleClass = step.completed
                        ? 'bg-primary text-white'
                        : step.active
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-200 text-gray-600';
                      const labelClass = step.active || step.completed ? 'text-gray-900' : 'text-gray-500';
                      const connectorClass = (step.completed || step.active) ? 'bg-primary' : 'bg-gray-300';
                      return (
                        <div key={step.id} className="flex items-center">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${circleClass}`}>
                            {step.completed && !step.active ? (
                              <IoCheckmarkCircle className="w-4 h-4" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`ml-2 text-sm font-medium ${labelClass}`}>
                            {step.label}
                          </span>
                          {index < steps.length - 1 && (
                            <div className={`w-16 h-0.5 mx-4 ${connectorClass}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Địa chỉ giao hàng</h4>
                      <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                    </div>

                    {/* Tracking Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Thông tin vận chuyển</h4>
                      {order.trackingNumber ? (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Mã vận đơn: <span className="font-medium">{order.trackingNumber}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Dự kiến giao: {order.estimatedDelivery}
                          </p>
                          {order.actualDelivery && (
                            <p className="text-sm text-green-600">
                              Đã giao: {order.actualDelivery}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Chưa có thông tin vận chuyển</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleViewDetail(order)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <IoEye className="w-4 h-4" />
                      Xem chi tiết
                    </button>
                    {order.trackingNumber && (
                      <button
                        onClick={() => handleTrackOrder(order)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        <IoRefresh className="w-4 h-4" />
                        Theo dõi vận chuyển
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                          Đánh giá sản phẩm
                        </button>
                        <button onClick={() => confirmReceive(order)} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Xác nhận đã nhận hàng
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancelingId === order.id}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${cancelingId === order.id ? 'bg-red-400 cursor-wait' : 'bg-red-600 hover:bg-red-700'} text-white`}
                      >
                        {cancelingId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi tiết đơn hàng #{selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Thông tin đơn hàng</h4>
                      <p className="text-sm text-gray-600">Ngày đặt: {selectedOrder.orderDate}</p>
                      <p className="text-sm text-gray-600">Tổng tiền: {selectedOrder.total.toLocaleString('vi-VN')} VNĐ</p>
                      <p className="text-sm text-gray-600">Mã vận đơn: {selectedOrder.trackingNumber || 'Chưa có'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Địa chỉ giao hàng</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sản phẩm</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-sm text-gray-600">
                            {item.quantity} x {item.price.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Trạng thái</h4>
                    {(() => {
                      const statusInfo = getStatusInfo(selectedOrder.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <span className={`px-2 py-1 text-sm font-semibold rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                  {selectedOrder.trackingNumber && (
                    <button
                      onClick={() => {
                        setShowOrderDetail(false);
                        setShowTracking(true);
                      }}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Theo dõi vận chuyển
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Modal */}
        {showTracking && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Theo dõi vận chuyển #{selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setShowTracking(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Mã vận đơn</h4>
                    <p className="text-blue-800 font-mono text-lg">{selectedOrder.trackingNumber}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Lịch sử vận chuyển</h4>
                    <div className="space-y-4">
                      {trackingHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">Chưa có lịch sử vận chuyển</p>
                      ) : (
                        trackingHistory.map((step, index) => {
                          const statusInfo = getStatusInfo(step.status || step.state || 'processing');
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div key={index} className="flex items-start space-x-4">
                              <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                                <StatusIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-gray-900">{statusInfo.label}</h5>
                                  <span className="text-sm text-gray-500">{step.time || step.timestamp || step.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{step.description || step.note || ''}</p>
                                <p className="text-sm text-gray-500 mt-1">{step.location || step.place || ''}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowTracking(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      setShowTracking(false);
                      setShowOrderDetail(true);
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Xem chi tiết đơn hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;

