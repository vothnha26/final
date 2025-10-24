package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO cho việc hiển thị thông tin tóm tắt của hóa đơn trong danh sách.
 */
@Data
public class HoaDonResponse {
    private Integer maHoaDon;
    private String soHoaDon;
    private String maDonHang;
    private String tenKhachHang;
    private LocalDateTime ngayXuat;
    private String nhanVienXuat;
    private BigDecimal tongTien;
    private String trangThaiThanhToan;
}