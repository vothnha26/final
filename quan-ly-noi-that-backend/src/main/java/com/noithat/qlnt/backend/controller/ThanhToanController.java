package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.*;
import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.entity.Voucher;
import com.noithat.qlnt.backend.service.ThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/thanhtoan")
@RequiredArgsConstructor
public class ThanhToanController {

    private final ThanhToanService thanhToanService;

    // ====================================================================
    // ===== API DÀNH CHO TRANG QUẢN TRỊ (ADMIN) - Giữ nguyên như cũ =====
    // ====================================================================

    @GetMapping("/thongke")
    public ResponseEntity<ThongKeThanhToanResponse> getThongKeThanhToan() {
        return ResponseEntity.ok(thanhToanService.getThongKe());
    }

    @GetMapping
    public ResponseEntity<List<ThanhToanResponse>> getTatCaThanhToan(
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String phuongThuc) {
        return ResponseEntity.ok(thanhToanService.getAllThanhToan(trangThai, phuongThuc));
    }

    // ... (Các API khác cho admin như getById, updateTrangThai...)

    // ====================================================================
    // ===== API DÀNH CHO LUỒNG THANH TOÁN CỦA KHÁCH HÀNG (CHECKOUT) =====
    // ====================================================================

    /**
     * API 1: Lấy chi tiết sản phẩm trong giỏ hàng (khu vực bên trái).
     */
    @PostMapping("/cart-details")
    public ResponseEntity<List<CartDetailItemResponse>> getCartDetails(@RequestBody CartItemsRequest request) {
        List<CartDetailItemResponse> cartDetails = thanhToanService.getCartDetails(request.getChiTietDonHang());
        return ResponseEntity.ok(cartDetails);
    }

    /**
     * API 2: Lấy tóm tắt đơn hàng (khu vực bên phải).
     * Được gọi lại mỗi khi có thay đổi (số lượng, voucher, điểm).
     */
    @PostMapping("/checkout-summary")
    public ResponseEntity<CheckoutSummaryResponse> getCheckoutSummary(@RequestBody CheckoutSummaryRequest request) {
        CheckoutSummaryResponse summary = thanhToanService.getCheckoutSummary(request);
        return ResponseEntity.ok(summary);
    }

    /**
     * API 3: (Tùy chọn) Lấy danh sách voucher khả dụng.
     */
    @GetMapping("/applicable-vouchers")
    public ResponseEntity<List<Voucher>> getApplicableVouchers(
            @RequestParam(required = false) Integer maKhachHang,
            @RequestParam(required = false) BigDecimal tongTienDonHang) {
        // Nếu không có thông tin, trả về danh sách rỗng
        if (maKhachHang == null || tongTienDonHang == null) {
            return ResponseEntity.ok(List.of());
        }
        List<Voucher> vouchers = thanhToanService.getApplicableVouchers(maKhachHang,
                tongTienDonHang);
        return ResponseEntity.ok(vouchers);
    }

    /**
     * API cuối cùng: Đặt hàng.
     * Trả về CheckoutSummaryResponse với đầy đủ thông tin từ stored procedure.
     */
    @PostMapping(value = "/tao-don-hang", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> taoDonHangTuUser(@RequestBody ThongTinGiaoHangRequest request) {
        try {
            CheckoutSummaryResponse resp = thanhToanService.taoDonHangTuUser(request);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            // Print stacktrace to server console for debugging
            e.printStackTrace();
            // Return a JSON error payload so frontend can display details
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi khi tạo đơn hàng: " + e.getMessage());
            err.put("details", e.toString());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PostMapping("/apply-voucher")
    public ResponseEntity<ApplyVoucherResponse> applyVoucher(@RequestBody ApplyVoucherRequest request) {
        ApplyVoucherResponse response = thanhToanService.applyVoucher(request);
        if (!response.isSuccess()) {
            // Nếu voucher không hợp lệ, trả về lỗi 400 Bad Request
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}