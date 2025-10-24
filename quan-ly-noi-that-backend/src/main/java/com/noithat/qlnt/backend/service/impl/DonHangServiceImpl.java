package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.CheckoutSummaryRequest;
import com.noithat.qlnt.backend.dto.request.DonHangRequest;
import com.noithat.qlnt.backend.dto.request.ThanhToanRequest;
import com.noithat.qlnt.backend.dto.response.ChiTietDonHangResponse;
import com.noithat.qlnt.backend.dto.response.CheckoutSummaryResponse;
import com.noithat.qlnt.backend.dto.response.DonHangResponse;
import com.noithat.qlnt.backend.dto.response.ThongKeBanHangResponse;
import com.noithat.qlnt.backend.entity.*;
import com.noithat.qlnt.backend.exception.AppException;
import com.noithat.qlnt.backend.repository.*;
import com.noithat.qlnt.backend.service.IDonHangService;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import com.noithat.qlnt.backend.service.ThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonHangServiceImpl implements IDonHangService {

    private final DonHangRepository donHangRepository;
    private final KhachHangRepository khachHangRepository;
    private final BienTheSanPhamRepository bienTheSanPhamRepository;
    private final VoucherRepository voucherRepository;
    private final ThanhToanService thanhToanService;
    private final GiaoDichThanhToanRepository giaoDichThanhToanRepository;
    private final LichSuTrangThaiDonHangRepository lichSuTrangThaiDonHangRepository;
    private final com.noithat.qlnt.backend.repository.CauHinhHeThongRepository cauHinhHeThongRepository;
    private final BienTheGiamGiaRepository bienTheGiamGiaRepository;
    private final IQuanLyTrangThaiDonHangService quanLyTrangThaiDonHangService;

    @Override
    @Transactional
    public DonHangResponse taoDonHang(DonHangRequest request) {
        // 1. Xác thực khách hàng (cho phép null cho đơn khách lẻ / admin)
        KhachHang khachHang = null;
        if (request.getMaKhachHang() != null) {
            khachHang = khachHangRepository.findById(request.getMaKhachHang())
                    .orElseThrow(() -> new AppException(404, "Không tìm thấy khách hàng."));
        }

        // 2. Tạo đối tượng DonHang và map thông tin
        DonHang donHang = new DonHang();
        donHang.setKhachHang(khachHang);
        donHang.setNgayDatHang(LocalDateTime.now());
        donHang.setTrangThaiDonHang(
                request.getTrangThaiDonHang() != null ? request.getTrangThaiDonHang() : "CHO_XU_LY");
        donHang.setTrangThaiThanhToan(
                request.getTrangThaiThanhToan() != null ? request.getTrangThaiThanhToan() : "UNPAID");
        donHang.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
        donHang.setGhiChu(request.getGhiChu());
        donHang.setTenNguoiNhan(request.getTenNguoiNhan());
        donHang.setSoDienThoaiNhan(request.getSoDienThoaiNhan());
        donHang.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
        donHang.setDiemThuongNhanDuoc(request.getDiemThuongNhanDuoc());

        // 3. Gọi procedure để tính toán lại toàn bộ giá trị
        CheckoutSummaryRequest summaryRequest = new CheckoutSummaryRequest();
        summaryRequest.setChiTietDonHang(request.getChiTietDonHangList());
        // Pass through maKhachHang (may be null) so stored-proc can compute correctly
        summaryRequest.setMaKhachHang(request.getMaKhachHang());
        summaryRequest.setDiemSuDung(request.getDiemThuongSuDung() != null ? request.getDiemThuongSuDung() : 0);
        summaryRequest.setMaVoucherCode(request.getMaVoucherCode());

        CheckoutSummaryResponse summary = thanhToanService.getCheckoutSummary(summaryRequest);

        // 4. Gán các giá trị đã tính vào DonHang (bao gồm điểm thưởng từ procedure)
        donHang.setTongTienGoc(summary.getTamTinh());
        donHang.setGiamGiaVip(summary.getGiamGiaVip());
        donHang.setGiamGiaVoucher(summary.getGiamGiaVoucher());
        donHang.setDiemThuongSuDung(request.getDiemThuongSuDung());
        donHang.setGiamGiaDiemThuong(summary.getGiamGiaDiem());
        
        // Lấy điểm thưởng đã được tính trong stored procedure sp_GetCheckoutSummary
        // (bao gồm: điểm từ tổng tiền + điểm từ sản phẩm + điểm VIP bonus)
        int rewardPoints = 0;
        if (summary.getDiemThuongNhanDuoc() != null) {
            rewardPoints = summary.getDiemThuongNhanDuoc().intValue();
        }
        donHang.setDiemThuongNhanDuoc(rewardPoints);

        BigDecimal phiVanChuyen = "Miễn phí".equalsIgnoreCase(summary.getPhiGiaoHang()) ? BigDecimal.ZERO
                : new BigDecimal(summary.getPhiGiaoHang());
        donHang.setPhiGiaoHang(phiVanChuyen);
        donHang.setThanhTien(summary.getTongCong());

        // 5. Cập nhật Voucher
        if (request.getMaVoucherCode() != null && !request.getMaVoucherCode().isEmpty()) {
            Voucher voucher = voucherRepository.findByMaCode(request.getMaVoucherCode()).orElse(null);
            if (voucher != null) {
                donHang.setVoucher(voucher);
                voucher.setSoLuongDaSuDung(voucher.getSoLuongDaSuDung() + 1);
            }
        }

        // 6. Trừ điểm thưởng của khách hàng (chỉ khi có khách hàng)
        if (khachHang != null && request.getDiemThuongSuDung() != null && request.getDiemThuongSuDung() > 0) {
            int diemHienCo = khachHang.getDiemThuong() != null ? khachHang.getDiemThuong() : 0;
            if (request.getDiemThuongSuDung() > diemHienCo) {
                throw new AppException(400, "Số điểm sử dụng vượt quá số điểm hiện có.");
            }
            khachHang.setDiemThuong(diemHienCo - request.getDiemThuongSuDung());
        }

        // NOTE: Do NOT award earned loyalty points here. The order stores the
        // server-calculated earned points in donHang.diemThuongNhanDuoc, but the
        // actual increase to the customer's point balance should occur only when
        // the order reaches HOAN_THANH. That behavior is implemented centrally in
        // QuanLyTrangThaiDonHangServiceImpl to ensure a single place handles
        // side-effects like awarding/refunding points and voucher/stock rollbacks.

        // 6c. Cập nhật tổng chi tiêu và tổng đơn hàng của khách hàng (nếu có)
        if (khachHang != null) {
            java.math.BigDecimal currentTotal = khachHang.getTongChiTieu() != null ? khachHang.getTongChiTieu()
                    : java.math.BigDecimal.ZERO;
            java.math.BigDecimal orderAmount = summary.getTongCong() != null ? summary.getTongCong()
                    : java.math.BigDecimal.ZERO;
            khachHang.setTongChiTieu(currentTotal.add(orderAmount));
            Integer currentOrders = khachHang.getTongDonHang() != null ? khachHang.getTongDonHang() : 0;
            khachHang.setTongDonHang(currentOrders + 1);
            // Persist changes (same transaction)
            khachHangRepository.save(khachHang);
        }

        // 7. Tạo ChiTietDonHang và trừ kho (thông báo do DB trigger xử lý)
        List<ChiTietDonHang> chiTietList = new ArrayList<>();
        for (ThanhToanRequest ct : request.getChiTietDonHangList()) {
            BienTheSanPham bienThe = bienTheSanPhamRepository.findById(ct.getMaBienThe())
                    .orElseThrow(() -> new AppException(404, "Không tìm thấy biến thể sản phẩm."));

            if (bienThe.getSoLuongTon() < ct.getSoLuong()) {
                throw new AppException(400, "Sản phẩm " + bienThe.getSku() + " không đủ số lượng tồn kho.");
            }

            Integer afterStock = bienThe.getSoLuongTon() - ct.getSoLuong();
            bienThe.setSoLuongTon(afterStock);

            ChiTietDonHang chiTiet = new ChiTietDonHang();
            chiTiet.setDonHang(donHang);
            chiTiet.setBienThe(bienThe);
            chiTiet.setSoLuong(ct.getSoLuong());
            chiTiet.setDonGiaGoc(bienThe.getGiaBan());
            
            // Ưu tiên sử dụng donGia từ request (admin/staff đã chọn giá giảm từ frontend)
            // Nếu không có, tìm giá sau giảm từ chương trình giảm giá đang active
            BigDecimal donGiaThucTe = bienThe.getGiaBan();
            if (ct.getDonGia() != null && ct.getDonGia().compareTo(BigDecimal.ZERO) > 0) {
                // Frontend đã gửi giá đã tính (bao gồm giảm giá), sử dụng giá đó
                donGiaThucTe = ct.getDonGia();
            } else {
                // Không có giá từ request, tìm giá giảm từ database
                List<BienTheGiamGia> danhSachGiamGia = bienTheGiamGiaRepository
                    .findByBienTheSanPham_MaBienThe(bienThe.getMaBienThe());
                
                LocalDateTime now = LocalDateTime.now();
                for (BienTheGiamGia btgg : danhSachGiamGia) {
                    ChuongTrinhGiamGia ct_gg = btgg.getChuongTrinhGiamGia();
                    // Kiểm tra chương trình còn hiệu lực và đang active
                    String trangThai = ct_gg.getTrangThai();
                    boolean isActive = trangThai != null && (
                        "đang hoạt động".equalsIgnoreCase(trangThai) ||
                        "DANG_HOAT_DONG".equalsIgnoreCase(trangThai) ||
                        "ACTIVE".equalsIgnoreCase(trangThai)
                    );
                    
                    if (isActive
                        && !now.isBefore(ct_gg.getNgayBatDau())
                        && !now.isAfter(ct_gg.getNgayKetThuc())
                        && btgg.getGiaSauGiam() != null) {
                        donGiaThucTe = btgg.getGiaSauGiam();
                        break; // Chỉ áp dụng 1 chương trình giảm giá
                    }
                }
            }
            
            chiTiet.setDonGiaThucTe(donGiaThucTe);
            chiTietList.add(chiTiet);
        }
        donHang.setChiTietDonHangs(chiTietList);

        // 8. Lưu tất cả thay đổi
        DonHang savedDonHang = donHangRepository.save(donHang);

        // Notifications are handled by DB triggers now; skip programmatic creation

        return mapToResponse(savedDonHang);
    }

    @Override
    public DonHangResponse getDonHangById(Integer id) {
        DonHang donHang = donHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + id));
        return mapToResponse(donHang);
    }

    @Override
    public List<DonHangResponse> getTatCaDonHang() {
        return donHangRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DonHangResponse> getDonHangByKhachHang(Integer maKhachHang) {
        return donHangRepository.findByKhachHang(maKhachHang).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void capNhatTrangThai(Integer id, String trangThai) {
        // Delegate to QuanLyTrangThaiDonHangService to handle status update + history logging
        // nguoiThayDoi will be "SYSTEM" if not explicitly provided from controller
        quanLyTrangThaiDonHangService.capNhatTrangThai(id, trangThai, "SYSTEM", "Cập nhật trạng thái đơn hàng");
    }

    @Override
    @Transactional
    public void capNhatTrangThaiThanhToan(Integer id, String trangThaiThanhToan) {
        DonHang donHang = donHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + id));

        String normalized;
        if (trangThaiThanhToan == null) {
            throw new RuntimeException("Thiếu tham số 'trangThaiThanhToan'.");
        }
        switch (trangThaiThanhToan.trim().toUpperCase()) {
            case "DA_THANH_TOAN":
                normalized = "PAID";
                break;
            case "CHUA_THANH_TOAN":
                normalized = "UNPAID";
                break;
            case "UNPAID":
            case "PAID":
            case "PENDING":
            case "FAILED":
                normalized = trangThaiThanhToan.trim().toUpperCase();
                break;
            default:
                // Mặc định an toàn: nếu không khớp known values, giữ nguyên input (upper-case)
                normalized = trangThaiThanhToan.trim().toUpperCase();
        }

        donHang.setTrangThaiThanhToan(normalized);
        donHangRepository.save(donHang);
    }

    @Override
    public ThongKeBanHangResponse thongKeBanHang() {
        long tongDonHang = donHangRepository.count();
        long choXuLy = donHangRepository.countByTrangThaiDonHang("CHO_XU_LY");
        long hoanThanh = donHangRepository.countByTrangThaiDonHang("HOAN_THANH");
        BigDecimal doanhThu = donHangRepository.sumThanhTienByTrangThaiDonHang("HOAN_THANH");

        ThongKeBanHangResponse response = new ThongKeBanHangResponse();
        response.setTongDonHang(tongDonHang);
        response.setChoXuLy(choXuLy);
        response.setHoanThanh(hoanThanh);
        response.setDoanhThuHomNay(doanhThu != null ? doanhThu : BigDecimal.ZERO);
        return response;
    }

    @Override
    @Transactional
    public void xoaDonHang(Integer id) {
        DonHang donHang = donHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + id));

        // Chỉ cho phép xóa khi đơn hàng đã bị hủy để đảm bảo toàn vẹn dữ liệu
        String status = String.valueOf(donHang.getTrangThaiDonHang() == null ? "" : donHang.getTrangThaiDonHang()).toUpperCase();
        if (!"DA_HUY".equals(status) && !"HUY".equals(status) && !"CANCELLED".equals(status)) {
            throw new RuntimeException("Chỉ được xóa đơn hàng khi trạng thái là ĐÃ HỦY.");
        }

        // Thông báo hủy/xóa đơn hàng do DB trigger xử lý (không tạo trong service)

        // Hoàn kho, hoàn điểm, hoàn voucher...
        // (Cần thêm logic chi tiết ở đây nếu trạng thái đơn hàng không phải là đã hủy)

        // Xóa các bản ghi phụ thuộc trước
        // Repository interfaces don't expose deleteByDonHang_MaDonHang; fetch the
        // related entities and delete them via repository.deleteAll(...) to keep
        // behavior explicit and avoid adding custom repository methods.
        List<GiaoDichThanhToan> giaoDichList = giaoDichThanhToanRepository.findByDonHang_MaDonHang(id);
        if (giaoDichList != null && !giaoDichList.isEmpty()) {
            giaoDichThanhToanRepository.deleteAll(giaoDichList);
        }

        List<LichSuTrangThaiDonHang> lichSuList = lichSuTrangThaiDonHangRepository
                .findByDonHangOrderByThoiGianThayDoiDesc(id);
        if (lichSuList != null && !lichSuList.isEmpty()) {
            lichSuTrangThaiDonHangRepository.deleteAll(lichSuList);
        }

        // Jpa tự xử lý xóa ChiTietDonHang nhờ CascadeType.ALL

        // Cuối cùng xóa đơn hàng
        donHangRepository.delete(donHang);
    }

    private DonHangResponse mapToResponse(DonHang donHang) {
        DonHangResponse response = new DonHangResponse();
        response.setMaDonHang(donHang.getMaDonHang());
        if (donHang.getKhachHang() != null) {
            response.setTenKhachHang(donHang.getKhachHang().getHoTen());
            response.setSoDienThoaiKhachHang(donHang.getKhachHang().getSoDienThoai());
            response.setEmailKhachHang(donHang.getKhachHang().getEmail());
        }
        response.setNgayDatHang(donHang.getNgayDatHang());
        if (donHang.getNgayDatHang() != null) {
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter
                    .ofPattern("yyyy-MM-dd HH:mm:ss");
            response.setNgayDatHangStr(donHang.getNgayDatHang().format(fmt));
        }
        response.setTrangThai(donHang.getTrangThaiDonHang());
        response.setDiaChiGiaoHang(donHang.getDiaChiGiaoHang());
        response.setPhuongThucThanhToan(donHang.getPhuongThucThanhToan());
        response.setTrangThaiThanhToan(donHang.getTrangThaiThanhToan());
        response.setTongTienGoc(donHang.getTongTienGoc());
        response.setGiamGiaVoucher(donHang.getGiamGiaVoucher());
        response.setDiemThuongSuDung(donHang.getDiemThuongSuDung());
        response.setGiamGiaDiemThuong(donHang.getGiamGiaDiemThuong());
        response.setGiamGiaVip(donHang.getGiamGiaVip());
        response.setDiemThuongNhanDuoc(donHang.getDiemThuongNhanDuoc());
        // Compute total discount (VIP + Voucher + Điểm) for convenience on frontend
        java.math.BigDecimal vipDisc = donHang.getGiamGiaVip() != null ? donHang.getGiamGiaVip()
                : java.math.BigDecimal.ZERO;
        java.math.BigDecimal vouDisc = donHang.getGiamGiaVoucher() != null ? donHang.getGiamGiaVoucher()
                : java.math.BigDecimal.ZERO;
        java.math.BigDecimal diemDisc = donHang.getGiamGiaDiemThuong() != null ? donHang.getGiamGiaDiemThuong()
                : java.math.BigDecimal.ZERO;
        response.setTongGiamGia(vipDisc.add(vouDisc).add(diemDisc));
        response.setChiPhiDichVu(donHang.getPhiGiaoHang());
        response.setThanhTien(donHang.getThanhTien());
        if (donHang.getVoucher() != null) {
            response.setVoucherCode(donHang.getVoucher().getMaCode());
        }

        if (donHang.getChiTietDonHangs() != null) {
            List<ChiTietDonHangResponse> chiTietList = donHang.getChiTietDonHangs().stream()
                    .map(ct -> {
                        BienTheSanPham bienThe = ct.getBienThe();
                        SanPham sanPham = bienThe != null ? bienThe.getSanPham() : null;

                        // Đảm bảo lấy đúng giá từ chi tiết đơn hàng
                        BigDecimal donGiaGoc = ct.getDonGiaGoc() != null ? ct.getDonGiaGoc() : BigDecimal.ZERO;
                        BigDecimal donGiaThucTe = ct.getDonGiaThucTe() != null ? ct.getDonGiaThucTe() : donGiaGoc;
                        BigDecimal thanhTien = donGiaThucTe.multiply(BigDecimal.valueOf(ct.getSoLuong()));

                        return new ChiTietDonHangResponse(
                                sanPham != null ? sanPham.getTenSanPham() : "N/A",
                                bienThe != null ? bienThe.getSku() : "N/A",
                                ct.getSoLuong(),
                                donGiaGoc, // donGia (for backward compatibility)
                                donGiaGoc, // donGiaGoc - giá gốc
                                donGiaThucTe, // donGiaThucTe - giá thực tế sau giảm
                                thanhTien); // thành tiền = donGiaThucTe * soLuong
                    }).collect(Collectors.toList());
            response.setChiTietDonHangList(chiTietList);
        }

        return response;
    }
}