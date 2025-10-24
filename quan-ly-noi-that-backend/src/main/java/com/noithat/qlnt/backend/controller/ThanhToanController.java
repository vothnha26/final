package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.*;
import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.entity.Voucher;
import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.service.ThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.TimeZone;
import java.text.SimpleDateFormat;
import java.util.Iterator;
import java.util.Collections;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/thanhtoan")
@RequiredArgsConstructor
public class ThanhToanController {

    private final ThanhToanService thanhToanService;

    // Tạo link thanh toán VNPAY cho đơn hàng
    @PostMapping("/vnpay-url")
    public ResponseEntity<?> createVnpayUrl(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            Integer maDonHang = null;
            if (payload != null && payload.containsKey("maDonHang")) {
                Object maDonHangObj = payload.get("maDonHang");
                if (maDonHangObj instanceof Number) {
                    maDonHang = ((Number) maDonHangObj).intValue();
                } else if (maDonHangObj != null) {
                    maDonHang = Integer.valueOf(maDonHangObj.toString());
                }
            }
            if (maDonHang == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thiếu mã đơn hàng"));
            }
            // Lấy đơn hàng
            DonHang donHang = thanhToanService.getDonHangById(maDonHang);
            if (donHang == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy đơn hàng"));
            }
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String orderType = "other";
            String vnp_TxnRef = com.noithat.qlnt.backend.config.Config.getRandomNumber(8);
            String vnp_IpAddr = com.noithat.qlnt.backend.config.Config.getIpAddress(request);
            String vnp_TmnCode = com.noithat.qlnt.backend.config.Config.vnp_TmnCode;
            long amount = donHang.getThanhTien().longValue() * 100;
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang: " + donHang.getMaDonHang());
            vnp_Params.put("vnp_OrderType", orderType);
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", com.noithat.qlnt.backend.config.Config.vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName).append('=')
                        .append(java.net.URLEncoder.encode(fieldValue, "UTF-8"));
                    query.append(java.net.URLEncoder.encode(fieldName, "UTF-8")).append('=')
                        .append(java.net.URLEncoder.encode(fieldValue, "UTF-8"));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
            String vnp_SecureHash = com.noithat.qlnt.backend.config.Config.hmacSHA512(com.noithat.qlnt.backend.config.Config.secretKey, hashData.toString());
            String paymentUrl = com.noithat.qlnt.backend.config.Config.vnp_PayUrl + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;
            return ResponseEntity.ok(Map.of("success", true, "url", paymentUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi hệ thống", "details", e.getMessage()));
        }
    }

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