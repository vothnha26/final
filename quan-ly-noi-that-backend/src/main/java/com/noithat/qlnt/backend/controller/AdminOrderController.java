package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.DonHangRequest;
import com.noithat.qlnt.backend.dto.request.ThanhToanRequest;
import com.noithat.qlnt.backend.dto.request.ThongTinGiaoHangRequest;
import com.noithat.qlnt.backend.dto.response.CheckoutSummaryResponse;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.BienTheGiamGia;
import com.noithat.qlnt.backend.entity.ChuongTrinhGiamGia;
import com.noithat.qlnt.backend.repository.BienTheSanPhamRepository;
import com.noithat.qlnt.backend.repository.BienTheGiamGiaRepository;
import com.noithat.qlnt.backend.service.ThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminOrderController {

    private final BienTheSanPhamRepository bienTheSanPhamRepository;
    private final BienTheGiamGiaRepository bienTheGiamGiaRepository;
    private final ThanhToanService thanhToanService;

    // Search variants by SKU or product name
    @GetMapping("/san-pham/search")
    public ResponseEntity<List<Map<String, Object>>> searchVariants(@RequestParam("q") String q) {
        List<BienTheSanPham> list = bienTheSanPhamRepository.searchBySkuOrProductName(q);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        
        List<Map<String, Object>> out = list.stream().map(b -> {
            java.math.BigDecimal giaBan = b.getGiaBan();
            java.math.BigDecimal giaSauGiam = giaBan;
            java.math.BigDecimal soTienGiam = java.math.BigDecimal.ZERO;
            
            // Check for active discount on this variant using repository
            List<BienTheGiamGia> discounts = bienTheGiamGiaRepository.findByBienTheSanPham_MaBienThe(b.getMaBienThe());
            if (discounts != null && !discounts.isEmpty()) {
                for (BienTheGiamGia btgg : discounts) {
                    ChuongTrinhGiamGia ctgg = btgg.getChuongTrinhGiamGia();
                    if (ctgg != null 
                        && ctgg.getNgayBatDau() != null 
                        && ctgg.getNgayKetThuc() != null
                        && !now.isBefore(ctgg.getNgayBatDau()) 
                        && !now.isAfter(ctgg.getNgayKetThuc())
                        && btgg.getGiaSauGiam() != null) {
                        giaSauGiam = btgg.getGiaSauGiam();
                        soTienGiam = giaBan.subtract(giaSauGiam);
                        break;
                    }
                }
            }
            
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("maBienThe", b.getMaBienThe());
            result.put("sku", b.getSku());
            result.put("tenSanPham", b.getSanPham() != null ? b.getSanPham().getTenSanPham() : null);
            result.put("giaBan", giaBan);
            result.put("giaSauGiam", giaSauGiam);
            result.put("soTienGiam", soTienGiam);
            result.put("soLuongTon", b.getSoLuongTon());
            result.put("attributes", b.getGiaTriThuocTinhs());
            return result;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    // Admin creates order - DÙNG CHUNG LOGIC VỚI CUSTOMER
    @PostMapping("/don-hang")
    public ResponseEntity<?> createOrderAsAdmin(@RequestBody DonHangRequest request) {
        try {
            // Map DonHangRequest -> ThongTinGiaoHangRequest để dùng chung service với customer
            ThongTinGiaoHangRequest thongTinRequest = new ThongTinGiaoHangRequest();
            thongTinRequest.setMaKhachHang(request.getMaKhachHang());
            thongTinRequest.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
            
            // Map chiTietDonHangList từ DonHangRequest sang ThanhToanRequest
            List<ThanhToanRequest> chiTietList = request.getChiTietDonHangList().stream()
                .map(ct -> {
                    ThanhToanRequest tt = new ThanhToanRequest();
                    tt.setMaBienThe(ct.getMaBienThe());
                    tt.setSoLuong(ct.getSoLuong());
                    return tt;
                })
                .collect(Collectors.toList());
            thongTinRequest.setChiTietDonHangList(chiTietList);
            
            thongTinRequest.setTenNguoiNhan(request.getTenNguoiNhan());
            thongTinRequest.setSoDienThoaiNhan(request.getSoDienThoaiNhan());
            thongTinRequest.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
            thongTinRequest.setGhiChu(request.getGhiChu());
            thongTinRequest.setPhuongThucGiaoHang("Giao hàng tiêu chuẩn");
            thongTinRequest.setMaVoucherCode(request.getMaVoucherCode());
            thongTinRequest.setDiemThuongSuDung(request.getDiemThuongSuDung() != null ? request.getDiemThuongSuDung() : 0);
            
            // Gọi service CHUNG với customer (dùng stored procedure)
            CheckoutSummaryResponse resp = thanhToanService.taoDonHangTuUser(thongTinRequest);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi khi tạo đơn hàng: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }
}
