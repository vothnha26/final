package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.response.DonHangResponse;
import com.noithat.qlnt.backend.entity.LichSuTrangThaiDonHang;
import com.noithat.qlnt.backend.service.IDonHangService;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal controller to support frontend order tracking routes used by the customer UI.
 * Provides two endpoints:
 * - GET /api/v1/theo-doi-don-hang/{maDonHang}
 * - GET /api/v1/theo-doi-don-hang/ma-van-don/{maVanDon}
 */
@RestController
@RequestMapping("/api/v1/theo-doi-don-hang")
@RequiredArgsConstructor
public class OrderTrackingController {

    private final IDonHangService donHangService;
    private final IQuanLyTrangThaiDonHangService orderStatusService;

    @GetMapping("/{maDonHang}")
    public ResponseEntity<?> getTrackingByOrderId(@PathVariable Integer maDonHang) {
        try {
            DonHangResponse resp = donHangService.getDonHangById(maDonHang);
            if (resp == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> payload = buildTrackingPayloadFromResponse(resp);
            
            // Get order status history and format for frontend
            List<LichSuTrangThaiDonHang> history = orderStatusService.getOrderStatusHistory(maDonHang);
            List<Map<String, Object>> formattedHistory = history.stream().map(h -> {
                Map<String, Object> item = new HashMap<>();
                item.put("trang_thai", h.getTrangThaiMoi());
                item.put("mo_ta", h.getLyDoThayDoi() != null ? h.getLyDoThayDoi() : "Đơn hàng " + h.getTrangThaiMoi());
                item.put("vi_tri", h.getViTriHienTai());
                item.put("thoi_gian", h.getThoiGianThayDoi());
                item.put("ghi_chu", h.getGhiChu());
                return item;
            }).toList();
            
            payload.put("lich_su_van_chuyen", formattedHistory);

            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    private Map<String, Object> buildTrackingPayloadFromResponse(DonHangResponse resp) {
        Map<String, Object> p = new HashMap<>();
        p.put("ma_don_hang", resp.getMaDonHang());
        p.put("trang_thai", resp.getTrangThai());
        p.put("ten_khach_hang", resp.getTenKhachHang());
        p.put("sdt_khach_hang", resp.getSoDienThoaiKhachHang());
        p.put("email_khach_hang", resp.getEmailKhachHang());
        p.put("dia_chi_giao_hang", resp.getDiaChiGiaoHang());
        p.put("ngay_dat_hang", resp.getNgayDatHangStr() != null ? resp.getNgayDatHangStr() : resp.getNgayDatHang());
        p.put("ngay_giao_hang_du_kien", null);
        p.put("ngay_giao_hang_thuc_te", null);
        
        // Order totals and discounts
        p.put("tong_tien_goc", resp.getTongTienGoc());
        p.put("giam_gia_voucher", resp.getGiamGiaVoucher());
        p.put("giam_gia_diem_thuong", resp.getGiamGiaDiemThuong());
        p.put("giam_gia_vip", resp.getGiamGiaVip());
        p.put("tong_giam_gia", resp.getTongGiamGia());
        p.put("chi_phi_dich_vu", resp.getChiPhiDichVu());
        p.put("thanh_tien", resp.getThanhTien());
        p.put("diem_thuong_su_dung", resp.getDiemThuongSuDung());
        p.put("diem_thuong_nhan_duoc", resp.getDiemThuongNhanDuoc());
        p.put("mien_phi_van_chuyen", resp.getMienPhiVanChuyen());
        p.put("voucher_code", resp.getVoucherCode());
        p.put("phuong_thuc_thanh_toan", resp.getPhuongThucThanhToan());
        p.put("trang_thai_thanh_toan", resp.getTrangThaiThanhToan());
        
        // Products and services
        p.put("san_pham", resp.getChiTietDonHangList());
        p.put("don_hang_dich_vu_list", resp.getDonHangDichVuList());
        
        return p;
    }
}
