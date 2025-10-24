package com.noithat.qlnt.backend.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThanhToanResponse {
    // Dành cho hiển thị danh sách giao dịch
    private Integer maGiaoDich;
    private String maDonHang;
    private String tenKhachHang;
    private BigDecimal soTien;
    private String phuongThuc;
    private String trangThai;
    private String nguoiXuLy;
    private LocalDateTime ngayGiaoDich;

    // Dành cho hiển thị giỏ hàng / tính toán thanh toán
    private BigDecimal tongTienGoc;       // Tổng tiền sản phẩm
    private BigDecimal chiPhiDichVu;      // Phí vận chuyển
    private BigDecimal giaTriDiem;        // Giá trị quy đổi của điểm thưởng
    private BigDecimal thanhTien;         // Thành tiền cuối cùng sau khi trừ giảm giá + điểm
    private Integer diemSuDung;           // Điểm khách hàng dùng
    private String diaChiGiaoHang;        // Địa chỉ nhận hàng
    private String phuongThucGiaoHang;    // Nhanh / Tiết kiệm / Nhận tại cửa hàng
    private Boolean mienPhiVanChuyen;     // Có được miễn phí vận chuyển (ưu đãi VIP)

    // Constructor phụ (cho việc tạo phản hồi đơn giản)
    public ThanhToanResponse(Integer maDonHang, BigDecimal thanhTien, String trangThai, String phuongThucThanhToan) {
        this.maDonHang = "ORD" + String.format("%03d", maDonHang);
        this.thanhTien = thanhTien;
        this.trangThai = trangThai;
        this.phuongThuc = phuongThucThanhToan;
    }
}
