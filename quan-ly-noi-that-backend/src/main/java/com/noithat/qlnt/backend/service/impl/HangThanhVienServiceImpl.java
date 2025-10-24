package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.HangThanhVienRequest;
import com.noithat.qlnt.backend.dto.response.HangThanhVienResponse;
import com.noithat.qlnt.backend.dto.response.VipBenefitResponse;
import com.noithat.qlnt.backend.dto.common.HangThanhVienDto;
import com.noithat.qlnt.backend.dto.common.VipKhachHangDto;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.service.IHangThanhVienService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.core.JsonProcessingException;

/**
 * Implementation của IHangThanhVienService
 * Xử lý logic nghiệp vụ quản lý hạng thành viên
 */
@Service
public class HangThanhVienServiceImpl implements IHangThanhVienService {

    @Autowired
    private HangThanhVienRepository hangThanhVienRepository;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private com.noithat.qlnt.backend.service.IVipBenefitService vipBenefitService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Page<HangThanhVienResponse> getAllHangThanhVien(Pageable pageable) {
        Page<HangThanhVien> hangPage = hangThanhVienRepository.findAll(pageable);
        return hangPage.map(this::convertToResponse);
    }

    @Override
    public List<HangThanhVienResponse> getAllHangThanhVien() {
        List<HangThanhVien> hangList = hangThanhVienRepository.findAllByOrderByDiemToiThieuAsc();
        return hangList.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HangThanhVienResponse getHangThanhVienById(Integer id) {
        HangThanhVien hang = hangThanhVienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + id));
        return convertToResponse(hang);
    }

    @Override
    @Transactional
    public HangThanhVienResponse createHangThanhVien(HangThanhVienRequest request) {
        // Kiểm tra tên hạng đã tồn tại
        if (hangThanhVienRepository.existsByTenHang(request.getTenHang())) {
            throw new IllegalArgumentException("Tên hạng thành viên đã tồn tại: " + request.getTenHang());
        }

        // Kiểm tra điểm tối thiểu đã tồn tại
        if (hangThanhVienRepository.existsByDiemToiThieu(request.getDiemToiThieu())) {
            throw new IllegalArgumentException("Điểm tối thiểu đã tồn tại: " + request.getDiemToiThieu());
        }

        HangThanhVien hang = new HangThanhVien();
        // required
        hang.setTenHang(request.getTenHang());
        hang.setDiemToiThieu(request.getDiemToiThieu());
        // optional richer fields
        if (request.getMoTa() != null)
            hang.setMoTa(request.getMoTa());
        if (request.getMauSac() != null)
            hang.setMauSac(request.getMauSac());
        if (request.getTrangThai() != null)
            hang.setTrangThai(request.getTrangThai());
        if (request.getIcon() != null)
            hang.setIcon(request.getIcon());

        HangThanhVien savedHang = hangThanhVienRepository.save(hang);
        // If request contains structured vipBenefits or legacy moTa, attempt to persist
        // them into vip_benefit table for convenience (non-blocking on failure).
        try {
            persistVipBenefitsFromRequest(savedHang.getMaHangThanhVien(), request);
        } catch (Exception ignored) {
            // Do not prevent hang creation if benefit persistence fails. Admin can
            // manage benefits separately via VipBenefit endpoints.
        }

        return convertToResponse(savedHang);
    }

    /**
     * Persist VipBenefit entries coming from the admin UI in the create/update
     * request. This supports two shapes:
     * - Structured: request.getVipBenefits() containing VipBenefitDto items.
     * - Legacy: request.getMoTa() as comma-separated descriptions -> saved as
     *   CUSTOM benefits.
     * This method is intentionally forgiving and runs inside the calling
     * transaction; failures are allowed to bubble so callers can decide handling.
     */
    private void persistVipBenefitsFromRequest(Integer maHang, HangThanhVienRequest request) {
        if (request.getVipBenefits() != null && !request.getVipBenefits().isEmpty()) {
            for (var vbDto : request.getVipBenefits()) {
                vbDto.setMaHangThanhVien(maHang);
                normalizeAndValidateVipBenefitParams(vbDto);
                vipBenefitService.save(vbDto);
            }
            return;
        }

        if (request.getMoTa() != null && !request.getMoTa().isBlank()) {
            String[] parts = request.getMoTa().split(",");
            for (String p : parts) {
                String desc = p.trim();
                if (desc.isEmpty())
                    continue;
                var vb = buildBenefitFromDescription(maHang, desc);
                vipBenefitService.save(vb);
            }
        }
    }

    /**
     * Normalize and validate params for a VipBenefitDto according to benefitType.
     * This builds a JSON string stored in dto.params.
     */
    private void normalizeAndValidateVipBenefitParams(com.noithat.qlnt.backend.dto.common.VipBenefitDto vbDto) {
        if (vbDto == null)
            return;

        String type = vbDto.getBenefitType();
        ObjectNode paramsNode = objectMapper.createObjectNode();

        // If params already provided as JSON string, try to parse and use it as base
        if (vbDto.getParams() != null && !vbDto.getParams().isBlank()) {
            try {
                JsonNode parsed = objectMapper.readTree(vbDto.getParams());
                if (parsed.isObject()) {
                    paramsNode.setAll((ObjectNode) parsed);
                }
            } catch (JsonProcessingException e) {
                // ignore and rebuild params from defaults
            }
        }

        try {
            if ("FREE_SHIPPING".equalsIgnoreCase(type)) {
                if (paramsNode.has("minOrder") && paramsNode.get("minOrder").isNumber()) {
                    long min = paramsNode.get("minOrder").asLong();
                    if (min < 0) paramsNode.put("minOrder", 0);
                }
            } else if ("PERCENT_DISCOUNT".equalsIgnoreCase(type)) {
                if (paramsNode.has("percent") && paramsNode.get("percent").isNumber()) {
                    double p = paramsNode.get("percent").asDouble();
                    if (p <= 0) paramsNode.put("percent", 0.0);
                    if (p > 100) paramsNode.put("percent", 100.0);
                } else {
                    paramsNode.put("percent", 0.0);
                }
                if (paramsNode.has("minOrder") && paramsNode.get("minOrder").isNumber()) {
                    long min = paramsNode.get("minOrder").asLong();
                    if (min < 0) paramsNode.put("minOrder", 0);
                }
            } else if ("BONUS_POINTS".equalsIgnoreCase(type)) {
                if (paramsNode.has("percent") && paramsNode.get("percent").isNumber()) {
                    double p = paramsNode.get("percent").asDouble();
                    if (p < 0) paramsNode.put("percent", 0.0);
                } else if (paramsNode.has("points") && paramsNode.get("points").isNumber()) {
                    int pts = paramsNode.get("points").asInt();
                    if (pts < 0) paramsNode.put("points", 0);
                } else {
                    paramsNode.put("percent", 0.0);
                }
            } else if ("PRIORITY_SHIPPING".equalsIgnoreCase(type)) {
                // no params required
            } else {
                // CUSTOM or unknown types: keep whatever paramsNode had
            }

            vbDto.setParams(paramsNode.toString());
        } catch (Exception ex) {
            vbDto.setParams("{}");
        }
    }

    /**
     * Build a VipBenefitDto from a free-text description when admin used `moTa`.
     * Simple heuristics:
     * - contains "%" or "giảm" + number => PERCENT_DISCOUNT
     * - contains "miễn phí" and "ship" => FREE_SHIPPING, try to extract minOrder
     * - contains "tích điểm" or "điểm" => BONUS_POINTS
     * - otherwise => CUSTOM
     */
    private com.noithat.qlnt.backend.dto.common.VipBenefitDto buildBenefitFromDescription(Integer maHang, String desc) {
        var dto = new com.noithat.qlnt.backend.dto.common.VipBenefitDto();
        dto.setMaHangThanhVien(maHang);
        dto.setDescription(desc);
        dto.setActive(true);

        String lowered = desc.toLowerCase();

        // percent discount: look for patterns like "5%" or "giảm 5%" or "giảm 5"
        java.util.regex.Matcher mPercent = java.util.regex.Pattern.compile("(\\d{1,3})(\\.?\\d*)\\s*%")
                .matcher(desc);
        if (mPercent.find()) {
            String num = mPercent.group(1) + mPercent.group(2);
            double percent = 0.0;
            try { percent = Double.parseDouble(num); } catch (Exception ignored) {}
            dto.setBenefitType("PERCENT_DISCOUNT");
            try {
                var node = objectMapper.createObjectNode();
                node.put("percent", percent);
                dto.setParams(node.toString());
            } catch (Exception ex) { dto.setParams("{}"); }
            return dto;
        }

        if (lowered.contains("miễn phí") && lowered.contains("ship")) {
            // try to find amounts like 200k or 200000
            java.util.regex.Matcher mAmount = java.util.regex.Pattern.compile("(\\d+[.,]?\\d*)\s*(k|vnđ|vnd)?", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(lowered);
            long minOrder = 0L;
            if (mAmount.find()) {
                String raw = mAmount.group(1).replaceAll("\\.", "").replaceAll(",", "");
                try {
                    double val = Double.parseDouble(raw);
                    if (mAmount.group(2) != null && mAmount.group(2).contains("k")) {
                        minOrder = (long)(val * 1000);
                    } else {
                        minOrder = (long) val;
                    }
                } catch (Exception ignored) {}
            }
            dto.setBenefitType("FREE_SHIPPING");
            try {
                var node = objectMapper.createObjectNode();
                node.put("minOrder", minOrder);
                dto.setParams(node.toString());
            } catch (Exception ex) { dto.setParams("{}"); }
            return dto;
        }

        if (lowered.contains("tích điểm") || lowered.contains("điểm")) {
            // try to extract percent
            java.util.regex.Matcher mPct = java.util.regex.Pattern.compile("(\\d{1,3})(\\.?\\d*)\\s*%")
                    .matcher(desc);
            if (mPct.find()) {
                double p = 0.0;
                try { p = Double.parseDouble(mPct.group(1) + mPct.group(2)); } catch (Exception ignored) {}
                dto.setBenefitType("BONUS_POINTS");
                try {
                    var node = objectMapper.createObjectNode();
                    node.put("percent", p);
                    dto.setParams(node.toString());
                } catch (Exception ex) { dto.setParams("{}"); }
                return dto;
            }
            // default bonus points
            dto.setBenefitType("BONUS_POINTS");
            dto.setParams("{\"percent\":0}");
            return dto;
        }

        // fallback: CUSTOM with empty params
        dto.setBenefitType("CUSTOM");
        dto.setParams("{}");
        return dto;
    }

    @Override
    @Transactional
    public HangThanhVienResponse updateHangThanhVien(Integer id, HangThanhVienRequest request) {
        HangThanhVien hang = hangThanhVienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + id));

        // Kiểm tra tên hạng đã tồn tại (trừ chính nó)
        if (!hang.getTenHang().equals(request.getTenHang()) &&
                hangThanhVienRepository.existsByTenHang(request.getTenHang())) {
            throw new IllegalArgumentException("Tên hạng thành viên đã tồn tại: " + request.getTenHang());
        }

        // Kiểm tra điểm tối thiểu đã tồn tại (trừ chính nó)
        if (!hang.getDiemToiThieu().equals(request.getDiemToiThieu()) &&
                hangThanhVienRepository.existsByDiemToiThieu(request.getDiemToiThieu())) {
            throw new IllegalArgumentException("Điểm tối thiểu đã tồn tại: " + request.getDiemToiThieu());
        }

        hang.setTenHang(request.getTenHang());
        hang.setDiemToiThieu(request.getDiemToiThieu());
        // update optional fields if provided
        if (request.getMoTa() != null)
            hang.setMoTa(request.getMoTa());
        if (request.getMauSac() != null)
            hang.setMauSac(request.getMauSac());
        if (request.getTrangThai() != null)
            hang.setTrangThai(request.getTrangThai());
        if (request.getIcon() != null)
            hang.setIcon(request.getIcon());

        HangThanhVien savedHang = hangThanhVienRepository.save(hang);
        // If admin provided vipBenefits in the update payload, attempt to persist them
        try {
            persistVipBenefitsFromRequest(savedHang.getMaHangThanhVien(), request);
        } catch (Exception ignored) {
            // fail-safe: do not prevent the update if benefit persistence fails
        }
        return convertToResponse(savedHang);
    }

    @Override
    @Transactional
    public HangThanhVienResponse updateHangThanhVienStatus(Integer id, Boolean trangThai) {
        HangThanhVien hang = hangThanhVienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + id));
        
        hang.setTrangThai(trangThai);
        HangThanhVien savedHang = hangThanhVienRepository.save(hang);
        return convertToResponse(savedHang);
    }

    @Override
    @Transactional
    public void deleteHangThanhVien(Integer id) {
        HangThanhVien hang = hangThanhVienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + id));

        // Kiểm tra có khách hàng nào đang sử dụng hạng này không
        long count = khachHangRepository.countByHangThanhVien_MaHangThanhVien(id);
        if (count > 0) {
            throw new IllegalStateException(
                    "Không thể xóa hạng thành viên này vì đang có " + count + " khách hàng sử dụng");
        }

        hangThanhVienRepository.delete(hang);
    }

    @Override
    public HangThanhVien xacDinhHangThanhVien(Integer diemThuong) {
        List<HangThanhVien> danhSachHang = hangThanhVienRepository.findAllByOrderByDiemToiThieuDesc();

        for (HangThanhVien hang : danhSachHang) {
            if (diemThuong >= hang.getDiemToiThieu()) {
                return hang;
            }
        }

        // Nếu không tìm thấy, trả về hạng thấp nhất
        return hangThanhVienRepository.findFirstByOrderByDiemToiThieuAsc()
                .orElseThrow(() -> new IllegalStateException("Không có hạng thành viên nào trong hệ thống"));
    }

    @Override
    @Transactional
    public void capNhatHangThanhVien(Integer maKhachHang) {
        KhachHang khachHang = khachHangRepository.findById(maKhachHang)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khách hàng với ID: " + maKhachHang));

        HangThanhVien hangMoi = xacDinhHangThanhVien(khachHang.getDiemThuong());

        if (!hangMoi.getMaHangThanhVien().equals(khachHang.getHangThanhVien().getMaHangThanhVien())) {
            khachHang.setHangThanhVien(hangMoi);
            khachHangRepository.save(khachHang);
        }
    }

    @Override
    public Map<String, Object> getThongKeHangThanhVien() {
        List<HangThanhVien> danhSachHang = hangThanhVienRepository.findAllByOrderByDiemToiThieuAsc();
        Map<String, Object> thongKe = new HashMap<>();

        long tongKhachHang = khachHangRepository.count();
        thongKe.put("tongKhachHang", tongKhachHang);

        Map<String, Long> thongKeTheoHang = new HashMap<>();
        for (HangThanhVien hang : danhSachHang) {
            long soLuong = khachHangRepository.countByHangThanhVien_MaHangThanhVien(hang.getMaHangThanhVien());
            thongKeTheoHang.put(hang.getTenHang(), soLuong);
        }
        thongKe.put("thongKeTheoHang", thongKeTheoHang);

        return thongKe;
    }

    @Override
    public List<HangThanhVienDto> getAllVipLevels() {
        List<HangThanhVien> hangList = hangThanhVienRepository.findAllByTrangThaiTrueOrderByDiemToiThieuAsc();
        return hangList.stream()
                .map(this::convertToVipDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HangThanhVienDto saveVipLevel(HangThanhVienDto dto) {
        HangThanhVien hang;

        if (dto.getMaHangThanhVien() != null) {
            hang = hangThanhVienRepository.findById(dto.getMaHangThanhVien())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Không tìm thấy hạng thành viên với ID: " + dto.getMaHangThanhVien()));
        } else {
            hang = new HangThanhVien();
        }

        // Cập nhật thông tin
        hang.setTenHang(dto.getTenHang());
        hang.setDiemToiThieu(dto.getDiemToiThieu());
        hang.setMoTa(dto.getMoTa());
        hang.setMauSac(dto.getMauSac());
        hang.setTrangThai(dto.getTrangThai() != null ? dto.getTrangThai() : true);
        hang.setIcon(dto.getIcon());

        HangThanhVien savedHang = hangThanhVienRepository.save(hang);
        // If the DTO provided structured vipBenefits, persist them to vip_benefit table
        try {
            if (dto.getVipBenefits() != null && !dto.getVipBenefits().isEmpty()) {
                for (var vbDto : dto.getVipBenefits()) {
                    vbDto.setMaHangThanhVien(savedHang.getMaHangThanhVien());
                    vipBenefitService.save(vbDto);
                }
            } else if (dto.getMoTa() != null && !dto.getMoTa().isBlank()) {
                // Fallback: admin UI previously sent plain moTa as comma-separated benefit
                // descriptions.
                String[] parts = dto.getMoTa().split(",");
                for (String p : parts) {
                    String desc = p.trim();
                    if (desc.isEmpty())
                        continue;
                    var vb = buildBenefitFromDescription(savedHang.getMaHangThanhVien(), desc);
                    vipBenefitService.save(vb);
                }
            }
        } catch (Exception ignored) {
            // Do not fail the whole save if benefits fail; they can be managed via separate
            // endpoints
        }

        return convertToVipDto(savedHang);
    }

    @Override
    public HangThanhVienDto getVipLevelById(Integer id) {
        HangThanhVien hang = hangThanhVienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + id));
        return convertToVipDto(hang);
    }

    @Override
    @Transactional
    public void deleteById(Integer id) {
        HangThanhVien hang = hangThanhVienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + id));

        // Kiểm tra có khách hàng nào đang sử dụng hạng này không
        long count = khachHangRepository.countByHangThanhVien_MaHangThanhVien(id);
        if (count > 0) {
            throw new IllegalStateException(
                    "Không thể xóa hạng thành viên này vì đang có " + count + " khách hàng sử dụng");
        }

        hangThanhVienRepository.delete(hang);
    }

    @Override
    public List<VipKhachHangDto> getVipCustomers(String level, String search) {
        List<KhachHang> khachHangs;

        if (level != null && !level.equals("all")) {
            // Filter theo level
            khachHangs = khachHangRepository.findByHangThanhVien_TenHang(level);
        } else {
            // Lấy tất cả
            khachHangs = khachHangRepository.findAll();
        }

        return khachHangs.stream()
                .filter(kh -> search == null || search.trim().isEmpty() ||
                        kh.getHoTen().toLowerCase().contains(search.toLowerCase()) ||
                        kh.getEmail().toLowerCase().contains(search.toLowerCase()) ||
                        kh.getSoDienThoai().contains(search))
                .map(this::convertToVipKhachHangDto)
                .collect(Collectors.toList());
    }

    @Override
    public VipBenefitResponse previewVipBenefits(Integer customerId, BigDecimal orderAmount) {
        KhachHang khachHang = khachHangRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khách hàng với ID: " + customerId));

        HangThanhVien hang = khachHang.getHangThanhVien();
        if (hang == null) {
            throw new RuntimeException("Khách hàng chưa có hạng thành viên");
        }

        return VipBenefitResponse.builder()
                .tenHangVip(hang.getTenHang())
                .levelCode(hang.getTenHang().toLowerCase())
                .mauSac(hang.getMauSac())
                .icon(hang.getIcon())
                .build();
    }

    @Override
    public HangThanhVien xacDinhHangTheoChiTieu(BigDecimal tongChiTieu) {
        // We no longer use monetary thresholds to determine VIP level.
        // Attempt to find a level by diemToiThieu (points) <= tongChiTieu converted to
        // int
        Integer points = tongChiTieu != null ? tongChiTieu.intValue() : 0;
        return hangThanhVienRepository
                .findTopByDiemToiThieuLessThanEqualAndTrangThaiTrueOrderByDiemToiThieuDesc(points)
                .orElse(hangThanhVienRepository.findFirstByTrangThaiTrueOrderByDiemToiThieuAsc()
                        .orElseThrow(() -> new RuntimeException("Không có hạng thành viên nào được kích hoạt")));
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Chuyển đổi entity sang response DTO
     */
    private HangThanhVienResponse convertToResponse(HangThanhVien hang) {
        long soLuongKhachHang = khachHangRepository.countByHangThanhVien_MaHangThanhVien(hang.getMaHangThanhVien());

        return HangThanhVienResponse.builder()
                .maHangThanhVien(hang.getMaHangThanhVien())
                .tenHang(hang.getTenHang())
                .diemToiThieu(hang.getDiemToiThieu())
                .soLuongKhachHang(soLuongKhachHang)
                .moTa(hang.getMoTa())
                .mauSac(hang.getMauSac() != null ? hang.getMauSac() : "#6B7280")
                .vipBenefits(vipBenefitService.findByHangThanhVien(hang.getMaHangThanhVien()))
                .trangThai(hang.getTrangThai() != null ? hang.getTrangThai() : true)
                .build();
    }

    /**
     * Chuyển đổi entity sang VIP DTO
     */
    private HangThanhVienDto convertToVipDto(HangThanhVien hang) {
        HangThanhVienDto dto = new HangThanhVienDto();
        dto.setMaHangThanhVien(hang.getMaHangThanhVien());
        dto.setTenHang(hang.getTenHang());
        dto.setDiemToiThieu(hang.getDiemToiThieu());
        dto.setMoTa(hang.getMoTa());
        dto.setMauSac(hang.getMauSac());
        dto.setTrangThai(hang.getTrangThai());
        dto.setIcon(hang.getIcon());

        // Tính toán thống kê
        long soLuongKhachHang = khachHangRepository.countByHangThanhVien_MaHangThanhVien(hang.getMaHangThanhVien());
        dto.setSoLuongKhachHang(soLuongKhachHang);

        // Set level code cho frontend
        dto.setLevel(hang.getTenHang().toLowerCase());

        return dto;
    }

    /**
     * Chuyển đổi KhachHang entity sang VipKhachHangDto
     */
    private VipKhachHangDto convertToVipKhachHangDto(KhachHang kh) {
        VipKhachHangDto dto = new VipKhachHangDto();
        dto.setMaKhachHang(kh.getMaKhachHang());
        dto.setHoTen(kh.getHoTen());
        dto.setEmail(kh.getEmail());
        dto.setSoDienThoai(kh.getSoDienThoai());
        dto.setDiaChi(kh.getDiaChi());
        dto.setDiemThuong(kh.getDiemThuong());
        dto.setTongChiTieu(kh.getTongChiTieu());
        dto.setTongDonHang(kh.getTongDonHang());
        dto.setNgayThamGia(kh.getNgayThamGia());
        dto.setDonHangCuoi(kh.getDonHangCuoi());
        dto.setTrangThaiVip(kh.getTrangThaiVip());

        // Thông tin hạng thành viên
        HangThanhVien hang = kh.getHangThanhVien();
        if (hang != null) {
            dto.setTenHang(hang.getTenHang());
            dto.setVipLevel(hang.getTenHang().toLowerCase());
            dto.setMauSac(hang.getMauSac());
            dto.setIcon(hang.getIcon());
        }

        return dto;
    }

    @Override
    public List<VipKhachHangDto> getKhachHangByHang(Integer maHangThanhVien) {
        // Kiểm tra hạng thành viên có tồn tại không
        HangThanhVien hang = hangThanhVienRepository.findById(maHangThanhVien)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hạng thành viên với ID: " + maHangThanhVien));

        // Lấy danh sách khách hàng thuộc hạng này
        List<KhachHang> khachHangs = khachHangRepository.findByHangThanhVien_MaHangThanhVien(maHangThanhVien);

        // Convert sang DTO
        return khachHangs.stream()
                .map(kh -> {
                    VipKhachHangDto dto = new VipKhachHangDto();
                    dto.setMaKhachHang(kh.getMaKhachHang());
                    dto.setHoTen(kh.getHoTen());
                    dto.setEmail(kh.getEmail());
                    dto.setSoDienThoai(kh.getSoDienThoai());
                    dto.setDiemThuong(kh.getDiemThuong());
                    dto.setTongChiTieu(kh.getTongChiTieu());
                    dto.setTongDonHang(kh.getTongDonHang());
                    dto.setNgayThamGia(kh.getNgayThamGia());
                    dto.setDonHangCuoi(kh.getDonHangCuoi());
                    dto.setTrangThaiVip(kh.getTrangThaiVip());
                    
                    // Set thông tin hạng thành viên
                    if (kh.getHangThanhVien() != null) {
                        dto.setTenHang(kh.getHangThanhVien().getTenHang());
                        dto.setMauSac(kh.getHangThanhVien().getMauSac());
                        dto.setIcon(kh.getHangThanhVien().getIcon());
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
