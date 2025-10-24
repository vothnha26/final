package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.DonHangRequest;
import com.noithat.qlnt.backend.dto.response.DonHangResponse;
import com.noithat.qlnt.backend.dto.response.ThongKeBanHangResponse;
import com.noithat.qlnt.backend.service.IDonHangService;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/banhang")
@RequiredArgsConstructor
public class BanHangController {

    private final IDonHangService donHangService;
    private final IQuanLyTrangThaiDonHangService quanLyTrangThaiDonHangService;
    private final com.noithat.qlnt.backend.service.IKhachHangService khachHangService;
    private final com.noithat.qlnt.backend.repository.KhachHangRepository khachHangRepository;

    @PostMapping("/donhang")
    public ResponseEntity<DonHangResponse> taoDonHang(@Valid @RequestBody DonHangRequest request) {
        return ResponseEntity.ok(donHangService.taoDonHang(request));
    }

    // Admin-friendly order creation: accepts a permissive payload from admin UI,
    // ensures a customer exists (lookup by maKhachHang or phone), fills required
    // receiver fields and delegates to existing taoDonHang service which performs
    // all validation and calculations. This avoids forcing frontend to match
    // DonHangRequest exactly.
    @PostMapping("/donhang/admin")
    public ResponseEntity<DonHangResponse> taoDonHangAdmin(@RequestBody com.noithat.qlnt.backend.dto.request.AdminDonHangRequest adminReq) {
        // 1) Resolve or create customer
        Integer maKhachHang = adminReq.getMaKhachHang();
        com.noithat.qlnt.backend.entity.KhachHang kh = null;
        if (maKhachHang != null) {
            kh = khachHangRepository.findById(maKhachHang).orElse(null);
        }
        if (kh == null && adminReq.getSoDienThoai() != null && !adminReq.getSoDienThoai().isEmpty()) {
            kh = khachHangService.findBySoDienThoai(adminReq.getSoDienThoai());
        }

        // If still null, do NOT auto-create a customer. Treat as guest/admin order.
        // This ensures we only credit loyalty points when an existing customer ID
        // was supplied or an existing customer was found by phone.

        // Map AdminDonHangRequest -> DonHangRequest (fill required fields)
        com.noithat.qlnt.backend.dto.request.DonHangRequest req = new com.noithat.qlnt.backend.dto.request.DonHangRequest();
        if (kh != null) {
            req.setMaKhachHang(kh.getMaKhachHang());
        } else {
            req.setMaKhachHang(null);
        }
        req.setChiTietDonHangList(adminReq.getChiTietDonHangList());
        req.setPhuongThucThanhToan(adminReq.getPhuongThucThanhToan() != null ? adminReq.getPhuongThucThanhToan() : "cash");
        req.setMaVoucherCode(adminReq.getMaVoucherCode());
        // prefer diemThuongSuDung but fall back to giamGiaDiemThuong if provided by frontend
        req.setDiemThuongSuDung(adminReq.getDiemThuongSuDung() != null ? adminReq.getDiemThuongSuDung() : adminReq.getGiamGiaDiemThuong());
        req.setGhiChu(adminReq.getGhiChu());
        req.setTrangThaiDonHang(adminReq.getTrangThai());

    // Receiver info (null-safe): prefer admin-supplied values, otherwise use
    // existing customer values; if neither exists, fall back to empty string
    // to avoid NPE. Note: DonHangRequest uses @NotBlank for these fields,
    // so admin UI should supply them when creating guest orders.
    req.setTenNguoiNhan(adminReq.getTenKhachHang() != null ? adminReq.getTenKhachHang() : (kh != null ? kh.getHoTen() : ""));
    req.setSoDienThoaiNhan(adminReq.getSoDienThoai() != null ? adminReq.getSoDienThoai() : (kh != null ? kh.getSoDienThoai() : ""));
    req.setDiaChiGiaoHang(adminReq.getDiaChiGiaoHang() != null ? adminReq.getDiaChiGiaoHang() : (kh != null ? kh.getDiaChi() : ""));

        return ResponseEntity.ok(donHangService.taoDonHang(req));
    }

    @GetMapping("/donhang")
    public ResponseEntity<List<DonHangResponse>> getTatCaDonHang() {
        return ResponseEntity.ok(donHangService.getTatCaDonHang());
    }

    @GetMapping("/donhang/{id}")
    public ResponseEntity<DonHangResponse> getDonHangById(@PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.getDonHangById(id));
    }

    @DeleteMapping("/donhang/{id}")
    public ResponseEntity<Void> xoaDonHang(@PathVariable Integer id) {
        donHangService.xoaDonHang(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/donhang/{id}/trangthai")
    public ResponseEntity<?> capNhatTrangThai(
        @PathVariable Integer id,
        @RequestBody Map<String, String> body,
        @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String trangThai = body.get("trangThai");
        String nguoiThayDoi = "SYSTEM"; // default
        
        // Extract username from JWT token if available
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                // Simple JWT decode
                String[] parts = token.split("\\.");
                if (parts.length > 1) {
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    // Extract username from payload (assumes JSON like {"sub":"username",...})
                    if (payload.contains("\"sub\"")) {
                        int start = payload.indexOf("\"sub\":\"") + 7;
                        int end = payload.indexOf("\"", start);
                        if (end > start) {
                            nguoiThayDoi = payload.substring(start, end);
                        }
                    }
                }
            } catch (Exception e) {
                // If token parsing fails, keep default "SYSTEM"
            }
        }
        
        // Use QuanLyTrangThaiDonHangService to update status and log history
        quanLyTrangThaiDonHangService.capNhatTrangThai(id, trangThai, nguoiThayDoi, "Cập nhật trạng thái");
        return ResponseEntity.ok("Cập nhật trạng thái thành công");
    }

    @PutMapping("/donhang/{id}/thanh-toan/trang-thai")
    public ResponseEntity<?> capNhatTrangThaiThanhToan(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String trangThaiThanhToan = body.get("trangThaiThanhToan");
        donHangService.capNhatTrangThaiThanhToan(id, trangThaiThanhToan);
        return ResponseEntity.ok("Cập nhật trạng thái thanh toán thành công");
    }


    // ✅ Thống kê bán hàng (4 mục)
    @GetMapping("/thongke")
    public ResponseEntity<ThongKeBanHangResponse> thongKeBanHang() {
        return ResponseEntity.ok(donHangService.thongKeBanHang());
    }

    // Accept hyphenated path `/thong-ke` and optional date range query params for backward compatibility
    @GetMapping("/thong-ke")
    public ResponseEntity<ThongKeBanHangResponse> thongKeBanHangHyphen(
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate
    ) {
        // Currently the service doesn't support date range. Ignore params for now and return overall stats.
        // In future we can extend IDonHangService to accept date range and implement filtering.
        return ResponseEntity.ok(donHangService.thongKeBanHang());
    }
}
