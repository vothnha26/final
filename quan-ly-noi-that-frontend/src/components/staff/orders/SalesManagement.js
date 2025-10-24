import React, { useState, useEffect, useCallback } from 'react';
import { useRef } from 'react';
import { IoAdd, IoSearch, IoTrash, IoCart, IoReceipt, IoTime, IoCheckmark, IoChevronDown, IoChevronForward, IoPencil, IoSave, IoEye } from 'react-icons/io5';
import api from '../../../api';
import { useNavigate } from 'react-router-dom';
import Toast from '../../shared/Toast';
import InvoiceModal from './InvoiceModal';

const SalesManagement = () => {
  const [orderSummary, setOrderSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map sales data from API (compute items first so subtotal/total can fall back to items sum)
  const mapSalesFromApi = useCallback((sale) => {
    // unify customer object reference across possible payload shapes
    const kh = sale?.khachHang ?? sale?.khach_hang ?? sale?.customer ?? sale?.khach ?? null;
    const items = (sale.chiTietDonHangList || []).map(item => ({
      name: item.bienTheSanPham?.sanPham?.tenSanPham ?? item.sanPham?.tenSanPham ?? item.tenSanPham ?? item.ten ?? item.name ?? item.bienTheSanPham?.ten ?? '',
      sku: item.bienTheSanPham?.sku ?? item.sku ?? '',
      quantity: Number(item.soLuong ?? item.quantity ?? item.so_luong ?? 0),
      price: Number(item.donGia ?? item.price ?? item.giaBan ?? item.unitPrice ?? 0)
    }));

    const itemsSum = items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.price || 0)), 0);

    const reportedSubtotal = Number(sale.tongTien ?? sale.subtotal ?? 0);
    const subtotal = (reportedSubtotal && !Number.isNaN(reportedSubtotal) && reportedSubtotal > 0) ? reportedSubtotal : itemsSum;

    // Prefer backend-provided totals when available
    const backendTongGiamGia = sale.tongGiamGia ?? sale.tong_giam_gia ?? sale.tongGiamgia ?? sale.totalDiscount ?? null;

    // compute discount as sum of voucher + points + vip discounts when backend total not provided
    const voucherDiscount = Number(sale.giam_gia_voucher ?? sale.giamGiaVoucher ?? sale.tienGiamVoucher ?? 0);
    const pointsDiscount = Number(sale.giam_gia_diem_thuong ?? sale.giamGiaDiemThuong ?? sale.tienGiamTuDiem ?? 0);
    const vipDiscount = Number(sale.giam_gia_vip ?? sale.giamGiaVip ?? 0);
    const rawDiscount = Number(sale.giamGia ?? sale.discount ?? 0);
    const computedDiscount = (rawDiscount && rawDiscount > 0) ? rawDiscount : (voucherDiscount + pointsDiscount + vipDiscount);
    const discount = (backendTongGiamGia !== null && backendTongGiamGia !== undefined) ? Number(backendTongGiamGia) : computedDiscount;

    const diemThuongNhanDuoc = Number(sale.diemThuongNhanDuoc ?? sale.diem_thuong_nhan_duoc ?? sale.diemThuongNhan ?? sale.diemVipThuong ?? 0);

    const reportedTotal = Number(sale.tongTienSauGiam ?? sale.total ?? sale.tongCong ?? sale.tongTien ?? 0);
    const total = (reportedTotal && !Number.isNaN(reportedTotal) && reportedTotal > 0) ? reportedTotal : Math.max(0, itemsSum - discount);

    return {
      // Normalize identifier: backend may return maDonHang, maBanHang or id
      id: sale.maDonHang ?? sale.maBanHang ?? sale.id,
      orderNumber: sale.maDonHang ?? sale.orderNumber ?? String(sale.id ?? ''),
      customerName: (
        kh?.hoTen ??
        kh?.tenKhachHang ??
        kh?.ten ??
        sale.tenKhachHang ??
        sale.hoTen ??
        (typeof kh === 'string' ? kh : undefined) ??
        sale.customerName ??
        ''
      ),
      // Try multiple common fields for phone and address
      customerPhone: (
        kh?.soDienThoai ??
        kh?.so_dien_thoai ??
        kh?.soDienThoaiKhachHang ??
        kh?.so_dien_thoai_khach_hang ??
        kh?.dienThoai ??
        kh?.dien_thoai ??
        kh?.sdt ??
        kh?.phone ??
        kh?.mobile ??
        sale.soDienThoai ??
        sale.so_dien_thoai ??
        sale.soDienThoaiKhachHang ??
        sale.so_dien_thoai_khach_hang ??
        sale.sdt ??
        sale.phone ??
        sale.mobile ??
        sale.soDienThoaiNhan ??
        sale.so_dien_thoai_nhan ??
        sale.soDienThoaiNguoiNhan ??
        sale.nguoiNhanSoDienThoai ??
        sale.customerPhone ??
        ''
      ),
      address: (
        sale.diaChiGiaoHang ??
        sale.dia_chi_giao_hang ??
        sale.diaChiNhanHang ??
        sale.dia_chi_nhan_hang ??
        sale.diaChi ??
        sale.dia_chi ??
        kh?.diaChi ??
        kh?.dia_chi ??
        sale.address ??
        ''
      ),
      items,
      subtotal,
      discount,
      total,
      // expose backend discount breakdown if available
      giamGiaVoucher: voucherDiscount,
      giamGiaDiemThuong: pointsDiscount,
      giamGiaVip: vipDiscount,
      diemThuongNhanDuoc,
      tongGiamGia: (backendTongGiamGia !== null && backendTongGiamGia !== undefined) ? Number(backendTongGiamGia) : undefined,
      status: normalizeStatus(sale.trangThai ?? sale.status),
      paymentMethod: normalizePaymentMethod(sale.phuongThucThanhToan ?? sale.paymentMethod),
      paymentStatus: normalizePaymentStatus(sale.trangThaiThanhToan ?? sale.paymentStatus),
      // try multiple fields for creation time (may be in various shapes). Prefer server-provided formatted string when available
      createdAt: (sale.ngayDatHangStr ?? sale.ngayDatHang ?? sale.ngayTao ?? sale.createdAt ?? sale.ngayTaoGio ?? sale.thoiGianTao ?? sale.created_at ?? sale.createdDate) ?? '',
      notes: sale.ghiChu ?? sale.notes ?? ''
    };
  }, []);

  // Normalizers
  const normalizeStatus = (raw) => {
    if (raw === null || raw === undefined) return 'pending';
    const s = String(raw).trim().toLowerCase();
    if (!s) return 'pending';
    // map common variants and backend constants
    if (['pending', 'cho xac nhan', 'chờ xác nhận', 'chờ xử lý', 'cho xu ly', 'cho-xac-nhan', 'cho_xac_nhan', 'cho_xu_ly'].includes(s)) return 'pending';
    if (['processing', 'dang xu ly', 'đang xử lý', 'dang-xu-ly', 'dang_xu_ly', 'xac_nhan', 'xac-nhan', 'xacnhan', 'xac nhan', 'xác nhận'].includes(s)) return 'processing';
    if (['preparing', 'dang_chuan_bi', 'dang chuan bi', 'đang chuẩn bị', 'dang-chuan-bi', 'dang chuan bi'].includes(s)) return 'processing';
    if (
      ['shipping', 'dang giao', 'đang giao', 'dang-giao', 'dang_giao', 'dang giao', 'dang_giao_hang', 'đang giao hàng'].includes(s)
      || s === 'dang_giao' || s === 'dang giao' || s === 'dang_giao_hang'
    ) return 'shipping';
    if (['completed', 'hoan thanh', 'hoàn thành', 'completed', 'hoan_thanh', 'hoan-thanh', 'hoant hanh'].includes(s)) return 'completed';
    if (['cancelled', 'huy', 'hủy', 'da huy', 'đã hủy', 'huy_bo', 'huy-bo', 'huybo', 'da_huy'].includes(s)) return 'cancelled';
    // backend constant names - explicit mappings
    if (s === 'cho_xu_ly') return 'pending';
    if (s === 'dang_xu_ly') return 'processing';
    if (s === 'dang_giao_hang') return 'shipping';
    if (s === 'da_giao_hang') return 'delivered';
    if (s === 'hoan_thanh') return 'completed';
    if (s === 'da_huy') return 'cancelled';
    return 'pending';
  };

  const normalizePaymentMethod = (raw) => {
    if (!raw && raw !== '') return 'cash';
    const p = String(raw).trim().toLowerCase();
    if (['card', 'thẻ', 'the', 'card_payment'].includes(p)) return 'card';
    // treat many server variants as cash by default
    return 'cash';
  };

  const normalizePaymentStatus = (raw) => {
    if (raw == null) return 'unpaid';
    const s = String(raw).trim().toUpperCase();
    if (['PAID', 'DA_THANH_TOAN'].includes(s)) return 'paid';
    if (['UNPAID', 'CHUA_THANH_TOAN'].includes(s)) return 'unpaid';
    if (['PENDING'].includes(s)) return 'pending';
    if (['FAILED'].includes(s)) return 'failed';
    return 'unpaid';
  };

  // Fetch sales/orders and products
  // mapSalesFromApi is stable (useCallback) so it's safe to include in deps
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ordersData = await api.get('/api/banhang/donhang').catch(() => []);
        // product/variant list is fetched separately when opening the Create Order modal to prefer variant search

        if (Array.isArray(ordersData)) {
          setOrders(ordersData.map(mapSalesFromApi));
        }

        // productsData not used in admin flow; skip
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [mapSalesFromApi]);



  // modal/state must be declared before effects that reference it
  const [variants, setVariants] = useState([]);
  const [variantQuery, setVariantQuery] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { maVoucherCode, giamGiaVoucher, type, value, maxDiscount }
  const [availableVouchers, setAvailableVouchers] = useState([]); // List of applicable vouchers for customer

  // API Functions
  const createOrder = async (orderData) => {
    // Use admin-friendly endpoint which accepts a permissive payload from staff UI
    const response = await api.post('/api/banhang/donhang/admin', orderData);
    return response;
  };

  // NOTE: legacy helper not used anymore after switching to unified endpoints
  // const updateOrder = async (id, orderData) => {
  //   const response = await api.put(`/api/banhang/donhang/${id}`, orderData);
  //   return response;
  // }

  const deleteOrder = async (id) => {
    const response = await api.del(`/api/banhang/donhang/${id}`);
    return response;
  };

  const [orders, setOrders] = useState([]);

  // get logged-in user (staff) from AuthContext to identify who updates statuses
  // removed AuthContext usage for status updates; backend endpoint only needs trangThai

  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [createStep, setCreateStep] = useState(1); // 1 = chọn sản phẩm, 2 = thông tin & review
  // fetch variants when the Create Order modal opens so admin can search/select specific product variants
  useEffect(() => {
    if (!showCreateOrderModal) return;

    let active = true;
    const fetchVariants = async (q = '') => {
      try {
        const res = await api.get(`/api/v1/admin/san-pham/search?q=${encodeURIComponent(q || '')}`);
        if (!active) return;
        if (Array.isArray(res)) {
          setVariants(res.map(v => ({
            maBienThe: v.maBienThe ?? v.ma_bien_the ?? v.id ?? v.ma,
            sku: v.sku ?? v.maBienThe ?? '',
            tenSanPham: v.tenSanPham ?? v.ten ?? '',
            giaBan: Number(v.giaBan ?? v.gia ?? 0),
            giaSauGiam: Number(v.giaSauGiam ?? v.giaBan ?? v.gia ?? 0),
            soTienGiam: Number(v.soTienGiam ?? 0),
            soLuongTon: Number(v.soLuongTon ?? v.stock ?? 0),
            attributes: v.attributes ?? v.giaTriThuocTinhs ?? v.gia_tri_thuoc_tinhs ?? []
          })));
        }
      } catch (e) {
        if (active) setVariants([]);
      }
    };

    fetchVariants('');
    return () => { active = false; };
  }, [showCreateOrderModal]);
  const navigate = useNavigate();
  // detail modal no longer used; we navigate to /staff/orders/:id instead
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set()); // store expanded order ids
  const [statusDrafts, setStatusDrafts] = useState({}); // { [orderId]: 'pending'|'processing'|... }
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    items: [{ name: '', maBienThe: null, quantity: 1, price: 0 }],
    discount: 0,
    maKhachHang: null,
    pointsUsed: 0,
    paymentMethod: 'cash',
    notes: ''
  });

  // Reset pagination when filters/search change (must be after state declarations)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPayment]);

  const [foundCustomer, setFoundCustomer] = useState(null); // { maKhachHang, tenKhachHang, soDienThoai, diemTichLuy }

  // Import Toast for notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', title) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type,
      title: title || (type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : 'Thông báo'),
      message,
      isVisible: true,
      duration: 5000
    };
    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipping': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Sẵn sàng';
      case 'shipping': return 'Đang giao';
      case 'delivered': return 'Đã giao hàng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getPaymentStatusColor = (ps) => {
    switch (ps) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'unpaid':
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (ps) => {
    switch (ps) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thanh toán lỗi';
      case 'unpaid':
      default: return 'Chưa thanh toán';
    }
  };

  // Fetch applicable vouchers for a customer based on current subtotal
  const fetchAvailableVouchers = async (maKhachHang) => {
    if (!maKhachHang) {
      setAvailableVouchers([]);
      return;
    }
    try {
      const subtotal = (newOrder.items || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
      const res = await api.get(`/api/thanhtoan/applicable-vouchers?maKhachHang=${maKhachHang}&tongTienDonHang=${subtotal}`);
      const list = Array.isArray(res) ? res : [];
      const normalized = list.map(v => ({
        maVoucher: v.maVoucher ?? v.id,
        maVoucherCode: v.maCode ?? v.maVoucherCode ?? v.code,
        loaiGiamGia: (v.loaiGiamGia || '').toUpperCase().includes('PERCENT') ? 'PERCENT' : 'FIXED',
        giaTri: parseFloat((v.giaTriGiam ?? v.giaTri ?? 0).toString()),
        giaTriToiDa: parseFloat((v.giaTriGiamToiDa ?? v.giaTriToiDa ?? 0).toString()),
        giaTriDonHangToiThieu: parseFloat((v.giaTriDonHangToiThieu ?? 0).toString()),
        tenVoucher: v.tenVoucher || ''
      }));
      setAvailableVouchers(normalized);
    } catch (err) {
      setAvailableVouchers([]);
    }
  };

  // Refresh available vouchers when customer or items change
  useEffect(() => {
    if (foundCustomer?.maKhachHang) {
      fetchAvailableVouchers(foundCustomer.maKhachHang);
    } else {
      setAvailableVouchers([]);
    }
  }, [foundCustomer?.maKhachHang, newOrder.items]);

  // (dropdown chuyển trạng thái đã bỏ để gọn UI)

  const formatDate = (value) => {
    if (!value) return '';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString('vi-VN');
  };

  const handleCreateOrder = async () => {
    try {
      // Basic client-side validation for required receiver fields (backend also validates)
      if (!newOrder.customerName || !newOrder.customerPhone || !newOrder.address) {
        alert('Vui lòng điền tên khách hàng, số điện thoại và địa chỉ giao hàng.');
        return;
      }

      // Build admin-friendly payload; keep it minimal but include required fields
      const adminOrder = {
        maKhachHang: newOrder.maKhachHang || (foundCustomer && foundCustomer.maKhachHang) || null,
        tenKhachHang: newOrder.customerName || (foundCustomer && foundCustomer.tenKhachHang) || 'Khách lẻ',
        soDienThoai: newOrder.customerPhone || (foundCustomer && foundCustomer.soDienThoai) || null,
        diaChiGiaoHang: newOrder.address || (foundCustomer && foundCustomer.diaChi) || null,
        chiTietDonHangList: newOrder.items.map(item => ({
          maBienThe: item.maBienThe,
          soLuong: Number(item.quantity || 1),
          donGia: Number(item.price || 0) // Include the calculated price (with discount applied)
        })),
        maVoucherCode: appliedVoucher?.maVoucherCode || voucherCode || null,
        diemThuongSuDung: Number(newOrder.pointsUsed || 0),
        phuongThucThanhToan: newOrder.paymentMethod || 'cash',
        ghiChu: newOrder.notes,
        trangThai: 'PENDING'
      };

      const createResp = await createOrder(adminOrder);

      // Extract order ID from response
      const createdOrder = createResp?.data || createResp;
      const maDonHang = createdOrder?.maDonHang ?? createdOrder?.id ?? createdOrder?.order?.maDonHang ?? createdOrder?.order?.id;

      // If backend returned an order id, send admin notification to persist ThongBao
      try {
        if (maDonHang) {
          const payload = {
            loai: 'order',
            tieuDe: `Đơn hàng mới #${maDonHang}`,
            noiDung: `Đơn hàng ${maDonHang} được tạo bởi nhân viên`,
            nguoiNhanId: null,
            loaiNguoiNhan: 'ALL',
            duongDanHanhDong: `/admin/orders/${maDonHang}`,
            doUuTien: 'normal',
            lienKetId: maDonHang,
            loaiLienKet: 'DON_HANG'
          };
          await api.post('/api/v1/thong-bao', payload);
        }
      } catch (notifyErr) {
      }

      // Show success notification
      showToast(`Đơn hàng #${maDonHang || 'mới'} đã được tạo thành công!`, 'success', 'Tạo đơn hàng thành công');

      // Reset form and close modal
      setNewOrder({
        customerName: '',
        customerPhone: '',
        address: '',
        items: [],
        discount: 0,
        paymentMethod: 'cash',
        notes: ''
      });
      setShowCreateOrderModal(false);
      setCreateStep(1);
      setFoundCustomer(null);
      setAppliedVoucher(null);
      setVoucherCode('');
      setOrderSummary(null);

      // Navigate to order detail page
      if (maDonHang) {
        // Small delay to allow modal to close and toast to show
        setTimeout(() => {
          navigate(`/staff/orders/${maDonHang}`);
        }, 500);
      } else {
        // If no order ID, refresh the order list
        const data = await api.get('/api/banhang/donhang');
        if (Array.isArray(data)) {
          setOrders(data.map(mapSalesFromApi));
        }
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo đơn hàng!';
      showToast(errorMsg, 'error', 'Lỗi tạo đơn hàng');
    }
  };

  const handleAddItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { name: '', maBienThe: null, quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setNewOrder(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  // Voucher functions: apply (server-validated) and clear
  // Fetch checkout summary from backend
  const fetchCheckoutSummary = async () => {
    if (!newOrder.items || newOrder.items.length === 0) {
      setOrderSummary(null);
      return;
    }
    // Filter out items without valid maBienThe
    const chiTietDonHang = newOrder.items
      .filter(item => item.maBienThe != null)
      .map(item => ({
        maBienThe: item.maBienThe,
        soLuong: Number(item.quantity || 1)
      }));
    if (chiTietDonHang.length === 0) {
      setOrderSummary(null);
      return;
    }
    const payload = {
      chiTietDonHang,
      maKhachHang: newOrder?.maKhachHang || foundCustomer?.maKhachHang || null,
      diemSuDung: Number(newOrder.pointsUsed || 0),
      maVoucherCode: appliedVoucher?.maVoucherCode || voucherCode || null,
      configKeyShip: null
    };
    try {
      const res = await api.post('/api/thanhtoan/checkout-summary', payload);
      // Normalize key cases from backend (may return PascalCase)
      const normalized = {
        tamTinh: Number(res?.tamTinh ?? res?.TamTinh ?? 0),
        giamGiaVip: Number(res?.giamGiaVip ?? res?.GiamGiaVip ?? 0),
        giamGiaVoucher: Number(res?.giamGiaVoucher ?? res?.GiamGiaVoucher ?? 0),
        giamGiaDiem: Number(res?.giamGiaDiem ?? res?.GiamGiaDiem ?? 0),
        phiGiaoHang: res?.phiGiaoHang ?? res?.PhiGiaoHang ?? null,
        tongCong: Number(res?.tongCong ?? res?.TongCong ?? 0),
        diemThuongNhanDuoc: Number(res?.diemThuongNhanDuoc ?? res?.DiemThuongNhanDuoc ?? 0),
        rewardMoneyPerPoint: Number(res?.rewardMoneyPerPoint ?? res?.RewardMoneyPerPoint ?? 100000),
        rewardPointPerMoney: Number(res?.rewardPointPerMoney ?? res?.RewardPointPerMoney ?? 10),
        raw: res
      };
      setOrderSummary(normalized);
    } catch (err) {
      setOrderSummary(null);
    }
  };

  // Auto-fetch summary when items, voucher, or points change
  useEffect(() => {
    fetchCheckoutSummary();
    // eslint-disable-next-line
  }, [newOrder.items, appliedVoucher, newOrder.pointsUsed, foundCustomer, newOrder.maKhachHang]);
  const applyVoucher = async () => {
    if (!voucherCode || voucherCode.trim() === '') {
      alert('Vui lòng nhập mã voucher');
      return;
    }

    try {
      // Compose minimal request similar to customer checkout: maKhachHang is optional for admin flow
      const subtotal = newOrder.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
      const payload = { maKhachHang: null, maVoucherCode: voucherCode.trim(), orderAmountForCheck: subtotal };
      const res = await api.post('/api/thanhtoan/apply-voucher', payload).catch(err => err?.data || err);
      if (!res) {
        alert('Không thể áp dụng voucher lúc này');
        return;
      }
      if (!res.success) {
        alert(res.message || 'Voucher không hợp lệ');
        return;
      }
      // res.giamGiaVoucher is the discount amount
      setAppliedVoucher({ maVoucherCode: res.maVoucherCode || voucherCode.trim(), giamGiaVoucher: Number(res.giamGiaVoucher || 0), raw: res });
      // distribute discount proportionally to items for preview
      distributeVoucherDiscount(Number(res.giamGiaVoucher || 0));
      showToast('Áp dụng voucher thành công');
    } catch (err) {
      alert('Lỗi khi áp dụng voucher');
    }
  };

  // Helper to apply voucher by code directly (used by voucher list buttons)
  const applyVoucherByCode = async (code) => {
    setVoucherCode(code);
    try {
      const subtotal = newOrder.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
      const payload = { maKhachHang: foundCustomer?.maKhachHang || null, maVoucherCode: code.trim(), orderAmountForCheck: subtotal };
      const res = await api.post('/api/thanhtoan/apply-voucher', payload).catch(err => err?.data || err);
      if (!res) {
        alert('Không thể áp dụng voucher lúc này');
        return;
      }
      if (!res.success) {
        alert(res.message || 'Voucher không hợp lệ');
        return;
      }
      setAppliedVoucher({ maVoucherCode: res.maVoucherCode || code.trim(), giamGiaVoucher: Number(res.giamGiaVoucher || 0), raw: res });
      distributeVoucherDiscount(Number(res.giamGiaVoucher || 0));
    } catch (err) {
      alert('Lỗi khi áp dụng voucher');
    }
  };

  // Customer lookup by phone (used in admin Create Order modal)
  const fetchCustomerByPhone = async (phone) => {
    if (!phone) return null;
    try {
      // Try exact match endpoint first, fallback to search by keyword
      const res = await api.get(`/api/v1/khach-hang/by-phone/${encodeURIComponent(phone)}`).catch(() => null) || await api.get(`/api/v1/khach-hang/search?keyword=${encodeURIComponent(phone)}`).catch(() => null);
      if (!res) return null;
      // backend might return array or single object
      const cust = Array.isArray(res) ? (res[0] || null) : res;
      if (!cust) return null;
      const mapped = {
        maKhachHang: cust.maKhachHang ?? cust.id ?? cust.customerId ?? cust.ma_khach_hang,
        tenKhachHang: cust.tenKhachHang ?? cust.hoTen ?? cust.name,
        soDienThoai: cust.soDienThoai ?? cust.phone ?? cust.sdt,
        // Backend stores loyalty points as `diemThuong` (or diem_thuong). Accept many variants.
        diemTichLuy: Number(
          cust.diemThuong ?? cust.diem_tuong ?? cust.diemTichLuy ?? cust.points ?? cust.loyaltyPoints ?? 0
        )
      };
      setFoundCustomer(mapped);
      // Pre-fill newOrder fields
      setNewOrder(prev => ({ ...prev, customerName: mapped.tenKhachHang || prev.customerName, customerPhone: mapped.soDienThoai || prev.customerPhone, maKhachHang: mapped.maKhachHang }));
      return mapped;
    } catch (err) {
      return null;
    }
  };

  const applyPoints = (points) => {
    const p = Number(points || 0);
    if (!foundCustomer || p <= 0) return;
    // Clamp to available points
    const use = Math.min(p, Number(foundCustomer.diemTichLuy || 0));
    setNewOrder(prev => ({ ...prev, pointsUsed: use }));
    showToast(`Đã áp dụng ${use} điểm`);
  };

  const clearVoucher = () => {
    setVoucherCode('');
    setAppliedVoucher(null);
    // reset item prices to their original variant price if available
    setNewOrder(prev => ({ ...prev, items: prev.items.map(it => ({ ...it, price: it._origPrice ?? it.price })) }));
  };

  const distributeVoucherDiscount = (discountAmount, itemsArg = null) => {
    if (!discountAmount || discountAmount <= 0) return;
    const items = Array.isArray(itemsArg) ? itemsArg : (newOrder.items || []);
    // Use _origPrice when present as the base for computing shares
    const subtotal = items.reduce((s, it) => s + (Number(it._origPrice != null ? it._origPrice : it.price || 0) * Number(it.quantity || 0)), 0);
    if (subtotal <= 0) return;

    // Keep original price snapshot so clearing voucher can restore it
    const updated = items.map(it => ({ ...it, _origPrice: it._origPrice ?? it.price }));

    // For each item, compute its share of the discount proportional to base line total
    const withDistributed = updated.map(it => {
      const baseLine = Number(it._origPrice || it.price) * Number(it.quantity || 0);
      const share = (baseLine / subtotal) * discountAmount;
      const unitDiscount = share / (it.quantity || 1);
      const newPrice = Math.max(0, Number(it._origPrice || it.price) - unitDiscount);
      return { ...it, price: Math.round(newPrice) };
    });

    setNewOrder(prev => ({ ...prev, items: withDistributed }));
  };

  // (Xem chi tiết được gộp vào chế độ mở rộng; không còn dùng điều hướng View)

  const handleEditOrder = (order) => {
    // Expand row and focus status editor
    const id = order?.id ?? order?.orderNumber;
    if (!id) return;
    setExpandedOrders(prev => new Set(prev).add(id));
    setStatusDrafts(prev => ({ ...prev, [id]: order.status }));
  };

  // View full order details page
  const handleViewOrder = (order) => {
    const id = order?.id ?? order?.orderNumber;
    if (!id) return;
    navigate(`/staff/orders/${id}`);
  };

  const toggleExpand = (order) => {
    const id = order?.id ?? order?.orderNumber;
    if (!id) return;
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleProcessPayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleShowInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handleCompletePayment = async () => {
    if (!window.confirm(`Xác nhận đánh dấu đơn hàng #${selectedOrder.orderNumber} là đã thanh toán?`)) {
      return;
    }

    try {
      // Đánh dấu thanh toán là PAID cho đơn hàng đã chọn
      await api.put(`/api/banhang/donhang/${selectedOrder.id}/thanh-toan/trang-thai`, { trangThaiThanhToan: 'PAID' });

      // Làm mới danh sách đơn hàng
      const ordersData = await api.get('/api/banhang/donhang');
      if (Array.isArray(ordersData)) {
        setOrders(ordersData.map(mapSalesFromApi));
      }
      setShowPaymentModal(false);
      showToast(`Đơn hàng #${selectedOrder.orderNumber} đã được đánh dấu là đã thanh toán.`, 'success', 'Cập nhật thành công');
    } catch (err) {
      setError(err);
      const errorMsg = err?.data?.message || err.message || 'Lỗi không xác định';
      showToast(`Không thể cập nhật thanh toán: ${errorMsg}`, 'error', 'Cập nhật thất bại');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status !== 'cancelled') {
      showToast('Chỉ được xóa đơn hàng đã bị hủy.', 'warning', 'Không thể xóa');
      return;
    }
    if (window.confirm(`Xóa vĩnh viễn đơn hàng #${order.orderNumber || orderId}? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteOrder(orderId);
        // Refresh orders data
        const ordersData = await api.get('/api/banhang/donhang');
        if (Array.isArray(ordersData)) {
          setOrders(ordersData.map(mapSalesFromApi));
        }
        showToast('Đã xóa đơn hàng.', 'success');
      } catch (err) {
        setError(err);
        const msg = err?.data?.message || err?.message || 'Không thể xóa đơn hàng';
        showToast(msg, 'error', 'Xóa thất bại');
      }
    }
  };
  // Allowed transitions for status editor
  const getAllowedStatuses = (current) => {
    switch (current) {
      case 'pending':
        return ['pending', 'processing', 'cancelled'];
      case 'processing':
        return ['processing', 'shipping', 'cancelled'];
      case 'shipping':
        return ['shipping', 'delivered', 'cancelled'];
      case 'delivered':
        return ['delivered', 'completed', 'cancelled'];
      case 'completed':
        return ['completed'];
      case 'cancelled':
        return ['cancelled'];
      default:
        return ['pending', 'cancelled'];
    }
  };

  const toBackendStatus = (uiStatus) => {
    switch (uiStatus) {
      case 'pending': return 'CHO_XU_LY';
      case 'processing': return 'DANG_CHUAN_BI';
      case 'shipping': return 'DANG_GIAO_HANG';
      case 'delivered': return 'DA_GIAO_HANG';
      case 'completed': return 'HOAN_THANH';
      case 'cancelled': return 'DA_HUY';
      default: return 'CHO_XU_LY';
    }
  };

  const saveStatusChange = async (order) => {
    const id = order?.id ?? order?.orderNumber;
    if (!id) return;
    const draft = statusDrafts[id] ?? order.status;
    if (!draft || draft === order.status) {
      showToast('Chưa có thay đổi trạng thái.', 'warning', 'Thông báo');
      return;
    }

    const currentStatusText = getStatusText(order.status);
    const newStatusText = getStatusText(draft);
    if (!window.confirm(`Xác nhận chuyển trạng thái đơn hàng #${order.orderNumber} từ "${currentStatusText}" sang "${newStatusText}"?`)) {
      return;
    }

    try {
      await api.put(`/api/banhang/donhang/${id}/trangthai`, { trangThai: toBackendStatus(draft) });
      showToast(`Đơn hàng #${order.orderNumber} đã được chuyển sang trạng thái "${newStatusText}".`, 'success', 'Cập nhật thành công');
      const ordersData = await api.get('/api/banhang/donhang');
      if (Array.isArray(ordersData)) setOrders(ordersData.map(mapSalesFromApi));
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Cập nhật trạng thái thất bại';
      showToast(msg, 'error', 'Lỗi cập nhật');
    }
  };
  // (map UI status -> backend enum constant no longer used here)

  // (hàm đổi trạng thái thủ công được loại bỏ cùng dropdown)

  const filteredOrders = orders.filter(order => {
    const q = String(searchTerm || '').toLowerCase();
    const orderNumber = String(order?.orderNumber ?? '').toLowerCase();
    const customerName = String(order?.customerName ?? '').toLowerCase();
    const customerPhone = String(order?.customerPhone ?? '');
    const hasProductMatch = (order?.items || []).some(it => {
      const name = String(it?.name || '').toLowerCase();
      const sku = String(it?.sku || '');
      return name.includes(q) || sku.includes(searchTerm);
    });

    const matchesSearch = (
      orderNumber.includes(q) ||
      customerName.includes(q) ||
      customerPhone.includes(searchTerm) ||
      hasProductMatch
    );

    const matchesStatus = selectedStatus === 'all' || order?.status === selectedStatus;
    const matchesPayment = selectedPayment === 'all' || order?.paymentStatus === selectedPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination helpers
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Bán hàng</h1>
          <p className="text-gray-600">Tạo đơn hàng và xử lý thanh toán</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <IoTime className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmark className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoReceipt className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doanh thu hôm nay</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders
                    .filter(o => o.status === 'completed')
                    .reduce((sum, o) => sum + o.total, 0)
                    .toLocaleString('vi-VN')}đ
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
                  placeholder="Tìm kiếm đơn hàng hoặc sản phẩm..."
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
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipping">Đang giao</option>
                <option value="delivered">Đã giao hàng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>
            </div>

            {/* Create Order Button */}
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <IoAdd className="w-5 h-5" />
              Tạo đơn hàng
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="mb-4 text-center text-gray-600">Đang tải dữ liệu đơn hàng...</div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {String(error)}
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
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
                {currentPageOrders.map((order, _idx) => {
                  const rowId = `${order.id ?? order.orderNumber ?? 'order'}-${_idx}`;
                  const isExpanded = expandedOrders.has(order.id ?? order.orderNumber);
                  return (
                    <>
                      <tr key={rowId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Thẻ'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <button
                            onClick={() => toggleExpand(order)}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                            title={isExpanded ? 'Thu gọn' : 'Xem chi tiết sản phẩm'}
                          >
                            {isExpanded ? <IoChevronDown className="w-4 h-4" /> : <IoChevronForward className="w-4 h-4" />}
                            <span>{Number(order.items?.length || 0)} sản phẩm</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                          <div>
                            <div>{Number(order.total || 0).toLocaleString('vi-VN')}đ</div>
                            {(order.tongGiamGia || order.tongGiamGia === 0) && (
                              <div className="text-xs text-gray-500">Giảm: {Number(order.tongGiamGia).toLocaleString('vi-VN')}đ</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {getPaymentStatusText(order.paymentStatus)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Xem chi tiết đơn hàng"
                            >
                              <IoEye className="w-4 h-4" />
                            </button>

                            {/* Chỉ hiện nút sửa khi đơn chưa hoàn thành */}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => handleEditOrder(order)}
                                className="text-gray-700 hover:text-gray-900"
                                title="Sửa đơn hàng"
                              >
                                <IoPencil className="w-4 h-4" />
                              </button>
                            )}

                            {/* Hiện nút thanh toán chỉ khi: chờ xử lý VÀ chưa thanh toán */}
                            {order.status === 'pending' && order.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => handleProcessPayment(order)}
                                className="text-green-600 hover:text-green-800"
                                title="Xử lý thanh toán"
                              >
                                <IoReceipt className="w-4 h-4" />
                              </button>
                            )}

                            {/* Hiện nút in hóa đơn khi đơn đã hoàn thành */}
                            {order.status === 'completed' && (
                              <button
                                onClick={() => handleShowInvoice(order)}
                                className="text-purple-600 hover:text-purple-800"
                                title="In hóa đơn"
                              >
                                <IoReceipt className="w-4 h-4" />
                              </button>
                            )}

                            {/* Chỉ được xóa đơn đã hủy */}
                            {order.status === 'cancelled' && (
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Xóa (chỉ đơn đã hủy)"
                              >
                                <IoTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${rowId}-details`} className="bg-gray-50">
                          <td colSpan={6} className="px-6 pb-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="text-sm">
                                  <div className="font-semibold">Khách hàng</div>
                                  <div className="text-gray-900">{order.customerName || '-'}</div>
                                  <div className="text-gray-600">SĐT: {order.customerPhone || '-'}</div>
                                  <div className="text-gray-600">Địa chỉ: {order.address || '-'}</div>
                                  <div className={`mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <div className="font-semibold mb-1">Cập nhật trạng thái</div>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={statusDrafts[order.id ?? order.orderNumber] ?? order.status}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const oid = order.id ?? order.orderNumber;
                                        setStatusDrafts(prev => ({ ...prev, [oid]: val }));
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded"
                                    >
                                      {getAllowedStatuses(order.status).map(s => (
                                        <option key={s} value={s}>{getStatusText(s)}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => saveStatusChange(order)}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded hover:bg-primary/90"
                                    >
                                      <IoSave className="w-4 h-4" />
                                      Lưu
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm font-semibold mb-2">Chi tiết sản phẩm</div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Sản phẩm</th>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Số lượng</th>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Đơn giá</th>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Thành tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(order.items || []).map((it, idx2) => (
                                      <tr key={`item-${rowId}-${idx2}`} className="border-t">
                                        <td className="px-3 py-2 text-gray-900">{it.name || '-'}</td>
                                        <td className="px-3 py-2">{Number(it.quantity || 0)}</td>
                                        <td className="px-3 py-2">{Number(it.price || 0).toLocaleString('vi-VN')}đ</td>
                                        <td className="px-3 py-2 font-medium">{(Number(it.quantity || 0) * Number(it.price || 0)).toLocaleString('vi-VN')}đ</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="bg-white rounded-lg shadow-sm mt-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Hiển thị {totalItems === 0 ? 0 : (startIndex + 1)}–{endIndex} trên tổng {totalItems}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPageSafe <= 1}
                className={`px-3 py-2 rounded-lg border ${currentPageSafe <= 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">Trang {currentPageSafe}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPageSafe >= totalPages}
                className={`px-3 py-2 rounded-lg border ${currentPageSafe >= totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        {/* Create Order Modal */}
        {showCreateOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Tạo đơn hàng mới</h3>
              {/* Step indicator */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full ${createStep === 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>1. Chọn sản phẩm</div>
                <div className={`px-3 py-1 rounded-full ${createStep === 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>2. Thông tin & Xác nhận</div>
              </div>

              {createStep === 1 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Sản phẩm</h4>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-2 text-primary hover:text-primary/80"
                    >
                      <IoAdd className="w-4 h-4" />
                      Thêm sản phẩm
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sản phẩm (tìm theo mã/sku hoặc tên)
                            </label>
                            <input
                              type="search"
                              value={variantQuery}
                              onChange={(e) => setVariantQuery(e.target.value)}
                              placeholder="Gõ mã hoặc tên để lọc"
                              className="mb-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <select
                              value={item.maBienThe ?? ''}
                              onChange={(e) => {
                                const selected = variants.find(v => String(v.maBienThe) === String(e.target.value));
                                // update full items array atomically
                                setNewOrder(prev => {
                                  const updated = (prev.items || []).map((it, i) => {
                                    if (i !== index) return it;
                                    if (selected) {
                                      const orig = Number(selected.giaBan || 0);
                                      const final = Number(selected.giaSauGiam || orig);
                                      return {
                                        ...it,
                                        maBienThe: selected.maBienThe,
                                        name: `${selected.sku || ''} - ${selected.tenSanPham || ''}`,
                                        _origPrice: final < orig ? orig : null, // only show orig if discounted
                                        price: final
                                      };
                                    }
                                    return { ...it, maBienThe: null, name: '', _origPrice: null, price: 0 };
                                  });
                                  return { ...prev, items: updated };
                                });
                                // if voucher applied, re-distribute discount after state settles
                                if (appliedVoucher && Number(appliedVoucher.giamGiaVoucher || 0) > 0) {
                                  setTimeout(() => distributeVoucherDiscount(Number(appliedVoucher.giamGiaVoucher || 0)), 0);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Chọn biến thể</option>
                              {variants
                                .filter(v => {
                                  const q = String(variantQuery || '').trim().toLowerCase();
                                  if (!q) return true;
                                  return (String(v.sku || '').toLowerCase().includes(q) || String(v.tenSanPham || '').toLowerCase().includes(q));
                                })
                                .map(v => {
                                  const giaBan = Number(v.giaBan || 0);
                                  const giaSauGiam = Number(v.giaSauGiam || giaBan);
                                  const hasDiscount = giaSauGiam < giaBan;

                                  return (
                                    <option key={v.maBienThe} value={v.maBienThe}>
                                      {v.sku ? `${v.sku} — ` : ''}{v.tenSanPham} {v.attributes && v.attributes.length ? `(${v.attributes.map(a => a.giaTri || a.value || a).join(',')})` : ''} — {hasDiscount ? `${giaSauGiam.toLocaleString('vi-VN')}đ (Gốc: ${giaBan.toLocaleString('vi-VN')}đ)` : `${giaBan.toLocaleString('vi-VN')}đ`}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Số lượng
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                            <input
                              type="text"
                              value={(Number(item.price || 0)).toLocaleString('vi-VN') + 'đ'}
                              disabled
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-right"
                            />
                            {item._origPrice != null && Number(item._origPrice) > Number(item.price) ? (
                              <div className="mt-1 text-sm text-gray-500">
                                <span className="line-through">{Number(item._origPrice).toLocaleString('vi-VN')}đ</span>
                                <span className="ml-2 text-green-700 font-medium">-{(Number(item._origPrice) - Number(item.price)).toLocaleString('vi-VN')}đ</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">
                            Thành tiền: {(item.quantity * item.price).toLocaleString('vi-VN')}đ
                          </span>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <IoTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => { setShowCreateOrderModal(false); setCreateStep(1); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => { await fetchCheckoutSummary(); setCreateStep(2); }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Tiếp theo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                        <input type="text" value={newOrder.customerName} onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Nhập tên khách hàng" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input type="tel" value={newOrder.customerPhone} onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Nhập số điện thoại" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                        <input type="text" value={newOrder.address} onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Nhập địa chỉ giao hàng" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm khách hàng theo SĐT</label>
                        <div className="flex gap-2">
                          <input type="tel" value={newOrder.customerPhone} onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })} placeholder="Số điện thoại" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                          <button onClick={() => fetchCustomerByPhone(newOrder.customerPhone)} className="px-3 py-2 bg-primary text-white rounded-lg">Tìm</button>
                        </div>
                        {foundCustomer && (
                          <div className="mt-2 text-sm text-gray-700">
                            <div><strong>{foundCustomer.tenKhachHang}</strong> — {foundCustomer.soDienThoai}</div>
                            <div>
                              Điểm tích lũy: <strong>{Number(foundCustomer.diemTichLuy || 0)}</strong>
                              {newOrder.pointsUsed > 0 && (
                                <span className="ml-2 text-orange-600">
                                  (Còn lại: {Number(foundCustomer.diemTichLuy || 0) - Number(newOrder.pointsUsed || 0)})
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <input type="number" min={0} max={foundCustomer.diemTichLuy || 0} value={newOrder.pointsUsed || 0} onChange={(e) => setNewOrder({ ...newOrder, pointsUsed: parseInt(e.target.value) || 0 })} className="px-3 py-2 border border-gray-300 rounded-lg w-28" />
                              <button onClick={() => applyPoints(newOrder.pointsUsed)} className="px-3 py-2 bg-green-600 text-white rounded-lg">Áp dụng điểm</button>
                              <button onClick={() => { setNewOrder({ ...newOrder, pointsUsed: 0 }); setFoundCustomer(null); }} className="px-3 py-2 border border-gray-300 rounded-lg">Xóa</button>
                            </div>
                            {/* Available vouchers list - Show applied voucher in green, hide others */}
                            {availableVouchers.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="text-sm font-medium text-blue-900 mb-2">
                                  {appliedVoucher ? 'Voucher đã chọn:' : 'Voucher khả dụng:'}
                                </div>
                                <div className="space-y-1">
                                  {availableVouchers
                                    .filter(v => !appliedVoucher || v.maVoucherCode === appliedVoucher.maVoucherCode)
                                    .map(v => {
                                      const voucherLabel = v.loaiGiamGia === 'PERCENT'
                                        ? `Giảm ${v.giaTri}% (tối đa ${Number(v.giaTriToiDa || 0).toLocaleString('vi-VN')}đ)`
                                        : `Giảm ${Number(v.giaTri || 0).toLocaleString('vi-VN')}đ`;
                                      const isApplied = appliedVoucher && v.maVoucherCode === appliedVoucher.maVoucherCode;
                                      return (
                                        <button
                                          key={v.maVoucher}
                                          onClick={() => !isApplied && applyVoucherByCode(v.maVoucherCode)}
                                          disabled={isApplied}
                                          className={`w-full text-left px-2 py-1 text-xs rounded ${
                                            isApplied
                                              ? 'bg-green-100 border-2 border-green-500 cursor-default'
                                              : 'bg-white hover:bg-blue-100 border border-blue-300 cursor-pointer'
                                          }`}
                                        >
                                          <div className={`font-semibold ${isApplied ? 'text-green-700' : 'text-blue-700'}`}>
                                            {v.maVoucherCode}
                                            {isApplied && <span className="ml-2">✓</span>}
                                          </div>
                                          <div className={isApplied ? 'text-green-600' : 'text-gray-600'}>{voucherLabel}</div>
                                          {v.giaTriDonHangToiThieu > 0 && (
                                            <div className={isApplied ? 'text-green-500' : 'text-gray-500'}>
                                              Đơn tối thiểu: {Number(v.giaTriDonHangToiThieu).toLocaleString('vi-VN')}đ
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Nhập ghi chú" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Xem trước đơn hàng</h4>
                      <div className="space-y-2">
                        {newOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <div>{item.name || item.maBienThe || 'Sản phẩm chưa chọn'} x{item.quantity}</div>
                              {item._origPrice != null && Number(item._origPrice) > Number(item.price) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="line-through">{Number(item._origPrice).toLocaleString('vi-VN')}đ</span>
                                  <span className="ml-2">→</span>
                                  <span className="ml-2 text-green-700 font-medium">{Number(item.price).toLocaleString('vi-VN')}đ</span>
                                  <span className="ml-2 text-red-600">(-{(Number(item._origPrice) - Number(item.price)).toLocaleString('vi-VN')}đ)</span>
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
                        <div className="flex gap-2">
                          <input type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Nhập mã voucher" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                          <button onClick={applyVoucher} className="px-3 py-2 bg-primary text-white rounded-lg">Áp dụng</button>
                          <button onClick={clearVoucher} className="px-3 py-2 border border-gray-300 rounded-lg">Xóa</button>
                        </div>
                        {appliedVoucher && (
                          <div className="text-sm text-green-600 mt-2">Áp dụng: {appliedVoucher.maVoucherCode} — Giảm {Number(appliedVoucher.giamGiaVoucher || 0).toLocaleString('vi-VN')}đ</div>
                        )}
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-sm"><span>Tạm tính:</span><span>{orderSummary?.tamTinh ? Number(orderSummary.tamTinh).toLocaleString('vi-VN') : newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('vi-VN')}đ</span></div>
                        
                        {/* Voucher Discount with Benefit */}
                        <div>
                          <div className="flex justify-between text-sm text-orange-700">
                            <span>Giảm voucher:</span>
                            <span>-{Number(orderSummary?.giamGiaVoucher || 0).toLocaleString('vi-VN')}đ</span>
                          </div>
                          {orderSummary?.giamGiaVoucher > 0 && appliedVoucher && (
                            <div className="text-xs text-gray-500 ml-4 mt-1">
                              📌 Mã voucher: {appliedVoucher.maVoucherCode}
                              {appliedVoucher.raw?.loaiGiamGia === 'PERCENT' && appliedVoucher.raw?.giaTri && (
                                <span> - Giảm {appliedVoucher.raw.giaTri}%</span>
                              )}
                              {appliedVoucher.raw?.tenVoucher && <span> - {appliedVoucher.raw.tenVoucher}</span>}
                            </div>
                          )}
                        </div>

                        {/* Points Discount with Benefit */}
                        <div>
                          <div className="flex justify-between text-sm text-purple-700">
                            <span>Giảm điểm:</span>
                            <span>-{Number(orderSummary?.giamGiaDiem || 0).toLocaleString('vi-VN')}đ</span>
                          </div>
                          {orderSummary?.giamGiaDiem > 0 && newOrder.pointsUsed > 0 && (
                            <div className="text-xs text-gray-500 ml-4 mt-1">
                              ⭐ Sử dụng {newOrder.pointsUsed.toLocaleString('vi-VN')} điểm tích lũy
                              {foundCustomer?.diemTichLuy && (
                                <span> (Còn lại: {(foundCustomer.diemTichLuy - newOrder.pointsUsed).toLocaleString('vi-VN')} điểm)</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* VIP Discount with Benefit */}
                        <div>
                          <div className="flex justify-between text-sm text-blue-700">
                            <span>Giảm giá VIP:</span>
                            <span>-{Number(orderSummary?.giamGiaVip || 0).toLocaleString('vi-VN')}đ</span>
                          </div>
                          {orderSummary?.giamGiaVip > 0 && foundCustomer && (
                            <div className="text-xs text-gray-500 ml-4 mt-1">
                              👑 Ưu đãi hạng {foundCustomer.hangThanhVien || 'VIP'} cho khách hàng {foundCustomer.tenKhachHang}
                            </div>
                          )}
                        </div>

                        {/* Earned Points with Benefit */}
                        <div>
                          <div className="flex justify-between text-sm text-green-700">
                            <span>Điểm thưởng nhận được:</span>
                            <span>
                              +{
                                (() => {
                                  const diem = Number(orderSummary?.diemThuongNhanDuoc || 0);
                                  if (diem > 0) return diem.toLocaleString('vi-VN');
                                  // Fallback tính toán: (tamTinh / rewardMoneyPerPoint) * rewardPointPerMoney
                                  const tamTinh = Number(orderSummary?.tamTinh || 0);
                                  const moneyPerPoint = Number(orderSummary?.rewardMoneyPerPoint || 100000);
                                  const pointPerMoney = Number(orderSummary?.rewardPointPerMoney || 10);
                                  if (!tamTinh || !moneyPerPoint || moneyPerPoint <= 0 || !pointPerMoney) return '0';
                                  const calc = Math.floor(tamTinh / moneyPerPoint) * pointPerMoney;
                                  return Number(calc).toLocaleString('vi-VN');
                                })()
                              }
                            </span>
                          </div>
                          {(() => {
                            const diem = Number(orderSummary?.diemThuongNhanDuoc || 0);
                            const tamTinh = Number(orderSummary?.tamTinh || 0);
                            const moneyPerPoint = Number(orderSummary?.rewardMoneyPerPoint || 100000);
                            const pointPerMoney = Number(orderSummary?.rewardPointPerMoney || 10);
                            const calcDiem = diem > 0 ? diem : (tamTinh && moneyPerPoint > 0 ? Math.floor(tamTinh / moneyPerPoint) * pointPerMoney : 0);
                            
                            if (calcDiem > 0) {
                              return (
                                <div className="text-xs text-gray-500 ml-4 mt-1">
                                  🎁 Tích lũy điểm thưởng sau khi hoàn thành đơn hàng
                                  {foundCustomer?.diemTichLuy !== undefined && (
                                    <span> (Tổng sau: {(foundCustomer.diemTichLuy - (newOrder.pointsUsed || 0) + calcDiem).toLocaleString('vi-VN')} điểm)</span>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="flex justify-between text-sm border-t pt-2"><span>Tổng giảm:</span><span>-{Number((orderSummary?.giamGiaVoucher || 0) + (orderSummary?.giamGiaDiem || 0) + (orderSummary?.giamGiaVip || 0)).toLocaleString('vi-VN')}đ</span></div>
                        <div className="flex justify-between font-semibold text-lg"><span>Tổng cộng:</span><span>{orderSummary?.tongCong ? Number(orderSummary.tongCong).toLocaleString('vi-VN') : newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('vi-VN')}đ</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button onClick={() => setCreateStep(1)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Quay lại</button>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowCreateOrderModal(false); setCreateStep(1); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Hủy</button>
                      <button onClick={handleCreateOrder} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Tạo đơn hàng</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detail modal removed; use full page at /staff/orders/:id */}

        {/* Payment Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Xử lý thanh toán</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Đơn hàng: {selectedOrder.orderNumber}</h4>
                  <p className="text-gray-600">Khách hàng: {selectedOrder.customerName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Tổng tiền: {(selectedOrder.total || 0).toLocaleString('vi-VN')}đ</h4>
                  {(selectedOrder.tongGiamGia || selectedOrder.giamGiaVoucher || selectedOrder.giamGiaDiemThuong || selectedOrder.giamGiaVip) && (
                    <div className="text-sm text-gray-600 mt-2">
                      <div>Giảm voucher: {Number(selectedOrder.giamGiaVoucher || 0).toLocaleString('vi-VN')}đ</div>
                      <div>Giảm điểm: {Number(selectedOrder.giamGiaDiemThuong || 0).toLocaleString('vi-VN')}đ</div>
                      <div>Giảm VIP: {Number(selectedOrder.giamGiaVip || 0).toLocaleString('vi-VN')}đ</div>
                      {selectedOrder.tongGiamGia !== undefined && (
                        <div className="font-semibold">Tổng giảm: {Number(selectedOrder.tongGiamGia).toLocaleString('vi-VN')}đ</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Phương thức thanh toán</h4>
                  <p className="text-gray-600">
                    {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' :
                      selectedOrder.paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú thanh toán
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập ghi chú thanh toán"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCompletePayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Hoàn tất thanh toán
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <InvoiceModal
          order={selectedOrder}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            isVisible={toast.isVisible}
            onClose={() => removeToast(toast.id)}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
          />
        ))}
      </div>
    </div>
  );
};

export default SalesManagement;


