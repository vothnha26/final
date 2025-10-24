package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.VoucherApplyRequest;
import com.noithat.qlnt.backend.dto.request.VoucherCreationRequest;
import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.entity.Voucher;
import com.noithat.qlnt.backend.service.IVoucherService;
import com.noithat.qlnt.backend.service.IChuongTrinhGiamGiaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.Valid;

/**
 * Controller quản lý Voucher giảm giá cho toàn bộ đơn hàng
 */
@RestController
@RequestMapping("/api/v1/voucher")
public class VoucherController {

    private final IVoucherService voucherService;
    private final IChuongTrinhGiamGiaService chuongTrinhGiamGiaService;

    public VoucherController(IVoucherService voucherService, IChuongTrinhGiamGiaService chuongTrinhGiamGiaService) {
        this.voucherService = voucherService;
        this.chuongTrinhGiamGiaService = chuongTrinhGiamGiaService;
    }

    // ================== API cho Khách hàng ==================

    /**
     * Lấy danh sách voucher áp dụng cho khách hàng (entity)
     * GET /api/v1/voucher/eligible/1
     */
    @GetMapping("/eligible/{maKhachHang}")
    public ResponseEntity<List<Voucher>> getEligibleVouchers(@PathVariable Integer maKhachHang) {
        List<Voucher> vouchers = voucherService.getEligibleVouchersForCustomer(maKhachHang);
        return ResponseEntity.ok(vouchers);
    }

    /**
     * Lấy danh sách voucher áp dụng cho khách hàng (response chi tiết)
     * GET /api/v1/voucher/eligible/1/details
     */
    @GetMapping("/eligible/{maKhachHang}/details")
    public ResponseEntity<List<VoucherResponse>> getEligibleVouchersWithDetails(@PathVariable Integer maKhachHang) {
        List<VoucherResponse> vouchers = voucherService.getEligibleVouchersWithDetails(maKhachHang);
        return ResponseEntity.ok(vouchers);
    }

    /**
     * Áp dụng voucher khi checkout (trả về số tiền giảm)
     * POST /api/v1/voucher/apply
     */
    @PostMapping("/apply")
    public ResponseEntity<BigDecimal> applyVoucher(@Valid @RequestBody VoucherApplyRequest request) {
        // Trả về số tiền giảm được
        try {
            BigDecimal soTienGiam = voucherService.applyVoucher(request);
            return ResponseEntity.ok(soTienGiam);
        } catch (RuntimeException e) {
            // Xử lý lỗi nghiệp vụ (ví dụ: Voucher hết hạn, không đủ điều kiện)
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Áp dụng voucher khi checkout (trả về thông tin chi tiết)
     * POST /api/v1/voucher/apply/details
     */
    @PostMapping("/apply/details")
    public ResponseEntity<VoucherApplyResponse> applyVoucherDetailed(@Valid @RequestBody VoucherApplyRequest request) {
        try {
            VoucherApplyResponse response = voucherService.applyVoucherDetailed(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Try to include voucher info if the code exists
            String loai = null;
            java.math.BigDecimal gia = null;
            var maybe = voucherService.findByMaCodeOptional(request.getMaCode());
            if (maybe.isPresent()) {
                var v = maybe.get();
                loai = v.getLoaiGiamGia();
                gia = v.getGiaTriGiam();
            }

            // Compute tongTienGoc server-side from items when possible, otherwise fall back
            // to the backward-compatible field tongTienDonHang if provided.
            java.math.BigDecimal tongTienGoc = java.math.BigDecimal.ZERO;
            try {
                if (request.getItems() != null && !request.getItems().isEmpty()) {
                    for (VoucherApplyRequest.Item it : request.getItems()) {
                        var detail = chuongTrinhGiamGiaService.getBienTheGiaChiTiet(it.getBienTheId());
                        java.math.BigDecimal price = detail.getGiaHienThi();
                        java.math.BigDecimal qty = new java.math.BigDecimal(it.getQuantity());
                        tongTienGoc = tongTienGoc.add(price.multiply(qty));
                    }
                } else if (request.getTongTienDonHang() != null) {
                    tongTienGoc = request.getTongTienDonHang();
                }
            } catch (Exception ex) {
                // ignore and keep tongTienGoc as zero
                tongTienGoc = java.math.BigDecimal.ZERO;
            }

            VoucherApplyResponse errorResponse = VoucherApplyResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .maCode(request.getMaCode())
                    .tongTienGoc(tongTienGoc)
                    .soTienGiam(BigDecimal.ZERO)
                    .tongTienSauGiam(tongTienGoc)
                    .loaiGiamGia(loai)
                    .giaTriGiam(gia)
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // ================== CRUD cho Nhân viên/Admin ==================

    /**
     * Lấy danh sách tất cả voucher (entity)
     */
    @GetMapping
    public ResponseEntity<List<Voucher>> getAll() {
        return ResponseEntity.ok(voucherService.getAll());
    }

    /**
     * Lấy danh sách tất cả voucher (entity) - endpoint /all
     */
    @GetMapping("/all")
    public ResponseEntity<List<Voucher>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAll());
    }

    /**
     * Lấy danh sách tất cả voucher (response chi tiết)
     */
    @GetMapping("/details")
    public ResponseEntity<List<VoucherResponse>> getAllWithDetails() {
        return ResponseEntity.ok(voucherService.getAllVouchersWithDetails());
    }

    /**
     * Lấy thông tin voucher theo ID (entity)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Voucher> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(voucherService.getById(id));
    }

    /**
     * Lấy thông tin voucher theo ID (response chi tiết)
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<VoucherResponse> getDetailById(@PathVariable Integer id) {
        return ResponseEntity.ok(voucherService.getVoucherDetail(id));
    }

    /**
     * Tạo voucher mới
     */
    @PostMapping
    public ResponseEntity<VoucherResponse> create(@Valid @RequestBody VoucherCreationRequest request) {
        var v = voucherService.createVoucher(request);
        return ResponseEntity.ok(voucherService.getVoucherDetail(v.getMaVoucher()));
    }

    /**
     * Cập nhật voucher (PATCH)
     */
    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody VoucherCreationRequest request) {
        try {
            var v = voucherService.updateVoucher(id, request);
            return ResponseEntity.ok(voucherService.getVoucherDetail(v.getMaVoucher()));
        } catch (Exception ex) {
            // Return a 400 with the exception message to avoid generic 500 and help
            // debugging from frontend
            return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Xóa voucher
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy voucher phân loại theo hạng thành viên
     */
    @GetMapping("/classify")
    public ResponseEntity<List<VoucherByTierResponse>> classifyByTier() {
        return ResponseEntity.ok(voucherService.getVouchersGroupedByTier());
    }

    /**
     * Lấy voucher áp dụng cho 1 hạng thành viên
     */
    @GetMapping("/by-tier/{maHangThanhVien}")
    public ResponseEntity<List<VoucherResponse>> getByTier(@PathVariable Integer maHangThanhVien) {
        return ResponseEntity.ok(voucherService.getVouchersForTier(maHangThanhVien));
    }

    /**
     * Gán (thay thế) danh sách hạng thành viên cho 1 voucher (Admin)
     */
    @PostMapping("/{id}/assign-tiers")
    public ResponseEntity<VoucherResponse> assignTiers(@PathVariable Integer id, @RequestBody List<Integer> maHangIds) {
        var v = voucherService.assignTiersToVoucher(id, maHangIds);
        return ResponseEntity.ok(voucherService.getVoucherDetail(v.getMaVoucher()));
    }
}