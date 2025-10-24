package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class DonHangResponse {
    private Integer maDonHang;
    private String tenKhachHang;
    private String soDienThoaiKhachHang; // Customer phone number
    private String emailKhachHang; // Customer email
    private LocalDateTime ngayDatHang;
    private String ngayDatHangStr; // Human-friendly formatted date string
    private BigDecimal tongTienGoc;
    private BigDecimal giamGiaVoucher;
    private Integer diemThuongSuDung; // Số điểm thưởng đã sử dụng
    private BigDecimal giamGiaDiemThuong; // Số tiền giảm giá từ điểm thưởng
    private BigDecimal giamGiaVip; // Số tiền giảm giá từ hạng thành viên VIP
    private Integer diemVipThuong; // Điểm thưởng VIP nhận được từ đơn hàng này
    private Integer diemThuongNhanDuoc; // Điểm thưởng thực tế được cộng cho khách hàng từ đơn này
    private Boolean mienPhiVanChuyen; // Có miễn phí vận chuyển từ VIP không
    private BigDecimal chiPhiDichVu; // Tổng chi phí dịch vụ (vận chuyển, lắp đặt...)
    private BigDecimal thanhTien;
    private BigDecimal tongGiamGia; // Tổng giảm giá (VIP + Voucher + Điểm)
    private String trangThai;
    private String diaChiGiaoHang; // Shipping address, expose for frontend
    private String voucherCode;
    // Payment info for UI
    private String phuongThucThanhToan;
    private String trangThaiThanhToan;
    private List<ChiTietDonHangResponse> chiTietDonHangList;
    private List<DonHangDichVuResponse> donHangDichVuList; // Danh sách dịch vụ
}
