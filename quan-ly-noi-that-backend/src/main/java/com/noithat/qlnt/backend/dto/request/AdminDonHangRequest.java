package com.noithat.qlnt.backend.dto.request;

import lombok.Data;
import java.util.List;

/**
 * Permissive request DTO for admin-created orders. The frontend admin UI may send a
 * lighter-weight payload (optional customer id or only phone/name). This DTO is
 * intentionally lenient and the controller will map it to the validated
 * DonHangRequest before calling the service.
 */
@Data
public class AdminDonHangRequest {
    private Integer maKhachHang;
    private String tenKhachHang;
    private String soDienThoai;
    private String diaChiGiaoHang;

    // Cart details - reuse ThanhToanRequest shape for each line
    private List<ThanhToanRequest> chiTietDonHangList;

    // Voucher / points fields (frontend naming varies, controller will translate)
    private String maVoucherCode;
    private Integer diemThuongSuDung; // preferred name
    private Integer giamGiaDiemThuong; // fallback name sent by some frontends

    private String phuongThucThanhToan;
    private String ghiChu;
    private String trangThai;
}
