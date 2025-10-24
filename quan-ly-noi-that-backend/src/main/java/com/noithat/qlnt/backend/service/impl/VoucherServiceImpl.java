package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.VoucherApplyRequest;
import com.noithat.qlnt.backend.dto.request.VoucherCreationRequest;
import com.noithat.qlnt.backend.dto.response.VoucherApplyResponse;
import com.noithat.qlnt.backend.dto.response.VoucherResponse;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.Voucher;
import com.noithat.qlnt.backend.entity.VoucherHangThanhVien;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.repository.VoucherRepository;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.exception.InvalidVoucherException;
import com.noithat.qlnt.backend.exception.ResourceNotFoundException;
import com.noithat.qlnt.backend.service.IVoucherService;
import com.noithat.qlnt.backend.service.IKhachHangService;
import com.noithat.qlnt.backend.service.IChuongTrinhGiamGiaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class VoucherServiceImpl implements IVoucherService {

    private final VoucherRepository voucherRepository;
    private final IKhachHangService khachHangService;
    private final HangThanhVienRepository hangThanhVienRepository;
    private final IChuongTrinhGiamGiaService chuongTrinhGiamGiaService;

    public VoucherServiceImpl(VoucherRepository voucherRepository, IKhachHangService khachHangService,
            HangThanhVienRepository hangThanhVienRepository, IChuongTrinhGiamGiaService chuongTrinhGiamGiaService) {
        this.voucherRepository = voucherRepository;
        this.khachHangService = khachHangService;
        this.hangThanhVienRepository = hangThanhVienRepository;
        this.chuongTrinhGiamGiaService = chuongTrinhGiamGiaService;
    }

    @Override
    public List<com.noithat.qlnt.backend.dto.response.VoucherByTierResponse> getVouchersGroupedByTier() {
        List<HangThanhVien> hangs = hangThanhVienRepository.findAll();
        List<com.noithat.qlnt.backend.dto.response.VoucherByTierResponse> result = new java.util.ArrayList<>();
        for (HangThanhVien hang : hangs) {
            Integer maHang = hang.getMaHangThanhVien();
            List<Voucher> matched = voucherRepository.findAll().stream()
                    .filter(v -> {
                        if (Boolean.TRUE.equals(v.getApDungChoMoiNguoi()))
                            return true;
                        return v.getHanCheHangThanhVien().stream()
                                .anyMatch(link -> link.getHangThanhVien().getMaHangThanhVien().equals(maHang));
                    })
                    .collect(Collectors.toList());

            result.add(com.noithat.qlnt.backend.dto.response.VoucherByTierResponse.builder()
                    .maHangThanhVien(maHang)
                    .tenHang(hang.getTenHang())
                    .vouchers(matched.stream().map(this::convertToResponse).collect(Collectors.toList()))
                    .build());
        }

        List<Voucher> onlyPublic = voucherRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getApDungChoMoiNguoi()))
                .collect(Collectors.toList());
        if (!onlyPublic.isEmpty()) {
            result.add(com.noithat.qlnt.backend.dto.response.VoucherByTierResponse.builder()
                    .maHangThanhVien(0)
                    .tenHang("Mọi người")
                    .vouchers(onlyPublic.stream().map(this::convertToResponse).collect(Collectors.toList()))
                    .build());
        }

        return result;
    }

    @Override
    public List<VoucherResponse> getVouchersForTier(Integer maHangThanhVien) {
        hangThanhVienRepository.findById(maHangThanhVien)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hạng thành viên ID: " + maHangThanhVien + " không tồn tại."));

        List<Voucher> matched = voucherRepository.findAll().stream()
                .filter(v -> {
                    if (Boolean.TRUE.equals(v.getApDungChoMoiNguoi()))
                        return true;
                    return v.getHanCheHangThanhVien().stream()
                            .anyMatch(link -> link.getHangThanhVien().getMaHangThanhVien().equals(maHangThanhVien));
                })
                .collect(Collectors.toList());

        return matched.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Voucher assignTiersToVoucher(Integer maVoucher, List<Integer> maHangIds) {
        Voucher voucher = getById(maVoucher);
        voucher.getHanCheHangThanhVien().clear();
        if (maHangIds == null) {
            throw new InvalidVoucherException("Danh sách hạng không được null.");
        }

        // If empty list -> clear associations and make voucher apply to everyone
        if (maHangIds.isEmpty()) {
            voucher.setApDungChoMoiNguoi(true);
            return voucherRepository.save(voucher);
        }

        for (Integer hangId : maHangIds) {
            HangThanhVien hang = hangThanhVienRepository.findById(hangId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Hạng thành viên ID: " + hangId + " không tồn tại."));
            VoucherHangThanhVien link = new VoucherHangThanhVien();
            link.setVoucher(voucher);
            link.setHangThanhVien(hang);
            link.setId(
                    new VoucherHangThanhVien.VoucherHangThanhVienId(voucher.getMaVoucher(), hang.getMaHangThanhVien()));
            voucher.getHanCheHangThanhVien().add(link);
        }

        voucher.setApDungChoMoiNguoi(false);
        return voucherRepository.save(voucher);
    }

    @Override
    public List<Voucher> getEligibleVouchersForCustomer(Integer maKhachHang) {
        KhachHang khachHang = khachHangService.getKhachHangProfile(maKhachHang);
        Integer maHangThanhVien = khachHang.getHangThanhVien().getMaHangThanhVien();
        LocalDateTime now = LocalDateTime.now();

        return voucherRepository.findAll().stream()
                .filter(v -> v.getNgayBatDau().isBefore(now) && v.getNgayKetThuc().isAfter(now))
                .filter(v -> {
                    if (Boolean.TRUE.equals(v.getApDungChoMoiNguoi())) {
                        return true;
                    }
                    return v.getHanCheHangThanhVien().stream()
                            .anyMatch(link -> link.getHangThanhVien().getMaHangThanhVien().equals(maHangThanhVien));
                })
                .collect(Collectors.toList());
    }

    @Override
    public BigDecimal applyVoucher(VoucherApplyRequest request) {
        VoucherApplyResponse response = applyVoucherDetailed(request);
        return response.getSoTienGiam();
    }

    @Override
    public VoucherApplyResponse applyVoucherDetailed(VoucherApplyRequest request) {
        Voucher voucher = voucherRepository.findByMaCode(request.getMaCode())
                .orElseThrow(() -> new InvalidVoucherException("Mã Voucher không hợp lệ."));

        LocalDateTime now = LocalDateTime.now();
        if (voucher.getNgayBatDau().isAfter(now) || voucher.getNgayKetThuc().isBefore(now)) {
            throw new InvalidVoucherException("Voucher đã hết hạn hoặc chưa kích hoạt.");
        }

        // Kiểm tra trạng thái voucher (không cho phép sử dụng voucher bị tạm dừng)
        if ("KHONG_HOAT_DONG".equalsIgnoreCase(voucher.getTrangThai())) {
            throw new InvalidVoucherException("Voucher này đã bị tạm dừng.");
        }

        // Kiểm tra số lượng còn lại
        if (voucher.getSoLuongDaSuDung() >= voucher.getSoLuongToiDa()) {
            throw new InvalidVoucherException("Voucher đã hết số lượng sử dụng.");
        }

        if (Boolean.FALSE.equals(voucher.getApDungChoMoiNguoi())) {
            KhachHang khachHang = khachHangService.getKhachHangProfile(request.getMaKhachHang());
            Integer maHangThanhVien = khachHang.getHangThanhVien().getMaHangThanhVien();

            boolean isEligible = voucher.getHanCheHangThanhVien().stream()
                    .anyMatch(link -> link.getHangThanhVien().getMaHangThanhVien().equals(maHangThanhVien));

            if (!isEligible) {
                throw new InvalidVoucherException("Voucher này không áp dụng cho hạng thành viên của bạn.");
            }
        }

        java.math.BigDecimal tongTien = java.math.BigDecimal.ZERO;
        if (request.getItems() == null || request.getItems().isEmpty()) {
            if (request.getTongTienDonHang() != null) {
                tongTien = request.getTongTienDonHang();
            } else {
                throw new InvalidVoucherException("Danh sách sản phẩm không hợp lệ.");
            }
        } else {
            for (VoucherApplyRequest.Item it : request.getItems()) {
                var detail = chuongTrinhGiamGiaService.getBienTheGiaChiTiet(it.getBienTheId());
                java.math.BigDecimal price = detail.getGiaHienThi();
                java.math.BigDecimal qty = new java.math.BigDecimal(it.getQuantity());
                tongTien = tongTien.add(price.multiply(qty));
            }
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        BigDecimal giaTriDonHangToiThieu = voucher.getGiaTriDonHangToiThieu();
        if (giaTriDonHangToiThieu != null && tongTien.compareTo(giaTriDonHangToiThieu) < 0) {
            throw new InvalidVoucherException(
                String.format("Đơn hàng tối thiểu %,dđ để sử dụng voucher này.", 
                    giaTriDonHangToiThieu.longValue())
            );
        }

        BigDecimal giaTriGiam = voucher.getGiaTriGiam();
        BigDecimal soTienGiam;

        if ("PERCENTAGE".equalsIgnoreCase(voucher.getLoaiGiamGia())
                || "PERCENT".equalsIgnoreCase(voucher.getLoaiGiamGia())) {
            // Tính theo phần trăm
            soTienGiam = tongTien.multiply(giaTriGiam.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
            
            // Áp dụng giá trị giảm tối đa nếu có
            BigDecimal giaTriGiamToiDa = voucher.getGiaTriGiamToiDa();
            if (giaTriGiamToiDa != null && soTienGiam.compareTo(giaTriGiamToiDa) > 0) {
                soTienGiam = giaTriGiamToiDa;
            }
        } else if ("FIXED".equalsIgnoreCase(voucher.getLoaiGiamGia())) {
            // Giảm giá cố định
            soTienGiam = giaTriGiam;
        } else {
            throw new InvalidVoucherException("Loại giảm giá Voucher không xác định.");
        }

        // Đảm bảo số tiền giảm không vượt quá tổng tiền đơn hàng
        soTienGiam = soTienGiam.min(tongTien);

        return VoucherApplyResponse.builder()
                .success(true)
                .message("Áp dụng voucher thành công!")
                .maCode(voucher.getMaCode())
                .tongTienGoc(tongTien)
                .soTienGiam(soTienGiam)
                .tongTienSauGiam(tongTien.subtract(soTienGiam))
                .loaiGiamGia(voucher.getLoaiGiamGia())
                .giaTriGiam(voucher.getGiaTriGiam())
                .build();
    }

    @Override
    public List<Voucher> getAll() {
        return voucherRepository.findAll();
    }

    @Override
    public Voucher getById(Integer id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher ID: " + id + " không tồn tại."));
    }

    @Override
    public java.util.Optional<Voucher> findByMaCodeOptional(String maCode) {
        return voucherRepository.findByMaCode(maCode);
    }

    @Override
    @Transactional
    public Voucher createVoucher(VoucherCreationRequest req) {
        validateDateRange(req.getNgayBatDau(), req.getNgayKetThuc());

        Voucher voucher = new Voucher();
        voucher.setMaCode(req.getMaCode());
        voucher.setTenVoucher(req.getTenVoucher());
        voucher.setMoTa(req.getMoTa());
        voucher.setLoaiGiamGia(req.getLoaiGiamGia());
        voucher.setGiaTriGiam(req.getGiaTriGiam());
        voucher.setGiaTriDonHangToiThieu(
                req.getGiaTriDonHangToiThieu() != null ? req.getGiaTriDonHangToiThieu() : BigDecimal.ZERO);
        voucher.setGiaTriGiamToiDa(req.getGiaTriGiamToiDa() != null ? req.getGiaTriGiamToiDa() : req.getGiaTriGiam());
        voucher.setNgayBatDau(req.getNgayBatDau());
        voucher.setNgayKetThuc(req.getNgayKetThuc());
        voucher.setSoLuongToiDa(req.getSoLuongToiDa() != null ? req.getSoLuongToiDa() : 1000);
        voucher.setSoLuongDaSuDung(0);
        voucher.setTrangThai(req.getTrangThai());
        voucher.setApDungChoMoiNguoi(req.getApDungChoMoiNguoi());

        if (Boolean.FALSE.equals(req.getApDungChoMoiNguoi())) {
            var provided = req.getMaHangThanhVienIds();
            var hangIds = new java.util.HashSet<Integer>();
            if (provided != null)
                hangIds.addAll(provided);

            if (hangIds.isEmpty()) {
                throw new InvalidVoucherException("Cần cấu hình danh sách hạng thành viên được áp dụng.");
            }

            var links = new HashSet<VoucherHangThanhVien>();
            for (Integer hangId : hangIds) {
                HangThanhVien hang = hangThanhVienRepository.findById(hangId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Hạng thành viên ID: " + hangId + " không tồn tại."));
                VoucherHangThanhVien link = new VoucherHangThanhVien();
                link.setVoucher(voucher);
                link.setHangThanhVien(hang);
                link.setId(new VoucherHangThanhVien.VoucherHangThanhVienId(null, hang.getMaHangThanhVien()));
                links.add(link);
            }
            voucher.setHanCheHangThanhVien(links);
        } else {
            voucher.setHanCheHangThanhVien(new HashSet<>());
        }

        return voucherRepository.save(voucher);
    }

    @Override
    @Transactional
    public Voucher updateVoucher(Integer id, VoucherCreationRequest req) {
        // Support partial updates: if a field in req is null, keep existing value
        Voucher voucher = getById(id);

        // Merge fields (only overwrite non-null fields)
        if (req.getMaCode() != null)
            voucher.setMaCode(req.getMaCode());
        if (req.getLoaiGiamGia() != null)
            voucher.setLoaiGiamGia(req.getLoaiGiamGia());
        if (req.getGiaTriGiam() != null)
            voucher.setGiaTriGiam(req.getGiaTriGiam());
        if (req.getGiaTriDonHangToiThieu() != null)
            voucher.setGiaTriDonHangToiThieu(req.getGiaTriDonHangToiThieu());
        if (req.getGiaTriGiamToiDa() != null)
            voucher.setGiaTriGiamToiDa(req.getGiaTriGiamToiDa());
        if (req.getSoLuongToiDa() != null)
            voucher.setSoLuongToiDa(req.getSoLuongToiDa());
        if (req.getTenVoucher() != null)
            voucher.setTenVoucher(req.getTenVoucher());
        if (req.getMoTa() != null)
            voucher.setMoTa(req.getMoTa());
        // If client provided a trangThai string, store it on entity (string enum)
        if (req.getTrangThai() != null) {
            voucher.setTrangThai(req.getTrangThai());
        }

        // Merge & validate dates (use existing values when not provided)
        LocalDateTime newStart = req.getNgayBatDau() != null ? req.getNgayBatDau() : voucher.getNgayBatDau();
        LocalDateTime newEnd = req.getNgayKetThuc() != null ? req.getNgayKetThuc() : voucher.getNgayKetThuc();
        validateDateRange(newStart, newEnd);
        voucher.setNgayBatDau(newStart);
        voucher.setNgayKetThuc(newEnd);

        if (req.getApDungChoMoiNguoi() != null) {
            voucher.setApDungChoMoiNguoi(req.getApDungChoMoiNguoi());
        }

        // Only update tier links if client explicitly provided maHangThanhVienIds
        // (PATCH semantics)
        if (req.getMaHangThanhVienIds() != null) {
            voucher.getHanCheHangThanhVien().clear();
            if (Boolean.FALSE.equals(voucher.getApDungChoMoiNguoi())) {
                if (req.getMaHangThanhVienIds().isEmpty()) {
                    // empty list means clear and set to everyone
                    voucher.setApDungChoMoiNguoi(true);
                } else {
                    for (Integer hangId : req.getMaHangThanhVienIds()) {
                        HangThanhVien hang = hangThanhVienRepository.findById(hangId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                        "Hạng thành viên ID: " + hangId + " không tồn tại."));
                        VoucherHangThanhVien link = new VoucherHangThanhVien();
                        link.setVoucher(voucher);
                        link.setHangThanhVien(hang);
                        link.setId(new VoucherHangThanhVien.VoucherHangThanhVienId(voucher.getMaVoucher(),
                                hang.getMaHangThanhVien()));
                        voucher.getHanCheHangThanhVien().add(link);
                    }
                    voucher.setApDungChoMoiNguoi(false);
                }
            } else {
                // if apDungChoMoiNguoi is true, ensure links cleared
                voucher.getHanCheHangThanhVien().clear();
            }
        }

        return voucherRepository.save(voucher);
    }

    @Override
    public void deleteVoucher(Integer id) {
        Voucher voucher = getById(id);
        voucherRepository.delete(voucher);
    }

    private void validateDateRange(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new InvalidVoucherException("Ngày bắt đầu và ngày kết thúc không được để trống.");
        }
        if (end.isBefore(start) || end.isEqual(start)) {
            throw new InvalidVoucherException("Ngày kết thúc phải lớn hơn ngày bắt đầu.");
        }
    }

    @Override
    public List<VoucherResponse> getAllVouchersWithDetails() {
        return voucherRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VoucherResponse getVoucherDetail(Integer id) {
        Voucher voucher = getById(id);
        return convertToResponse(voucher);
    }

    @Override
    public List<VoucherResponse> getEligibleVouchersWithDetails(Integer maKhachHang) {
        List<Voucher> vouchers = getEligibleVouchersForCustomer(maKhachHang);
        return vouchers.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private VoucherResponse convertToResponse(Voucher voucher) {
        String trangThai = voucher.getTrangThai();
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getNgayBatDau().isAfter(now)) {
            trangThai = "CHUA_BAT_DAU";
        } else if (voucher.getNgayKetThuc().isBefore(now)) {
            trangThai = "DA_HET_HAN";
        } else {
            trangThai = voucher.getTrangThai();
        }

        List<String> tenHangThanhVienApDung = new java.util.ArrayList<>();
        List<Integer> maHangThanhVienIds = new java.util.ArrayList<>();
        if (Boolean.FALSE.equals(voucher.getApDungChoMoiNguoi())
                && voucher.getHanCheHangThanhVien() != null) {
            tenHangThanhVienApDung = voucher.getHanCheHangThanhVien().stream()
                    .map(link -> link.getHangThanhVien().getTenHang())
                    .collect(Collectors.toList());
            maHangThanhVienIds = voucher.getHanCheHangThanhVien().stream()
                    .map(link -> link.getHangThanhVien().getMaHangThanhVien())
                    .collect(Collectors.toList());
        }

        return VoucherResponse.builder()
                .maVoucher(voucher.getMaVoucher())
                .tenVoucher(voucher.getTenVoucher())
                .maCode(voucher.getMaCode())
                .loaiGiamGia(voucher.getLoaiGiamGia())
                .giaTriGiam(voucher.getGiaTriGiam())
                .giaTriDonHangToiThieu(voucher.getGiaTriDonHangToiThieu())
                .giaTriGiamToiDa(voucher.getGiaTriGiamToiDa())
                .soLuongToiDa(voucher.getSoLuongToiDa())
                .soLuongDaSuDung(voucher.getSoLuongDaSuDung())
                .ngayBatDau(voucher.getNgayBatDau())
                .ngayKetThuc(voucher.getNgayKetThuc())
                .trangThai(voucher.getTrangThai())
                .apDungChoMoiNguoi(voucher.getApDungChoMoiNguoi())
                .moTa(voucher.getMoTa())
                .trangThai(trangThai)
                .tenHangThanhVienApDung(tenHangThanhVienApDung)
                .maHangThanhVienIds(maHangThanhVienIds)
                .build();
    }
}