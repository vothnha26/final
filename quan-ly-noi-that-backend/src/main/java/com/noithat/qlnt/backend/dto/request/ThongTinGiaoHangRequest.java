package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThongTinGiaoHangRequest {

    // ----- THÔNG TIN ĐƠN HÀNG CỐT LÕI -----
    private Integer maKhachHang;
    private String phuongThucThanhToan;
    private List<ThanhToanRequest> chiTietDonHangList;

    // ----- THÔNG TIN NGƯỜI NHẬN -----
    @JsonAlias({ "tenNguoiNhan", "ten_nguoi_nhan" })
    private String tenNguoiNhan;
    private String soDienThoaiNhan; // << THÊM MỚI
    private String diaChiGiaoHang;
    private String ghiChu;

    // ----- THÔNG TIN VẬN CHUYỂN & KHUYẾN MÃI -----

    // >> BỎ: private Integer maPhuongThucGiaoHang;
    private String phuongThucGiaoHang; // Giữ lại trường String để nhận "Giao hàng nhanh", "Tiêu chuẩn"...
    private String configKeyShip; // Config key để lấy phí ship từ cấu hình hệ thống (SHIPPING_FEE_EXPRESS hoặc SHIPPING_FEE_STANDARD)

    // >> BỎ: private Integer maVoucherCode;
    // >> SỬA TÊN VÀ KIỂU DỮ LIỆU: thành String cho đúng
    private String maVoucherCode;

    private Integer diemThuongSuDung;
}