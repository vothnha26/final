package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO cho việc hiển thị thông tin chi tiết của một hóa đơn.
 */
@Data
public class HoaDonChiTietResponse {

    // --- Thông tin hóa đơn ---
    private String soHoaDon;
    private LocalDateTime ngayXuat;
    private String nhanVienXuat;
    private String trangThaiThanhToan;

    // --- Thông tin đơn hàng liên quan ---
    private String maDonHang;
    private String tenKhachHang;
    private LocalDateTime ngayDat;

    // --- Thông tin tài chính ---
    private BigDecimal tongTienThanhToan;
}