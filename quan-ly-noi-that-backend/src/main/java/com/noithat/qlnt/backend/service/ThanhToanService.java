package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.ApplyVoucherRequest;
import com.noithat.qlnt.backend.dto.request.CheckoutSummaryRequest;
import com.noithat.qlnt.backend.dto.request.ThanhToanRequest;
import com.noithat.qlnt.backend.dto.request.ThemGiaoDichRequest;
import com.noithat.qlnt.backend.dto.request.ThongTinGiaoHangRequest;
import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.entity.Voucher; // Cần import entity Voucher

import java.math.BigDecimal;
import java.util.List;

public interface ThanhToanService {

    // =============================================
    // ===== NGHIỆP VỤ CHO TRANG QUẢN TRỊ (ADMIN) =====
    // =============================================

    /** Lấy dữ liệu thống kê cho 4 thẻ ở trên cùng. */
    ThongKeThanhToanResponse getThongKe();

    /** Lấy danh sách tất cả giao dịch thanh toán, có thể lọc. */
    List<ThanhToanResponse> getAllThanhToan(String trangThai, String phuongThuc);

    /** Lấy chi tiết một giao dịch thanh toán bằng ID. */
    ThanhToanChiTietResponse getThanhToanById(Integer id);

    /** Cập nhật trạng thái của một giao dịch. */
    ThanhToanResponse updateTrangThai(Integer id, String newStatus);

    /** Lấy danh sách giao dịch theo mã đơn hàng. */
    List<ThanhToanResponse> getByDonHang(Integer maDonHang);

    /** (Admin) Thêm một giao dịch thanh toán thủ công cho đơn hàng. */
    ThanhToanChiTietResponse themMoiGiaoDich(ThemGiaoDichRequest request);

    // ==========================================================
    // ===== NGHIỆP VỤ CHO LUỒNG THANH TOÁN CỦA KHÁCH HÀNG =====
    // ==========================================================

    /**
     * API 1: Lấy thông tin chi tiết các sản phẩm trong giỏ hàng (khu vực bên trái).
     * Sử dụng procedure: sp_GetCartDetails.
     */
    List<CartDetailItemResponse> getCartDetails(List<ThanhToanRequest> cartItems);

    /**
     * API 2: Lấy tóm tắt đơn hàng (khu vực bên phải).
     * Sử dụng procedure: sp_GetCheckoutSummary.
     */
    CheckoutSummaryResponse getCheckoutSummary(CheckoutSummaryRequest request);

    /**
     * API 3: Lấy danh sách các voucher khách hàng có thể sử dụng.
     * Sử dụng procedure: sp_GetApplicableVouchers_ForCheckout.
     */
    List<Voucher> getApplicableVouchers(Integer maKhachHang, BigDecimal tongTienDonHang);

    /**
     * API Cuối Cùng: Tạo đơn hàng, trừ kho, cập nhật voucher...
     * Logic này được giữ lại trong Java để đảm bảo an toàn giao dịch
     * (@Transactional).
     * Trả về CheckoutSummaryResponse với đầy đủ thông tin từ stored procedure.
     */
    CheckoutSummaryResponse taoDonHangTuUser(ThongTinGiaoHangRequest request);

    ApplyVoucherResponse applyVoucher(ApplyVoucherRequest request);
}