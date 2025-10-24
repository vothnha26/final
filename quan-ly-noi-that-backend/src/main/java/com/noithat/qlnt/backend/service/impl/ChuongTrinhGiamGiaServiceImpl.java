package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.*;
import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.entity.*;
import com.noithat.qlnt.backend.exception.ResourceNotFoundException;
import com.noithat.qlnt.backend.repository.*;
import com.noithat.qlnt.backend.service.IChuongTrinhGiamGiaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChuongTrinhGiamGiaServiceImpl implements IChuongTrinhGiamGiaService {

    private final ChuongTrinhGiamGiaRepository chuongTrinhGiamGiaRepository;
    private final BienTheGiamGiaRepository bienTheGiamGiaRepository;
    private final BienTheSanPhamRepository bienTheSanPhamRepository;

    public ChuongTrinhGiamGiaServiceImpl(ChuongTrinhGiamGiaRepository chuongTrinhGiamGiaRepository,
            BienTheGiamGiaRepository bienTheGiamGiaRepository,
            BienTheSanPhamRepository bienTheSanPhamRepository) {
        this.chuongTrinhGiamGiaRepository = chuongTrinhGiamGiaRepository;
        this.bienTheGiamGiaRepository = bienTheGiamGiaRepository;
        this.bienTheSanPhamRepository = bienTheSanPhamRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChuongTrinhGiamGia> getAll() {
        List<ChuongTrinhGiamGia> list = chuongTrinhGiamGiaRepository.findAll();
        // initialize and load variant-level discount mappings to avoid lazy-loading
        // issues
        for (ChuongTrinhGiamGia ct : list) {
            if (ct.getBienTheGiamGias() != null) {
                ct.getBienTheGiamGias().forEach(btg -> {
                    if (btg.getBienTheSanPham() != null)
                        btg.getBienTheSanPham().getMaBienThe();
                    if (btg.getChuongTrinhGiamGia() != null)
                        btg.getChuongTrinhGiamGia().getMaChuongTrinhGiamGia();
                });
            }
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public ChuongTrinhGiamGia getById(Integer id) {
        ChuongTrinhGiamGia ct = chuongTrinhGiamGiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình ID: " + id + " không tồn tại."));
        // initialize variant-level discount mappings
        if (ct.getBienTheGiamGias() != null) {
            ct.getBienTheGiamGias().forEach(btg -> {
                if (btg.getBienTheSanPham() != null)
                    btg.getBienTheSanPham().getMaBienThe();
                if (btg.getChuongTrinhGiamGia() != null)
                    btg.getChuongTrinhGiamGia().getMaChuongTrinhGiamGia();
            });
        }
        return ct;
    }

    @Override
    @Transactional
    public ChuongTrinhGiamGia create(String ten, LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ.");
        }
        ChuongTrinhGiamGia ct = new ChuongTrinhGiamGia();
        ct.setTenChuongTrinh(ten);
        ct.setNgayBatDau(start);
        ct.setNgayKetThuc(end);
        return chuongTrinhGiamGiaRepository.save(ct);
    }

    @Override
    @Transactional
    public ChuongTrinhGiamGia create(ChuongTrinhGiamGiaRequest request) {
        if (request.getNgayBatDau() == null || request.getNgayKetThuc() == null ||
                request.getNgayKetThuc().isBefore(request.getNgayBatDau())) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ.");
        }
        ChuongTrinhGiamGia ct = new ChuongTrinhGiamGia();
        ct.setTenChuongTrinh(request.getTenChuongTrinh());
        ct.setMoTa(request.getMoTa());
        ct.setNgayBatDau(request.getNgayBatDau());
        ct.setNgayKetThuc(request.getNgayKetThuc());
        ct.setTrangThai(request.getTrangThai());
        ct.setLoaiGiamGia(request.getLoaiGiamGia());
        ct.setGiaTriGiam(request.getGiaTriGiam());
        return chuongTrinhGiamGiaRepository.save(ct);
    }

    @Override
    @Transactional
    public ChuongTrinhGiamGia update(Integer id, String ten, LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ.");
        }
        ChuongTrinhGiamGia ct = getById(id);
        ct.setTenChuongTrinh(ten);
        ct.setNgayBatDau(start);
        ct.setNgayKetThuc(end);
        return chuongTrinhGiamGiaRepository.save(ct);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        ChuongTrinhGiamGia ct = getById(id);
        chuongTrinhGiamGiaRepository.delete(ct);
    }

    @Override
    @Transactional
    public void updateStatus(Integer id, String trangThai) {
        ChuongTrinhGiamGia ct = getById(id);
        ct.setTrangThai(trangThai);
        chuongTrinhGiamGiaRepository.save(ct);
    }

    // Variant-level discount operations removed. This service now manages
    // product-level mappings only.

    @Override
    @Transactional
    public ChuongTrinhGiamGiaResponse createWithDetails(ChuongTrinhGiamGiaDetailRequest request) {
        if (request.getNgayBatDau() == null || request.getNgayKetThuc() == null
                || request.getNgayKetThuc().isBefore(request.getNgayBatDau())) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ.");
        }

        ChuongTrinhGiamGia ct = new ChuongTrinhGiamGia();
        ct.setTenChuongTrinh(request.getTenChuongTrinh());
        ct.setMoTa(request.getMoTa());
        ct.setNgayBatDau(request.getNgayBatDau());
        ct.setNgayKetThuc(request.getNgayKetThuc());
        ct.setTrangThai(request.getTrangThai() != null ? request.getTrangThai() : "tạm dừng");
        ct.setLoaiGiamGia(request.getLoaiGiamGia());
        ct.setGiaTriGiam(request.getGiaTriGiam());
        ct = chuongTrinhGiamGiaRepository.save(ct);

        // Create variant-level discount mappings
        if (request.getDanhSachBienThe() != null && !request.getDanhSachBienThe().isEmpty()) {
            for (BienTheGiamGiaRequest btReq : request.getDanhSachBienThe()) {
                // Validate that variant exists
                if (!bienTheSanPhamRepository.existsById(btReq.getMaBienThe())) {
                    throw new ResourceNotFoundException("Biến thể không tồn tại: " + btReq.getMaBienThe());
                }

                // Create new mapping with embedded ID set first
                BienTheGiamGia.BienTheGiamGiaId id = new BienTheGiamGia.BienTheGiamGiaId();
                id.setMaBienThe(btReq.getMaBienThe());
                id.setMaChuongTrinhGiamGia(ct.getMaChuongTrinhGiamGia());

                BienTheGiamGia btg = new BienTheGiamGia();
                btg.setId(id);
                // Don't set the relationships - the embedded ID handles the FK columns
                // btg.setBienTheSanPham(bt);
                // btg.setChuongTrinhGiamGia(ct);
                btg.setGiaSauGiam(btReq.getGiaSauGiam());

                bienTheGiamGiaRepository.save(btg);
            }
        }

        return convertToResponse(ct, true);
    }

    @Override
    @Transactional
    public ChuongTrinhGiamGiaResponse updateWithDetails(Integer id, ChuongTrinhGiamGiaDetailRequest request) {
        if (request.getNgayBatDau() == null || request.getNgayKetThuc() == null
                || request.getNgayKetThuc().isBefore(request.getNgayBatDau())) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ.");
        }

        ChuongTrinhGiamGia ct = getById(id);
        ct.setTenChuongTrinh(request.getTenChuongTrinh());
        ct.setMoTa(request.getMoTa());
        ct.setNgayBatDau(request.getNgayBatDau());
        ct.setNgayKetThuc(request.getNgayKetThuc());
        ct.setTrangThai(request.getTrangThai() != null ? request.getTrangThai() : "tạm dừng");
        ct.setLoaiGiamGia(request.getLoaiGiamGia());
        ct.setGiaTriGiam(request.getGiaTriGiam());
        ct = chuongTrinhGiamGiaRepository.save(ct);

        // Validate incoming variant IDs first to avoid deleting existing mappings
        // and then failing while creating new ones (which would rollback deletes).
        if (request.getDanhSachBienThe() != null && !request.getDanhSachBienThe().isEmpty()) {
            for (BienTheGiamGiaRequest btReq : request.getDanhSachBienThe()) {
                if (!bienTheSanPhamRepository.existsById(btReq.getMaBienThe())) {
                    throw new ResourceNotFoundException("Biến thể không tồn tại: " + btReq.getMaBienThe());
                }
            }
        }

        // Remove existing variant-level mappings for this program
        List<BienTheGiamGia> oldItems = bienTheGiamGiaRepository.findByChuongTrinhGiamGia_MaChuongTrinhGiamGia(id);
        ct.getBienTheGiamGias().clear();
        bienTheGiamGiaRepository.deleteAll(oldItems);
        bienTheGiamGiaRepository.flush();

        // Create new variant-level discount mappings
        if (request.getDanhSachBienThe() != null && !request.getDanhSachBienThe().isEmpty()) {
            for (BienTheGiamGiaRequest btReq : request.getDanhSachBienThe()) {
                // Validate that variant exists
                if (!bienTheSanPhamRepository.existsById(btReq.getMaBienThe())) {
                    throw new ResourceNotFoundException("Biến thể không tồn tại: " + btReq.getMaBienThe());
                }

                // Create new mapping with embedded ID set first
                BienTheGiamGia.BienTheGiamGiaId btgId = new BienTheGiamGia.BienTheGiamGiaId();
                btgId.setMaBienThe(btReq.getMaBienThe());
                btgId.setMaChuongTrinhGiamGia(ct.getMaChuongTrinhGiamGia());

                BienTheGiamGia btg = new BienTheGiamGia();
                btg.setId(btgId);
                // Don't set the relationships - the embedded ID handles the FK columns
                // btg.setBienTheSanPham(bt);
                // btg.setChuongTrinhGiamGia(ct);
                btg.setGiaSauGiam(btReq.getGiaSauGiam());

                bienTheGiamGiaRepository.save(btg);
            }
        }

        return convertToResponse(ct, true);
    }

    @Override
    public ChuongTrinhGiamGiaResponse getDetailById(Integer id) {
        ChuongTrinhGiamGia ct = getById(id);
        return convertToResponse(ct, true);
    }

    @Override
    public List<ChuongTrinhGiamGiaResponse> getAllWithDetails() {
        return chuongTrinhGiamGiaRepository.findAll().stream()
                .map(ct -> convertToResponse(ct, true))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChuongTrinhGiamGiaResponse> getAllSummaries() {
        return chuongTrinhGiamGiaRepository.findAll().stream()
                .map(ct -> convertToResponse(ct, false))
                .collect(Collectors.toList());
    }

    private ChuongTrinhGiamGiaResponse convertToResponse(ChuongTrinhGiamGia ct, boolean includeDetails) {
        // Build variant-level discount mapping list (BienTheGiamGia ->
        // BienTheGiamGiaResponse)
        List<BienTheGiamGiaResponse> bienTheResponses = ct.getBienTheGiamGias() != null
                ? ct.getBienTheGiamGias().stream().map(btg -> {
                    Integer maBienThe = btg.getId() != null ? btg.getId().getMaBienThe() : null;
                    BienTheGiamGiaResponse.BienTheGiamGiaResponseBuilder b = BienTheGiamGiaResponse.builder()
                            .maBienThe(maBienThe)
                            .maChuongTrinhGiamGia(ct.getMaChuongTrinhGiamGia())
                            .giaSauGiam(btg.getGiaSauGiam());

                    if (includeDetails && maBienThe != null) {
                        // load variant info (sku, giaGoc)
                        bienTheSanPhamRepository.findById(maBienThe).ifPresent(bienThe -> {
                            b.skuBienThe(bienThe.getSku());
                            b.giaGoc(bienThe.getGiaBan());
                            // compute phanTramGiam: (giaGoc - giaSau)/giaGoc * 100
                            if (bienThe.getGiaBan() != null && btg.getGiaSauGiam() != null
                                    && bienThe.getGiaBan().compareTo(java.math.BigDecimal.ZERO) > 0) {
                                java.math.BigDecimal diff = bienThe.getGiaBan().subtract(btg.getGiaSauGiam());
                                java.math.BigDecimal pct = diff.multiply(new java.math.BigDecimal(100))
                                        .divide(bienThe.getGiaBan(), 2, java.math.RoundingMode.HALF_UP);
                                b.phanTramGiam(pct);
                            }
                        });
                    }

                    return b.build();
                }).collect(Collectors.toList())
                : List.of();

        // compute estimated total savings if details requested
        java.math.BigDecimal tongTietKiem = java.math.BigDecimal.ZERO;
        if (includeDetails) {
            for (BienTheGiamGiaResponse br : bienTheResponses) {
                if (br.getGiaGoc() != null && br.getGiaSauGiam() != null) {
                    tongTietKiem = tongTietKiem.add(br.getGiaGoc().subtract(br.getGiaSauGiam()));
                }
            }
        }

        // Convert program status (String) into human-friendly Vietnamese strings based
        // on value and dates
        String statusString = "Không xác định";
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String rawStatus = ct.getTrangThai();
        if (rawStatus == null || rawStatus.trim().isEmpty()) {
            statusString = "Không xác định";
        } else {
            String s = rawStatus.trim().toLowerCase();
            if (s.contains("tạm") || s.contains("tam") || s.contains("pause")) {
                statusString = "tạm dừng";
            } else if (s.contains("sắp") || s.contains("sap") || s.contains("upcoming")) {
                statusString = "sắp diễn ra";
            } else if (s.contains("kết thúc") || s.contains("ket thuc") || s.contains("da ket")
                    || s.contains("expired")) {
                statusString = "đã kết thúc";
            } else if (s.contains("đang") || s.contains("dang") || s.contains("active") || s.equals("true")) {
                if (ct.getNgayBatDau() != null && ct.getNgayKetThuc() != null) {
                    if (now.isBefore(ct.getNgayBatDau()))
                        statusString = "sắp diễn ra";
                    else if (!now.isBefore(ct.getNgayBatDau()) && !now.isAfter(ct.getNgayKetThuc()))
                        statusString = "đang hoạt động";
                    else
                        statusString = "đã kết thúc";
                } else {
                    statusString = "đang hoạt động";
                }
            } else {
                // fallback to date-based detection
                if (ct.getNgayBatDau() != null && ct.getNgayKetThuc() != null) {
                    if (now.isBefore(ct.getNgayBatDau()))
                        statusString = "sắp diễn ra";
                    else if (!now.isBefore(ct.getNgayBatDau()) && !now.isAfter(ct.getNgayKetThuc()))
                        statusString = "đang hoạt động";
                    else
                        statusString = "đã kết thúc";
                } else {
                    statusString = rawStatus;
                }
            }
        }

        // Group variant responses by parent product for clearer UI
        java.util.Map<Integer, SanPhamKhuyenMaiResponse> productMap = new java.util.HashMap<>();
        if (includeDetails) {
            for (BienTheGiamGiaResponse br : bienTheResponses) {
                Integer maSanPham = br.getMaSanPham();
                String tenSanPham = br.getTenSanPham();
                if (maSanPham == null) {
                    // attempt to load from DB if not present
                    if (br.getMaBienThe() != null) {
                        bienTheSanPhamRepository.findById(br.getMaBienThe()).ifPresent(bt -> {
                            Integer parentId = bt.getSanPham() != null ? bt.getSanPham().getMaSanPham() : null;
                            String parentTen = bt.getSanPham() != null ? bt.getSanPham().getTenSanPham() : null;
                            if (parentId != null) {
                                SanPhamKhuyenMaiResponse spr = productMap.get(parentId);
                                if (spr == null) {
                                    spr = SanPhamKhuyenMaiResponse.builder()
                                            .maSanPham(parentId)
                                            .tenSanPham(parentTen)
                                            .bienTheGiamGias(new java.util.ArrayList<>())
                                            .build();
                                    productMap.put(parentId, spr);
                                }
                                spr.getBienTheGiamGias().add(br);
                            }
                        });
                    }
                } else {
                    SanPhamKhuyenMaiResponse spr = productMap.get(maSanPham);
                    if (spr == null) {
                        spr = SanPhamKhuyenMaiResponse.builder()
                                .maSanPham(maSanPham)
                                .tenSanPham(tenSanPham)
                                .bienTheGiamGias(new java.util.ArrayList<>())
                                .build();
                        productMap.put(maSanPham, spr);
                    }
                    spr.getBienTheGiamGias().add(br);
                }
            }
        }

        java.util.List<SanPhamKhuyenMaiResponse> sanPhamList = includeDetails
                ? new java.util.ArrayList<>(productMap.values())
                : List.of();

        return ChuongTrinhGiamGiaResponse.builder()
                .maChuongTrinhGiamGia(ct.getMaChuongTrinhGiamGia())
                .tenChuongTrinh(ct.getTenChuongTrinh())
                .moTa(ct.getMoTa())
                .ngayBatDau(ct.getNgayBatDau())
                .ngayKetThuc(ct.getNgayKetThuc())
                .trangThai(statusString)
                .loaiGiamGia(ct.getLoaiGiamGia())
                .giaTriGiam(ct.getGiaTriGiam())
                .soLuongBienThe(bienTheResponses.size())
                .danhSachBienThe(includeDetails ? bienTheResponses : List.of())
                .tongTietKiem(includeDetails ? tongTietKiem : null)
                .danhSachSanPham(sanPhamList)
                .build();
    }

    @Override
    public BienTheSanPhamGiaResponse getBienTheGiaChiTiet(Integer maBienThe) {
        BienTheSanPham bienThe = bienTheSanPhamRepository.findById(maBienThe)
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại: " + maBienThe));

        java.math.BigDecimal giaBanGoc = bienThe.getGiaBan();
        java.math.BigDecimal bestPrice = giaBanGoc != null ? giaBanGoc : java.math.BigDecimal.ZERO;
        boolean hasDiscount = false;

        // Find variant-level discount mappings
        List<BienTheGiamGia> mappings = bienTheGiamGiaRepository.findByBienTheSanPham_MaBienThe(maBienThe);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        for (BienTheGiamGia btg : mappings) {
            ChuongTrinhGiamGia ct = btg.getChuongTrinhGiamGia();
            if (ct == null)
                continue;

            // Determine if the program should be considered active based on its textual
            // status and dates
            String rawStatus = ct.getTrangThai();
            boolean isActive = true;
            if (rawStatus != null) {
                String s = rawStatus.trim().toLowerCase();
                if (s.contains("tạm") || s.contains("tam") || s.contains("pause") || s.contains("pause")) {
                    isActive = false;
                } else if (s.contains("sắp") || s.contains("sap") || s.contains("upcoming")) {
                    isActive = false;
                } else if (s.contains("kết thúc") || s.contains("ket thuc") || s.contains("da ket")
                        || s.contains("expired")) {
                    isActive = false;
                }
            }
            if (!isActive)
                continue;

            if (ct.getNgayBatDau() != null && ct.getNgayKetThuc() != null) {
                if (ct.getNgayBatDau().isAfter(now) || ct.getNgayKetThuc().isBefore(now))
                    continue;
            }

            // Use explicit giaSauGiam if available in the mapping
            java.math.BigDecimal candidate = btg.getGiaSauGiam();
            if (candidate != null && candidate.compareTo(bestPrice) < 0) {
                bestPrice = candidate;
                hasDiscount = true;
            }
        }

        BienTheSanPhamGiaResponse resp = BienTheSanPhamGiaResponse.builder()
                .maBienThe(bienThe.getMaBienThe())
                .sku(bienThe.getSku())
                .tenSanPham(bienThe.getSanPham() != null ? bienThe.getSanPham().getTenSanPham() : null)
                .giaBanGoc(giaBanGoc)
                .giaHienThi(bestPrice)
                .coGiamGia(hasDiscount)
                .build();

        return resp;
    }
}
