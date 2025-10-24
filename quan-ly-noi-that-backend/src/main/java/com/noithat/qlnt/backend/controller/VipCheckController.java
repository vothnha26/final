package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.service.VipBenefitProcessor;
import com.noithat.qlnt.backend.service.VipBenefitProcessor.VipBenefitSummary;
import com.noithat.qlnt.backend.dto.request.ThongTinGiaoHangRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Lightweight controller exposing VIP benefit checks for the checkout flow.
 * Endpoints are intentionally minimal and return simple JSON maps or the
 * VipBenefitSummary DTO produced by VipBenefitProcessor.
 */
@RestController
@RequestMapping("/api/vip/check")
@RequiredArgsConstructor
public class VipCheckController {

    private final VipBenefitProcessor vipBenefitProcessor;
    private final KhachHangRepository khachHangRepository;

    @GetMapping("/{maKhachHang}/summary")
    public ResponseEntity<VipBenefitSummary> getSummary(
            @PathVariable Integer maKhachHang,
            @RequestParam(required = false) BigDecimal tongTienGoc,
            @RequestParam(required = false) BigDecimal thanhTien
    ) {
        KhachHang kh = khachHangRepository.findById(maKhachHang)
                .orElse(null);
        VipBenefitSummary summary = vipBenefitProcessor.createBenefitSummary(kh, tongTienGoc, thanhTien);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/preview")
    public ResponseEntity<VipBenefitSummary> preview(@RequestBody ThongTinGiaoHangRequest req) {
        KhachHang kh = khachHangRepository.findById(req.getMaKhachHang()).orElse(null);
        // Derive tongTienGoc and thanhTien from chiTietDonHangList if present.
        BigDecimal tongTienGoc = BigDecimal.ZERO;
        if (req.getChiTietDonHangList() != null) {
            try {
                tongTienGoc = req.getChiTietDonHangList().stream()
                        .map(ct -> ct.getTongTienGoc() == null ? BigDecimal.ZERO : ct.getTongTienGoc())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            } catch (Exception ignored) {
                tongTienGoc = BigDecimal.ZERO;
            }
        }
        // Use tongTienGoc as fallback for thanhTien (final price) when not provided.
        BigDecimal thanhTien = tongTienGoc;
        VipBenefitSummary summary = vipBenefitProcessor.createBenefitSummary(kh, tongTienGoc, thanhTien);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{maKhachHang}/free-shipping")
    public ResponseEntity<Map<String, Boolean>> freeShipping(@PathVariable Integer maKhachHang,
                                                              @RequestParam(required = false) BigDecimal orderTotal) {
        KhachHang kh = khachHangRepository.findById(maKhachHang).orElse(null);
        boolean free = vipBenefitProcessor.hasFreeShipping(kh, orderTotal);
        return ResponseEntity.ok(Map.of("freeShipping", free));
    }

    @GetMapping("/{maKhachHang}/percent-discount")
    public ResponseEntity<Map<String, Object>> percentDiscount(@PathVariable Integer maKhachHang,
                                                                @RequestParam BigDecimal orderTotal) {
        KhachHang kh = khachHangRepository.findById(maKhachHang).orElse(null);
        BigDecimal discount = vipBenefitProcessor.calculatePercentDiscountAmount(kh, orderTotal == null ? BigDecimal.ZERO : orderTotal);
        return ResponseEntity.ok(Map.of("giamGiaVip", discount));
    }

    @GetMapping("/{maKhachHang}/bonus-points")
    public ResponseEntity<Map<String, Integer>> bonusPoints(@PathVariable Integer maKhachHang,
                                                            @RequestParam BigDecimal orderTotal) {
        KhachHang kh = khachHangRepository.findById(maKhachHang).orElse(null);
        int pts = vipBenefitProcessor.calculateVipBonusPoints(kh, orderTotal == null ? BigDecimal.ZERO : orderTotal);
        return ResponseEntity.ok(Map.of("bonusPoints", pts));
    }
}
