import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IoSearch, IoLocation, IoTime, IoCheckmarkCircle, IoCar, IoClose, IoRefresh } from 'react-icons/io5';
import api from '../../api';

// Mapping functions for Vietnamese API field names
const mapTrackingFromApi = (tracking) => ({
  orderId: tracking.ma_don_hang || tracking.maDonHang,
  trackingNumber: tracking.ma_van_don || tracking.maVanDon,
  status: tracking.trang_thai || tracking.trangThai,
  carrier: tracking.don_vi_van_chuyen || tracking.donViVanChuyen,
  customerName: tracking.ten_khach_hang || tracking.tenKhachHang,
  customerPhone: tracking.sdt_khach_hang || tracking.soDienThoaiKhachHang,
  customerEmail: tracking.email_khach_hang || tracking.emailKhachHang,
  shippingAddress: tracking.dia_chi_giao_hang || tracking.diaChiGiaoHang,
  estimatedDelivery: tracking.ngay_giao_hang_du_kien || tracking.ngayGiaoHangDuKien,
  actualDelivery: tracking.ngay_giao_hang_thuc_te || tracking.ngayGiaoHangThucTe,
  orderDate: tracking.ngay_dat_hang || tracking.ngayDatHang || tracking.ngayDatHangStr,
  // Order totals and discounts
  tongTienGoc: tracking.tong_tien_goc || tracking.tongTienGoc || 0,
  giamGiaVoucher: tracking.giam_gia_voucher || tracking.giamGiaVoucher || 0,
  giamGiaDiemThuong: tracking.giam_gia_diem_thuong || tracking.giamGiaDiemThuong || 0,
  giamGiaVip: tracking.giam_gia_vip || tracking.giamGiaVip || 0,
  tongGiamGia: tracking.tong_giam_gia || tracking.tongGiamGia || 0,
  chiPhiDichVu: tracking.chi_phi_dich_vu || tracking.chiPhiDichVu || 0,
  thanhTien: tracking.thanh_tien || tracking.thanhTien || 0,
  diemThuongSuDung: tracking.diem_thuong_su_dung || tracking.diemThuongSuDung || 0,
  diemThuongNhanDuoc: tracking.diem_thuong_nhan_duoc || tracking.diemThuongNhanDuoc || 0,
  mienPhiVanChuyen: tracking.mien_phi_van_chuyen || tracking.mienPhiVanChuyen || false,
  voucherCode: tracking.voucher_code || tracking.voucherCode,
  phuongThucThanhToan: tracking.phuong_thuc_thanh_toan || tracking.phuongThucThanhToan,
  trangThaiThanhToan: tracking.trang_thai_thanh_toan || tracking.trangThaiThanhToan,
  trackingHistory: (tracking.lich_su_van_chuyen || []).map(item => ({
    status: item.trang_thai || item.trangThai,
    description: item.mo_ta || item.moTa,
    location: item.vi_tri || item.viTri,
    timestamp: item.thoi_gian || item.thoiGian,
    note: item.ghi_chu || item.ghiChu
  })),
  items: (tracking.san_pham || tracking.chiTietDonHangList || []).map(item => ({
    maSanPham: item.ma_san_pham || item.maSanPham,
    tenSanPham: item.ten_san_pham || item.tenSanPham,
    sku: item.sku,
    soLuong: item.so_luong || item.soLuong,
    donGia: item.don_gia || item.donGia || item.donGiaGoc || item.don_gia_goc,
    donGiaGoc: item.don_gia_goc || item.donGiaGoc || item.giaGoc || item.don_gia || item.donGia,
    donGiaThucTe: item.don_gia_thuc_te || item.donGiaThucTe || item.giaHienThi || item.don_gia || item.donGia,
    thanhTien: item.thanh_tien || item.thanhTien,
    hinhAnh: item.hinh_anh || item.hinhAnh || item.hinhAnhDaiDien
  })),
  services: (tracking.don_hang_dich_vu_list || tracking.donHangDichVuList || []).map(svc => ({
    tenDichVu: svc.ten_dich_vu || svc.tenDichVu,
    chiPhi: svc.chi_phi || svc.chiPhi,
    trangThai: svc.trang_thai || svc.trangThai
  }))
});

const CustomerOrderTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const statusConfig = {
    pending: { color: 'text-gray-600', bg: 'bg-gray-100', icon: IoTime, label: 'Chờ xác nhận' },
    confirmed: { color: 'text-blue-600', bg: 'bg-blue-100', icon: IoCheckmarkCircle, label: 'Đã xác nhận' },
    processing: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Đang xử lý' },
    shipped: { color: 'text-purple-600', bg: 'bg-purple-100', icon: IoCar, label: 'Đã xuất kho' },
    in_transit: { color: 'text-orange-600', bg: 'bg-orange-100', icon: IoLocation, label: 'Đang vận chuyển' },
    delivered: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Đã giao hàng' },
    cancelled: { color: 'text-red-600', bg: 'bg-red-100', icon: IoClose, label: 'Đã hủy' }
  };

  // API Functions
  const searchOrderTracking = async (trackingNumberParam) => {
    try {
      const response = await api.get(`/api/v1/theo-doi-don-hang/ma-van-don/${trackingNumberParam}`);
      const data = response?.data ?? response;
      if (!data) throw new Error('Không tìm thấy thông tin vận đơn');
      return mapTrackingFromApi(data);
    } catch (err) {
      throw new Error('Không tìm thấy thông tin vận đơn');
    }
  };

  const searchOrderById = async (orderId) => {
    // Try multiple endpoints and heuristics so ORD-prefixed or numeric IDs are resolved.
    const tryUrls = [
      `/api/v1/theo-doi-don-hang/${orderId}`,
      `/api/v1/theo-doi-don-hang/ma-don-hang/${orderId}`,
      `/api/v1/banhang/donhang/${orderId}`,
      `/api/banhang/donhang/${orderId}`,
      `/api/orders/${orderId}`,
    ];
    for (const u of tryUrls) {
      try {
        const res = await api.get(u);
        const data = res?.data ?? res;
        if (!data) continue;
        // Backend may return different shapes; normalize to snake_case for mapTrackingFromApi
        const normalized = {
          ma_don_hang: data.maDonHang ?? data.ma_don_hang ?? data.id ?? data.orderId ?? data.maDonHang,
          ma_van_don: data.maVanDon ?? data.ma_van_don ?? data.trackingNumber ?? data.tracking_number,
          trang_thai: data.trangThai ?? data.trang_thai ?? data.status,
          don_vi_van_chuyen: data.donViVanChuyen ?? data.don_vi_van_chuyen ?? data.carrier,
          ten_khach_hang: data.tenKhachHang ?? data.ten_khach_hang ?? data.customerName,
          sdt_khach_hang: data.soDienThoaiKhachHang ?? data.sdt_khach_hang ?? data.customerPhone,
          email_khach_hang: data.emailKhachHang ?? data.email_khach_hang ?? data.customerEmail,
          dia_chi_giao_hang: data.diaChiGiaoHang ?? data.dia_chi_giao_hang ?? data.shippingAddress,
          ngay_dat_hang: data.ngayDatHangStr ?? data.ngayDatHang ?? data.ngay_dat_hang ?? data.orderDate,
          ngay_giao_hang_du_kien: data.ngayGiaoHangDuKien ?? data.ngay_giao_hang_du_kien ?? data.estimatedDelivery,
          ngay_giao_hang_thuc_te: data.ngayGiaoHangThucTe ?? data.ngay_giao_hang_thuc_te ?? data.actualDelivery,
          tong_tien_goc: data.tongTienGoc ?? data.tong_tien_goc,
          giam_gia_voucher: data.giamGiaVoucher ?? data.giam_gia_voucher,
          giam_gia_diem_thuong: data.giamGiaDiemThuong ?? data.giam_gia_diem_thuong,
          giam_gia_vip: data.giamGiaVip ?? data.giam_gia_vip,
          tong_giam_gia: data.tongGiamGia ?? data.tong_giam_gia,
          chi_phi_dich_vu: data.chiPhiDichVu ?? data.chi_phi_dich_vu,
          thanh_tien: data.thanhTien ?? data.thanh_tien,
          diem_thuong_su_dung: data.diemThuongSuDung ?? data.diem_thuong_su_dung,
          diem_thuong_nhan_duoc: data.diemThuongNhanDuoc ?? data.diem_thuong_nhan_duoc,
          mien_phi_van_chuyen: data.mienPhiVanChuyen ?? data.mien_phi_van_chuyen,
          voucher_code: data.voucherCode ?? data.voucher_code,
          phuong_thuc_thanh_toan: data.phuongThucThanhToan ?? data.phuong_thuc_thanh_toan,
          trang_thai_thanh_toan: data.trangThaiThanhToan ?? data.trang_thai_thanh_toan,
          lich_su_van_chuyen: data.lichSuVanChuyen ?? data.lich_su_van_chuyen ?? data.trackingHistory ?? data.timeline ?? [] ,
          san_pham: data.chiTietDonHangList ?? data.items ?? data.san_pham ?? data.products ?? [],
          don_hang_dich_vu_list: data.donHangDichVuList ?? data.don_hang_dich_vu_list ?? data.services ?? []
        };
        const mapped = mapTrackingFromApi(normalized);
        return mapped;
      } catch (err) {
        // try next endpoint
        continue;
      }
    }
    throw new Error('Không tìm thấy đơn hàng');
  };

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      let result;
      // Try searching by tracking number first, then by order ID
      try {
        result = await searchOrderTracking(trackingNumber);
      } catch (error) {
        result = await searchOrderById(trackingNumber);
      }
      
      setSearchResult(result);
    } catch (error) {
      setError(error.message);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search when route provides an id param (e.g. /orders/:id)
  const params = useParams();
  useEffect(() => {
    const id = params?.id;
    if (id) {
      setTrackingNumber(String(id));
      (async () => {
        setIsSearching(true);
        setError('');
        try {
          const result = await searchOrderById(id);
          setSearchResult(result);
        } catch (err) {
          setError(err.message || 'Không tìm thấy');
          setSearchResult(null);
        } finally {
          setIsSearching(false);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  // When no search result, keep searchResult null and show message in UI

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.confirmed;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tra cứu đơn hàng</h1>
          <p className="text-gray-600">Nhập mã vận đơn để theo dõi trạng thái giao hàng</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nhập mã vận đơn (VD: VN123456789)"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !trackingNumber.trim()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <IoRefresh className="w-4 h-4 animate-spin" />
                  Đang tìm kiếm...
                </>
              ) : (
                <>
                  <IoSearch className="w-4 h-4" />
                  Tra cứu
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Result */}
        {searchResult ? (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Đơn hàng #{searchResult.orderId || 'N/A'}
                    </h3>
                    {searchResult.trackingNumber && (
                      <p className="text-sm text-gray-600">
                        Mã vận đơn: {searchResult.trackingNumber}
                      </p>
                    )}
                    {searchResult.orderDate && (
                      <p className="text-sm text-gray-600">
                        Ngày đặt: {searchResult.orderDate}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {(() => {
                      const statusInfo = getStatusInfo(searchResult.status);
                      const IconComponent = statusInfo.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin khách hàng</h4>
                    {searchResult.customerName && <p className="text-sm text-gray-600">{searchResult.customerName}</p>}
                    {searchResult.customerPhone && <p className="text-sm text-gray-600">📞 {searchResult.customerPhone}</p>}
                    {searchResult.customerEmail && <p className="text-sm text-gray-600">✉️ {searchResult.customerEmail}</p>}
                    {searchResult.shippingAddress && <p className="text-sm text-gray-600 mt-2">📍 {searchResult.shippingAddress}</p>}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin giao hàng</h4>
                    {searchResult.carrier && (
                      <p className="text-sm text-gray-600">
                        <strong>Đơn vị vận chuyển:</strong> {searchResult.carrier}
                      </p>
                    )}
                    {searchResult.estimatedDelivery && (
                      <p className="text-sm text-gray-600">
                        <strong>Dự kiến giao:</strong> {searchResult.estimatedDelivery}
                      </p>
                    )}
                    {searchResult.actualDelivery && (
                      <p className="text-sm text-gray-600">
                        <strong>Thực tế giao:</strong> {searchResult.actualDelivery}
                      </p>
                    )}
                    {searchResult.phuongThucThanhToan && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Thanh toán:</strong> {searchResult.phuongThucThanhToan}
                      </p>
                    )}
                    {searchResult.trangThaiThanhToan && (
                      <p className="text-sm text-gray-600">
                        <strong>Trạng thái thanh toán:</strong> {searchResult.trangThaiThanhToan}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Products List */}
              {searchResult.items && searchResult.items.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Sản phẩm đã đặt</h4>
                  <div className="space-y-3">
                    {searchResult.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        {item.hinhAnh && (
                          <img 
                            src={item.hinhAnh} 
                            alt={item.tenSanPham} 
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => { e.target.src = '/placeholder.png'; }}
                          />
                        )}
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.tenSanPham}</h5>
                          <p className="text-sm text-gray-600">Số lượng: {item.soLuong}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.donGiaGoc && item.donGiaThucTe && item.donGiaGoc > item.donGiaThucTe ? (
                              <>
                                <span className="text-sm font-semibold text-blue-600">{formatCurrency(item.donGiaThucTe)}</span>
                                <span className="text-xs text-gray-500 line-through">{formatCurrency(item.donGiaGoc)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-blue-600">{formatCurrency(item.donGiaThucTe || item.donGiaGoc)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(item.thanhTien)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {searchResult.services && searchResult.services.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Dịch vụ kèm theo</h4>
                  <div className="space-y-2">
                    {searchResult.services.map((svc, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{svc.tenDichVu}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(svc.chiPhi)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="p-6 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-4">Tổng kết đơn hàng</h4>
                <div className="space-y-2">
                  {searchResult.tongTienGoc > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="text-gray-900">{formatCurrency(searchResult.tongTienGoc)}</span>
                    </div>
                  )}
                  
                  {searchResult.giamGiaVip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">🌟 Giảm giá VIP:</span>
                      <span className="text-purple-600">-{formatCurrency(searchResult.giamGiaVip)}</span>
                    </div>
                  )}
                  
                  {searchResult.voucherCode && searchResult.giamGiaVoucher > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">🎟️ Voucher ({searchResult.voucherCode}):</span>
                      <span className="text-green-600">-{formatCurrency(searchResult.giamGiaVoucher)}</span>
                    </div>
                  )}
                  
                  {searchResult.diemThuongSuDung > 0 && searchResult.giamGiaDiemThuong > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">⭐ Dùng điểm ({searchResult.diemThuongSuDung} điểm):</span>
                      <span className="text-orange-600">-{formatCurrency(searchResult.giamGiaDiemThuong)}</span>
                    </div>
                  )}
                  
                  {searchResult.tongGiamGia > 0 && (
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span className="text-gray-700">Tổng giảm giá:</span>
                      <span className="text-red-600">-{formatCurrency(searchResult.tongGiamGia)}</span>
                    </div>
                  )}
                  
                  {searchResult.chiPhiDichVu > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Chi phí dịch vụ:</span>
                      <span className="text-gray-900">{formatCurrency(searchResult.chiPhiDichVu)}</span>
                    </div>
                  )}
                  
                  {searchResult.mienPhiVanChuyen && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">🚚 Miễn phí vận chuyển</span>
                      <span className="text-green-600">✓</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold border-t-2 pt-3 mt-3">
                    <span className="text-gray-900">Tổng cộng:</span>
                    <span className="text-blue-600">{formatCurrency(searchResult.thanhTien)}</span>
                  </div>
                  
                  {searchResult.diemThuongNhanDuoc > 0 && (
                    <div className="flex justify-between text-sm bg-yellow-50 p-2 rounded mt-2">
                      <span className="text-yellow-800">💰 Điểm thưởng nhận được:</span>
                      <span className="text-yellow-800 font-semibold">{searchResult.diemThuongNhanDuoc} điểm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Lịch sử giao hàng</h4>
                <div className="space-y-4">
                  {(searchResult.trackingHistory || []).length > 0 ? (
                    (searchResult.trackingHistory || []).map((step, index) => {
                      const statusInfo = getStatusInfo(step.status);
                      const IconComponent = statusInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">{statusInfo.label}</h5>
                              <span className="text-sm text-gray-500">{step.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            {step.location && <p className="text-sm text-gray-500 mt-1">{step.location}</p>}
                            {step.note && <p className="text-sm text-gray-400 mt-1 italic">{step.note}</p>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Chưa có thông tin vận chuyển</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Cần hỗ trợ?</h3>
          <p className="text-blue-800 mb-4">
            Nếu bạn không tìm thấy đơn hàng hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Liên hệ hỗ trợ
            </button>
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
              Gọi hotline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderTracking;

