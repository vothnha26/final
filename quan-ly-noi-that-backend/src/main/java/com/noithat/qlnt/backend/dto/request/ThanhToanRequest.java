package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThanhToanRequest {
    private Integer maBienThe;     // Mã sản phẩm người dùng chọn
    private Integer soLuong;      // Số lượng mỗi sản phẩm
    private BigDecimal donGia;    // Đơn giá đã áp dụng giảm giá (optional, dùng cho admin/staff order)

    // ---- Dành cho bước 2: Thông tin giao hàng ----
    private Integer maKhachHang;          // Khách hàng đang đặt
    private BigDecimal tongTienGoc;       // Tổng tiền gốc từ giỏ hàng
    private String phuongThucGiaoHang;    // VD: "Nhanh", "Tiết kiệm", "Nhận tại cửa hàng"
    private Integer diemSuDung;           // Số điểm thưởng mà KH muốn dùng
    private String diaChiGiaoHang;        // Địa chỉ nhận hàng

    // Có thể thêm các field tùy chọn nếu cần (VD: ghi chú, mã voucher...)
    private String ghiChu;
}
