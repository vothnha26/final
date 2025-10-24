package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.DonHangRequest;
import com.noithat.qlnt.backend.dto.response.DonHangResponse;
import com.noithat.qlnt.backend.dto.response.ThongKeBanHangResponse;

import java.util.List;

public interface IDonHangService {
    DonHangResponse taoDonHang(DonHangRequest request);
    DonHangResponse getDonHangById(Integer id);
    void xoaDonHang(Integer id);
    List<DonHangResponse> getTatCaDonHang();
    List<DonHangResponse> getDonHangByKhachHang(Integer maKhachHang);
    void capNhatTrangThai(Integer id, String trangThai);
    /**
     * Cập nhật trạng thái thanh toán cho đơn hàng.
     * Chấp nhận cả giá trị nội bộ (PAID/UNPAID/PENDING/FAILED) và bản dịch UI
     * (DA_THANH_TOAN/CHUA_THANH_TOAN). Giá trị sẽ được chuẩn hoá trước khi lưu.
     */
    void capNhatTrangThaiThanhToan(Integer id, String trangThaiThanhToan);
    ThongKeBanHangResponse thongKeBanHang();
}
