package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.entity.LichSuTrangThaiDonHang;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.Voucher;
import com.noithat.qlnt.backend.entity.ChiTietDonHang;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.repository.DonHangRepository;
import com.noithat.qlnt.backend.repository.LichSuTrangThaiDonHangRepository;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.VoucherRepository;
import com.noithat.qlnt.backend.repository.BienTheSanPhamRepository;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QuanLyTrangThaiDonHangServiceImpl implements IQuanLyTrangThaiDonHangService {

    private final DonHangRepository donHangRepository;
    private final LichSuTrangThaiDonHangRepository lichSuTrangThaiDonHangRepository;
    private final KhachHangRepository khachHangRepository;
    private final VoucherRepository voucherRepository;
    private final BienTheSanPhamRepository bienTheSanPhamRepository;

    // Status constants matching database values
    private static final String CHO_XU_LY = "CHO_XU_LY";
    private static final String CHO_XAC_NHAN = "CHO_XAC_NHAN";
    private static final String XAC_NHAN = "XAC_NHAN";
    private static final String DANG_CHUAN_BI = "DANG_CHUAN_BI";
    private static final String DANG_GIAO = "DANG_GIAO";
    private static final String DANG_GIAO_HANG = "DANG_GIAO_HANG";
    private static final String DA_GIAO_HANG = "DA_GIAO_HANG";
    private static final String HOAN_THANH = "HOAN_THANH";
    private static final String HUY_BO = "HUY_BO";
    private static final String DA_HUY = "DA_HUY";

    // Valid status transition map
    private static final Map<String, List<String>> VALID_TRANSITIONS = new HashMap<>();

    static {
        VALID_TRANSITIONS.put(CHO_XU_LY, Arrays.asList(XAC_NHAN, DANG_CHUAN_BI, DANG_GIAO_HANG, DA_HUY));
        VALID_TRANSITIONS.put(XAC_NHAN, Arrays.asList(DANG_CHUAN_BI, DA_HUY));
        VALID_TRANSITIONS.put(DANG_CHUAN_BI, Arrays.asList(DANG_GIAO_HANG, DA_HUY));
        // Cho phép hoàn thành trực tiếp từ trạng thái đang giao hàng (staff hoàn tất
        // tại quầy)
        VALID_TRANSITIONS.put(DANG_GIAO_HANG, Arrays.asList(DA_GIAO_HANG, HOAN_THANH, DA_HUY));
        VALID_TRANSITIONS.put(DA_GIAO_HANG, Arrays.asList(HOAN_THANH)); // Customer can confirm delivery
        VALID_TRANSITIONS.put(HOAN_THANH, Collections.emptyList());
        VALID_TRANSITIONS.put(DA_HUY, Collections.emptyList());
    }

    @Override
    @Transactional
    public void capNhatTrangThai(Integer maDonHang, String trangThai, String nguoiThayDoi, String ghiChu) {
        changeOrderStatus(maDonHang, trangThai, nguoiThayDoi, ghiChu);
    }

    @Override
    @Transactional
    public boolean changeOrderStatus(Integer maDonHang, String trangThaiMoi, String nguoiThayDoi, String ghiChu) {
        DonHang donHang = donHangRepository.findById(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + maDonHang));

        String trangThaiCuRaw = donHang.getTrangThaiDonHang();
        // Normalize stored/legacy status values to internal constants for transition
        // checks
        String trangThaiCu = normalizeStoredStatus(trangThaiCuRaw);

        // Check if transition is valid
        if (!canChangeStatus(maDonHang, trangThaiMoi)) {
            // Log and return false so controller can return a 400 response instead of 500
            return false;
        }

        // Update order status
        donHang.setTrangThaiDonHang(trangThaiMoi);

        // Nếu trạng thái mới là HOAN_THANH thì auto-mark payment là PAID
        if (IQuanLyTrangThaiDonHangService.HOAN_THANH.equals(trangThaiMoi)) {
            donHang.setTrangThaiThanhToan("PAID");
        }

        donHangRepository.save(donHang);

        // Record history
        LichSuTrangThaiDonHang lichSu = new LichSuTrangThaiDonHang(
                donHang,
                trangThaiCuRaw,
                trangThaiMoi,
                nguoiThayDoi,
                ghiChu);
        lichSuTrangThaiDonHangRepository.save(lichSu);

        // --- Side-effects: award/refund points, rollback voucher usage, restore stock
        // ---
        try {
            // Khi trạng thái chuyển sang HOAN_THANH hoặc DA_GIAO_HANG thì cộng thống kê cho
            // khách hàng
            boolean shouldUpdateStats = false;
            if ((IQuanLyTrangThaiDonHangService.HOAN_THANH.equals(trangThaiMoi)
                    && !IQuanLyTrangThaiDonHangService.HOAN_THANH.equals(trangThaiCu))
                    || (DA_GIAO_HANG.equals(trangThaiMoi) && !DA_GIAO_HANG.equals(trangThaiCu))) {
                shouldUpdateStats = true;
            }
            if (shouldUpdateStats) {
                KhachHang kh = donHang.getKhachHang();
                if (kh != null) {
                    // Award loyalty points (chỉ khi HOAN_THANH)
                    if (IQuanLyTrangThaiDonHangService.HOAN_THANH.equals(trangThaiMoi)) {
                        Integer toAward = donHang.getDiemThuongNhanDuoc() != null ? donHang.getDiemThuongNhanDuoc() : 0;
                        if (toAward > 0) {
                            int current = kh.getDiemThuong() != null ? kh.getDiemThuong() : 0;
                            kh.setDiemThuong(current + toAward);
                        }
                    }
                    // Update total spending and order count (payment is PAID)
                    if ("PAID".equals(donHang.getTrangThaiThanhToan())) {
                        Integer currentOrderCount = kh.getTongDonHang() != null ? kh.getTongDonHang() : 0;
                        kh.setTongDonHang(currentOrderCount + 1);

                        java.math.BigDecimal currentSpending = kh.getTongChiTieu() != null ? kh.getTongChiTieu()
                                : java.math.BigDecimal.ZERO;
                        java.math.BigDecimal orderTotal = donHang.getThanhTien() != null ? donHang.getThanhTien()
                                : java.math.BigDecimal.ZERO;
                        kh.setTongChiTieu(currentSpending.add(orderTotal));
                        // kh.setDiemThuong(maDonHang);
                    }
                    khachHangRepository.save(kh);
                }
            }

            // When order is cancelled (DA_HUY / HUY_BO): refund used points, rollback
            // voucher usage, restore inventory
            if (DA_HUY.equals(trangThaiMoi) || HUY_BO.equals(trangThaiMoi)) {
                // Refund points used
                KhachHang kh = donHang.getKhachHang();
                if (kh != null && donHang.getDiemThuongSuDung() != null && donHang.getDiemThuongSuDung() > 0) {
                    int used = donHang.getDiemThuongSuDung();
                    int current = kh.getDiemThuong() != null ? kh.getDiemThuong() : 0;
                    kh.setDiemThuong(current + used);
                    khachHangRepository.save(kh);
                }

                // Rollback voucher usage count
                Voucher v = donHang.getVoucher();
                if (v != null) {
                    v.setSoLuongDaSuDung(Math.max(0, v.getSoLuongDaSuDung() - 1));
                    voucherRepository.save(v);
                }

                // Restore stock quantities
                if (donHang.getChiTietDonHangs() != null) {
                    for (ChiTietDonHang ct : donHang.getChiTietDonHangs()) {
                        BienTheSanPham bt = ct.getBienThe();
                        if (bt != null) {
                            bt.setSoLuongTon(bt.getSoLuongTon() + ct.getSoLuong());
                            bienTheSanPhamRepository.save(bt);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            // Log but do not fail the status update; side-effect failures should be
            // investigated separately. In a future change we may want to make these
            // operations more robust and transactional across services.
        }

        return true;
    }

    @Override
    public boolean canChangeStatus(Integer maDonHang, String trangThaiMoi) {
        DonHang donHang = donHangRepository.findById(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + maDonHang));
        String trangThaiCuRaw = donHang.getTrangThaiDonHang();
        String trangThaiCu = normalizeStoredStatus(trangThaiCuRaw);

        // Special-case: allow cancellation (HUY_BO) from most non-final states.
        // Business rule: customers/staff should be able to cancel an order so long as
        // it is not already completed or already canceled.
        if (IQuanLyTrangThaiDonHangService.HUY_BO.equals(trangThaiMoi)) {
            if (HOAN_THANH.equals(trangThaiCu) || HUY_BO.equals(trangThaiCu)) {
                // Already finished or already canceled -> cannot cancel
                return false;
            }
            // Allow cancellation from other states
            return true;
        }

        // Check if current status exists in transition map
        if (!VALID_TRANSITIONS.containsKey(trangThaiCu)) {
            // If the stored status is unknown, log for diagnostics and disallow
            // non-cancellation transitions
            return false;
        }

        // Check if new status is in the list of valid transitions
        boolean allowed = VALID_TRANSITIONS.get(trangThaiCu).contains(trangThaiMoi);
        return allowed;
    }

    /**
     * Normalize legacy/stored status strings (English variants, earlier codes) into
     * the
     * internal Vietnamese constants used by VALID_TRANSITIONS.
     */
    private String normalizeStoredStatus(String raw) {
        if (raw == null)
            return CHO_XU_LY;
        String s = raw.trim().toUpperCase();
        switch (s) {
            case "PENDING":
            case "WAITING":
            case "CHO_XU_LY":
            case "CHO XU LY":
            case "CHỜ XỬ LÝ":
            case "CHO_XAC_NHAN":
            case "CHO XAC NHAN":
            case "CHỜ XÁC NHẬN":
                return CHO_XU_LY;
            case "CONFIRMED":
            case "XAC_NHAN":
            case "XÁC NHẬN":
                return XAC_NHAN;
            case "PREPARING":
            case "PROCESSING":
            case "DANG_CHUAN_BI":
            case "ĐANG CHUẨN BỊ":
                return DANG_CHUAN_BI;
            case "SHIPPED":
            case "SHIPPING":
            case "DANG_GIAO":
            case "DANG_GIAO_HANG":
            case "ĐANG GIAO":
            case "ĐANG GIAO HÀNG":
                return DANG_GIAO_HANG;
            case "DELIVERED":
            case "DA_GIAO_HANG":
            case "DA GIAO HANG":
            case "ĐÃ GIAO HÀNG":
                return DA_GIAO_HANG;
            case "COMPLETED":
            case "HOAN_THANH":
            case "HOÀN THÀNH":
                return HOAN_THANH;
            case "CANCELLED":
            case "CANCELED":
            case "DA_HUY":
            case "HUY_BO":
            case "ĐÃ HỦY":
            case "HỦY":
                return DA_HUY;
            default:
                // If unknown, try exact match with constants
                if (VALID_TRANSITIONS.containsKey(s))
                    return s;
                return s;
        }
    }

    @Override
    public List<DonHang> getDonHangTheoTrangThai(String trangThai) {
        return donHangRepository.findByTrangThaiDonHang(trangThai);
    }

    @Override
    public List<DonHang> getOrdersByStatus(String trangThai) {
        return getDonHangTheoTrangThai(trangThai);
    }

    @Override
    public List<DonHang> getPendingOrders() {
        return donHangRepository.findByTrangThaiDonHang(CHO_XAC_NHAN);
    }

    @Override
    public List<DonHang> getShippingOrders() {
        // Query both DANG_GIAO and DANG_GIAO_HANG for backward compatibility
        return donHangRepository.findByTrangThaiDonHangIn(Arrays.asList(DANG_GIAO, DANG_GIAO_HANG));
    }

    @Override
    public List<DonHang> getOrdersNeedingAttention() {
        return donHangRepository
                .findByTrangThaiDonHangIn(Arrays.asList(XAC_NHAN, DANG_CHUAN_BI, DANG_GIAO, DANG_GIAO_HANG));
    }

    @Override
    public List<LichSuTrangThaiDonHang> getOrderStatusHistory(Integer maDonHang) {
        return lichSuTrangThaiDonHangRepository.findByDonHangOrderByThoiGianThayDoiDesc(maDonHang);
    }

    @Override
    public Map<String, Long> countOrdersByStatus() {
        Map<String, Long> statusCounts = new HashMap<>();

        statusCounts.put(CHO_XAC_NHAN, (long) donHangRepository.findByTrangThaiDonHang(CHO_XAC_NHAN).size());
        statusCounts.put(XAC_NHAN, (long) donHangRepository.findByTrangThaiDonHang(XAC_NHAN).size());
        statusCounts.put(DANG_CHUAN_BI, (long) donHangRepository.findByTrangThaiDonHang(DANG_CHUAN_BI).size());
        // Count both DANG_GIAO and DANG_GIAO_HANG for backward compatibility
        statusCounts.put("DANG_GIAO_HANG",
                (long) donHangRepository.findByTrangThaiDonHangIn(Arrays.asList(DANG_GIAO, DANG_GIAO_HANG)).size());
        statusCounts.put(HOAN_THANH, (long) donHangRepository.findByTrangThaiDonHang(HOAN_THANH).size());
        statusCounts.put(HUY_BO, (long) donHangRepository.findByTrangThaiDonHang(HUY_BO).size());

        return statusCounts;
    }

    @Override
    public List<Object[]> getProcessingTimeStats() {
        return lichSuTrangThaiDonHangRepository.getAverageProcessingTimeByStatus();
    }
}
