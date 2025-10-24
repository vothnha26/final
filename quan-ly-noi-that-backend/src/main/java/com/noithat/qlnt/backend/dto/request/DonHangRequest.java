package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class DonHangRequest {

    // Allow null for guest/admin-created orders; backend will handle missing customer
    private Integer maKhachHang;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<ThanhToanRequest> chiTietDonHangList; // Tận dụng lại DTO này để nhận giỏ hàng

    // ----- THÔNG TIN THANH TOÁN -----
    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String phuongThucThanhToan;

    private String maVoucherCode; // Mã code voucher dạng chuỗi (vd: SALE100K)
    
    @Min(value = 0, message = "Điểm thưởng sử dụng phải là số không âm")
    private Integer diemThuongSuDung = 0;
    
    @Min(value = 0, message = "Điểm thưởng nhận được phải là số không âm")
    private Integer diemThuongNhanDuoc = 0;

    // ----- THÔNG TIN NGƯỜI NHẬN -----
    @NotBlank(message = "Tên người nhận không được để trống")
    private String tenNguoiNhan;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    private String soDienThoaiNhan;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    private String diaChiGiaoHang;

    private String ghiChu;

    // ----- TRẠNG THÁI (Tùy chọn, backend có thể tự set giá trị mặc định) -----
    private String trangThaiDonHang;
    private String trangThaiThanhToan;
}